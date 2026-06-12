export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/complaints — 전체 민원 목록(작성자 정보 포함) */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, role: true, generation: true } },
      _count: { select: { votes: true, comments: true } },
    },
  });

  return NextResponse.json({
    complaints: complaints.map((c) => ({
      id: c.id,
      title: c.title,
      summary: [c.summary1, c.summary2, c.summary3],
      content: c.content,
      status: c.status,
      vote_count: c.voteCount,
      in_top3_days: c.inTop3Days,
      created_at: c.createdAt,
      author: c.author,
      counts: c._count,
    })),
  });
}
