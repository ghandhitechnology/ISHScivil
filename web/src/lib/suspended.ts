import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import type { SessionPayload } from "./session";

export async function checkSuspended(session: SessionPayload) {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { suspended: true },
  });
  if (user?.suspended) {
    return NextResponse.json({ message: "이용이 정지된 계정입니다." }, { status: 403 });
  }
  return null;
}
