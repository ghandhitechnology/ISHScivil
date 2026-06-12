export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { serializeComplaint } from "@/lib/serialize";

/** GET /api/complaints/:id — 민원 상세. 작성자 식별값은 비노출. */
export async function GET(_req: Request, ctx: RouteContext<"/api/complaints/[id]">) {
  const { id } = await ctx.params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { author: { select: { role: true } } },
  });
  if (!complaint || complaint.status === "DELETED") {
    return NextResponse.json({ message: "민원을 찾을 수 없습니다." }, { status: 404 });
  }

  // 로그인 사용자가 이 민원에 이미 투표했는지 여부(버튼 상태용, 익명성 유지)
  let voted = false;
  const session = await getSession();
  if (session) {
    const v = await prisma.vote.findUnique({
      where: { userId_complaintId: { userId: session.userId, complaintId: id } },
    });
    voted = !!v;
  }

  return NextResponse.json({ complaint: serializeComplaint(complaint), voted });
}
