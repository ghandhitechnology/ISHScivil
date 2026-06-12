export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** GET /api/me/comments — 내가 남긴 의견 목록(해당 민원 제목 포함) */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const comments = await prisma.comment.findMany({
    where: { authorId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { complaint: { select: { id: true, title: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      comment_id: c.id,
      content: c.content,
      created_at: c.createdAt,
      complaint_id: c.complaint.id,
      complaint_title: c.complaint.title,
    })),
  });
}
