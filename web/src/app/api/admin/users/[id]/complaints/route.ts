import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/users/:id/complaints — 특정 사용자의 민원 열람 */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/users/[id]/complaints">) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await ctx.params;

  const complaints = await prisma.complaint.findMany({
    where: { authorId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}
