/**
 * 주요 민원 자동 전환 및 아카이빙 배치 (설계서 §4.2)
 *
 * 매일 자정(00:00:01) Cron 으로 실행하는 것을 권장한다.
 * 개발 중에는 `npm run aging` 으로 수동 실행해 동작을 확인할 수 있다.
 *
 * 처리 순서:
 *  1. 활성(ACTIVE) 민원을 voteCount 내림차순 정렬
 *  2. 상위 3개의 inTop3Days 를 +1
 *  3. inTop3Days >= 7 도달 민원을 ARCHIVED 로 이관(메인/Top3 후보에서 배제)
 *  4. 공석은 차순위 민원이 다음 실행에서 자연 충원
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TOP_N = 3;
const ARCHIVE_THRESHOLD = 7;

async function runAging() {
  const active = await prisma.complaint.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, inTop3Days: true },
  });

  const top3 = active.slice(0, TOP_N);
  const archived: string[] = [];

  for (const c of top3) {
    const inTop3Days = c.inTop3Days + 1;
    if (inTop3Days >= ARCHIVE_THRESHOLD) {
      await prisma.complaint.update({
        where: { id: c.id },
        data: { inTop3Days, status: "ARCHIVED" },
      });
      archived.push(c.title);
    } else {
      await prisma.complaint.update({
        where: { id: c.id },
        data: { inTop3Days },
      });
    }
  }

  console.log(
    `[aging] Top${TOP_N} ${top3.length}건 inTop3Days +1` +
      (archived.length ? ` · 아카이브 ${archived.length}건: ${archived.join(", ")}` : "")
  );
}

runAging()
  .catch((e) => {
    console.error("[aging] 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
