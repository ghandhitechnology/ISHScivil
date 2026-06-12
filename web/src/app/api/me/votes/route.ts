import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { serializeComplaintSummary } from "@/lib/serialize";

/** GET /api/me/votes — 내가 찬성한 민원 목록(최근 투표 순) */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const votes = await prisma.vote.findMany({
    where: { userId: session.userId },
    orderBy: { votedDate: "desc" },
    include: {
      complaint: {
        include: { author: { select: { role: true } } },
      },
    },
  });

  const complaints = votes
    .map((v) => v.complaint)
    .filter((c) => c.status !== "DELETED")
    .map(serializeComplaintSummary);

  return NextResponse.json({ complaints });
}
