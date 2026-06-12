export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/users/:id/comments — 특정 사용자의 댓글 열람(익명 해제) */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/users/[id]/comments">) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await ctx.params;

  const comments = await prisma.comment.findMany({
    where: { authorId: id },
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
