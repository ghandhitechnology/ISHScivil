import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkSuspended } from "@/lib/suspended";

const DAILY_LIMIT = 10;

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * POST /api/complaints/:id/vote — 찬성 투표 (일일 10개 한도, 설계서 §4.1).
 * 트랜잭션 내에서 한도 검증 → Vote 생성 → Complaint.voteCount +1.
 */
export async function POST(_req: Request, ctx: RouteContext<"/api/complaints/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const suspended = await checkSuspended(session);
  if (suspended) return suspended;
  const { id } = await ctx.params;

  const complaint = await prisma.complaint.findUnique({ where: { id }, select: { status: true } });
  if (!complaint || complaint.status !== "ACTIVE") {
    return NextResponse.json({ message: "투표할 수 없는 민원입니다." }, { status: 400 });
  }

  const { start, end } = todayRange();

  try {
    const voteCount = await prisma.$transaction(async (tx) => {
      const todayCount = await tx.vote.count({
        where: { userId: session.userId, votedDate: { gte: start, lt: end } },
      });
      if (todayCount >= DAILY_LIMIT) {
        throw new LimitError();
      }
      await tx.vote.create({ data: { userId: session.userId, complaintId: id } });
      const updated = await tx.complaint.update({
        where: { id },
        data: { voteCount: { increment: 1 } },
        select: { voteCount: true },
      });
      return updated.voteCount;
    });

    const used = await prisma.vote.count({
      where: { userId: session.userId, votedDate: { gte: start, lt: end } },
    });
    return NextResponse.json({ voted: true, vote_count: voteCount, remaining: DAILY_LIMIT - used });
  } catch (e) {
    if (e instanceof LimitError) {
      return NextResponse.json(
        { message: "하루에 활성화할 수 있는 찬성표는 최대 10개입니다." },
        { status: 400 }
      );
    }
    // 복합 유니크 위반 = 이미 투표함
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ message: "이미 찬성한 민원입니다." }, { status: 409 });
    }
    throw e;
  }
}

/** DELETE /api/complaints/:id/vote — 찬성 취소. Vote 삭제 + voteCount -1, 일일 잔여 즉시 복구. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/complaints/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const suspended = await checkSuspended(session);
  if (suspended) return suspended;
  const { id } = await ctx.params;

  try {
    const voteCount = await prisma.$transaction(async (tx) => {
      await tx.vote.delete({
        where: { userId_complaintId: { userId: session.userId, complaintId: id } },
      });
      const updated = await tx.complaint.update({
        where: { id },
        // voteCount 가 0 미만이 되지 않도록 방어
        data: { voteCount: { decrement: 1 } },
        select: { voteCount: true },
      });
      if (updated.voteCount < 0) {
        await tx.complaint.update({ where: { id }, data: { voteCount: 0 } });
        return 0;
      }
      return updated.voteCount;
    });
    return NextResponse.json({ voted: false, vote_count: voteCount });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "찬성 기록이 없습니다." }, { status: 404 });
    }
    throw e;
  }
}

class LimitError extends Error {}
