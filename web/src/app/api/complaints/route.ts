import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkSuspended } from "@/lib/suspended";
import { serializeComplaintSummary } from "@/lib/serialize";

/**
 * GET /api/complaints?status=ACTIVE&sort=top|latest&limit=&q=
 * 메인 피드 목록. 기본 ACTIVE, 정렬 latest.
 * q 파라미터가 있으면 제목/요약/내용에서 검색한다.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "ACTIVE";
  const sort = searchParams.get("sort") ?? "latest";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 100);
  const q = searchParams.get("q")?.trim();

  const where: Prisma.ComplaintWhereInput = { status };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary1: { contains: q } },
      { summary2: { contains: q } },
      { summary3: { contains: q } },
      { content: { contains: q } },
    ];
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy:
      sort === "top"
        ? [{ voteCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: limit,
    include: { author: { select: { role: true } } },
  });

  return NextResponse.json({ complaints: complaints.map(serializeComplaintSummary) });
}

const createSchema = z.object({
  title: z.string().min(1).max(100),
  summary1: z.string().min(1).max(100),
  summary2: z.string().min(1).max(100),
  summary3: z.string().min(1).max(100),
  content: z.string().min(1),
});

/** POST /api/complaints — 신규 민원 등록(인증 필요). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  const suspended = await checkSuspended(session);
  if (suspended) return suspended;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  }

  const c = await prisma.complaint.create({
    data: { ...parsed.data, authorId: session.userId },
  });

  return NextResponse.json({ id: c.id }, { status: 201 });
}
