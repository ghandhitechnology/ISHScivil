import { NextResponse } from "next/server";
import { getSession } from "./session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.role !== "ADMIN" && session.name !== "하태욱") {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  return session;
}
