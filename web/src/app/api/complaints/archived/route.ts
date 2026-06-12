export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeComplaintSummary } from "@/lib/serialize";

/** GET /api/complaints/archived — 주요 민원 보관함(자동 이관된 ARCHIVED 목록). */
export async function GET() {
  const complaints = await prisma.complaint.findMany({
    where: { status: "ARCHIVED" },
    orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { role: true } } },
  });
  return NextResponse.json({ complaints: complaints.map(serializeComplaintSummary) });
}
