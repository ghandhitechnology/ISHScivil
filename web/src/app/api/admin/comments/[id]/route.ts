import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** PATCH /api/admin/comments/:id — 댓글 숨김/해제 토글 */
export async function PATCH(_req: Request, ctx: RouteContext<"/api/admin/comments/[id]">) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await ctx.params;

  const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
  if (!comment) {
    return NextResponse.json({ message: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.comment.update({
    where: { id: comment.id },
    data: { hidden: !comment.hidden },
  });

  return NextResponse.json({ comment_id: updated.id, hidden: updated.hidden });
}
