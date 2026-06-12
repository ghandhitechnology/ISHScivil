export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/users — 가입된 사용자 목록(민원/댓글 수 포함) */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { complaints: true, comments: true, votes: true } },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      riroId: u.riroId,
      name: u.name,
      role: u.role,
      studentNumber: u.studentNumber,
      generation: u.generation,
      createdAt: u.createdAt,
      suspended: u.suspended,
      counts: u._count,
    })),
  });
}
