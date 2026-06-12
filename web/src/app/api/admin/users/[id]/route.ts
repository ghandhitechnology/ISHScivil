import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** PATCH /api/admin/users/:id — 사용자 이용정지/해제 토글 */
export async function PATCH(_req: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json({ message: "관리자는 정지할 수 없습니다." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { suspended: !user.suspended },
  });

  return NextResponse.json({ user_id: updated.id, suspended: updated.suspended });
}
