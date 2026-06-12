import { PrismaClient } from "@prisma/client";

// 개발 환경의 HMR 로 PrismaClient 가 여러 번 생성되는 것을 막기 위한 글로벌 싱글턴
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
