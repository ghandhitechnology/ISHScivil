import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/comments — 전체 댓글 목록(작성자 정보 포함, 익명 해제) */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, role: true, generation: true } },
      complaint: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      comment_id: c.id,
      content: c.content,
      created_at: c.createdAt,
      complaint_id: c.complaint.id,
      complaint_title: c.complaint.title,
      hidden: c.hidden,
      author: c.author,
    })),
  });
}
