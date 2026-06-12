export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** DELETE /api/admin/complaints/:id — 민원 삭제(soft delete) */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/complaints/[id]">) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await ctx.params;

  await prisma.complaint.update({
    where: { id },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ ok: true });
}
