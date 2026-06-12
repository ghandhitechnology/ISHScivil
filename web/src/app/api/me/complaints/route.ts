import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { serializeComplaintSummary } from "@/lib/serialize";

/** GET /api/me/complaints — 내가 제시한 민원 목록 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    where: { authorId: session.userId, status: { not: "DELETED" } },
    orderBy: [{ createdAt: "desc" }],
    include: { author: { select: { role: true } } },
  });

  return NextResponse.json({ complaints: complaints.map(serializeComplaintSummary) });
}
