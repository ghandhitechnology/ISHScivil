export const runtime = 'edge';
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { riroLogin, mapRole } from "@/lib/riro";
import { createSession } from "@/lib/session";

const bodySchema = z.object({
  id: z.string().min(1, "아이디를 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  }
  const { id, password } = parsed.data;

  // 개발 편의: ALLOW_DEV_LOGIN=true 이고 비밀번호가 "dev" 면 리로 우회
  let name: string;
  let studentNumber: string;
  let generation: number;
  let role: "STUDENT" | "TEACHER" | "ADMIN";

  if (process.env.ALLOW_DEV_LOGIN === "true" && password === "dev") {
    const isAdmin = id.toLowerCase() === "hataewook" || id === "하태욱";
    const isTeacher = id.startsWith("T");
    name = isAdmin ? "하태욱" : isTeacher ? "개발교사" : "개발학생";
    studentNumber = isAdmin ? "1234" : isTeacher ? "0000" : "9999";
    generation = isAdmin ? 32 : isTeacher ? 1 : 30;
    role = isAdmin ? "ADMIN" : isTeacher ? "TEACHER" : "STUDENT";
  } else {
    const result = await riroLogin(id, password);
    if (result.status !== "success") {
      return NextResponse.json({ message: result.message }, { status: 401 });
    }
    name = result.name;
    studentNumber = result.student_number;
    generation = result.generation;
    role = mapRole(result.student);
  }

  // 관리자 지정 계정
  if (name === "하태욱") {
    role = "ADMIN";
  }

  // 리로 식별값(id) 기준 upsert. ID/PW 는 저장하지 않는다.
  const user = await prisma.user.upsert({
    where: { riroId: id },
    update: { name, studentNumber, generation, role },
    create: { riroId: id, name, studentNumber, generation, role },
  });

  if (user.suspended) {
    return NextResponse.json({ message: "이용이 정지된 계정입니다." }, { status: 403 });
  }

  await createSession({ userId: user.id, role: user.role as "STUDENT" | "TEACHER" | "ADMIN", name: user.name, generation: user.generation });

  return NextResponse.json({ role: user.role, name: user.name });
}
