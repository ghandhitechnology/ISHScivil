import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 샘플 사용자 (학생 2, 교사 1)
  const student1 = await prisma.user.upsert({
    where: { riroId: "23001" },
    update: {},
    create: { riroId: "23001", role: "STUDENT", name: "김학생", studentNumber: "1203", generation: 30 },
  });
  const student2 = await prisma.user.upsert({
    where: { riroId: "23002" },
    update: {},
    create: { riroId: "23002", role: "STUDENT", name: "이학생", studentNumber: "1204", generation: 30 },
  });
  const teacher = await prisma.user.upsert({
    where: { riroId: "T0001" },
    update: {},
    create: { riroId: "T0001", role: "TEACHER", name: "박교사", studentNumber: "0000", generation: 1 },
  });

  // 기존 샘플 민원 정리 후 재생성 (idempotent)
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.complaint.deleteMany();

  const samples = [
    {
      title: "급식 메뉴에 채식 선택지를 추가해주세요",
      summary1: "현재 채식주의 학생을 위한 선택지가 없음",
      summary2: "주 1회라도 채식 메뉴 운영 요청",
      summary3: "타 학교 사례 다수 존재",
      content: "채식을 하는 학생들이 점심을 거르는 경우가 많습니다. 주 1회라도 채식 선택지를 마련해주시면 좋겠습니다.",
      author: student1,
      votes: 12,
    },
    {
      title: "기숙사 세탁기 추가 설치 요청",
      summary1: "세탁기 대수 부족으로 대기 심각",
      summary2: "저녁 시간대 1시간 이상 대기",
      summary3: "층별 1대 이상 증설 필요",
      content: "기숙사 세탁기가 부족해 저녁마다 줄을 섭니다. 층별로 최소 1대씩 증설을 요청합니다.",
      author: student2,
      votes: 8,
    },
    {
      title: "자습실 냉방 온도 조정",
      summary1: "여름철 자습실이 지나치게 추움",
      summary2: "감기 환자 증가",
      summary3: "적정 온도(26도) 유지 요청",
      content: "자습실 에어컨이 너무 강해 춥습니다. 적정 온도로 조정 부탁드립니다.",
      author: student1,
      votes: 5,
    },
    {
      title: "도서관 개방 시간 연장",
      summary1: "주말 도서관 운영 시간이 짧음",
      summary2: "시험기간 좌석 부족",
      summary3: "주말 22시까지 연장 희망",
      content: "주말에도 도서관을 늦게까지 이용하고 싶습니다.",
      author: student2,
      votes: 3,
    },
  ];

  for (const s of samples) {
    const c = await prisma.complaint.create({
      data: {
        title: s.title,
        summary1: s.summary1,
        summary2: s.summary2,
        summary3: s.summary3,
        content: s.content,
        voteCount: s.votes,
        authorId: s.author.id,
      },
    });
    // 첫 민원에 교사 답변 댓글 샘플
    if (s === samples[0]) {
      await prisma.comment.create({
        data: { complaintId: c.id, authorId: teacher.id, content: "이 제안은 다음 주 부장 회의에서 건의해 조치하겠습니다." },
      });
      await prisma.comment.create({
        data: { complaintId: c.id, authorId: student2.id, content: "꼭 필요한 제안이라고 생각합니다. 찬성합니다." },
      });
    }
  }

  console.log("Seed 완료: 사용자 3명, 민원 4건, 댓글 2건");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
