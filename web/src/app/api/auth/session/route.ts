export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** 현재 로그인 상태 조회. 익명성을 위해 실명/학번은 내려보내지 않고 역할만 노출. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    role: session.role,
    name: session.name, // 본인 화면 표시용(자기 자신의 이름)
    generation: session.generation,
  });
}
