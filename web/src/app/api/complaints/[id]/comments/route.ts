import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkSuspended } from "@/lib/suspended";
import { serializeComment } from "@/lib/serialize";

/** GET /api/complaints/:id/comments — 토론 목록. 관리자는 숨김 댓글도 확인 가능. */
export async function GET(_req: Request, ctx: RouteContext<"/api/complaints/[id]">) {
  const { id } = await ctx.params;
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const comments = await prisma.comment.findMany({
    where: { complaintId: id, ...(isAdmin ? {} : { hidden: false }) },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { role: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => serializeComment(c, isAdmin)),
  });
}

const createSchema = z.object({ content: z.string().min(1).max(2000) });

/** POST /api/complaints/:id/comments — 토론 글 작성(인증 필요). */
export async function POST(req: Request, ctx: RouteContext<"/api/complaints/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const suspended = await checkSuspended(session);
  if (suspended) return suspended;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({ where: { id }, select: { id: true } });
  if (!complaint) return NextResponse.json({ message: "민원을 찾을 수 없습니다." }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { complaintId: id, authorId: session.userId, content: parsed.data.content },
    include: { author: { select: { role: true } } },
  });
  return NextResponse.json({ comment: serializeComment(comment) }, { status: 201 });
}
