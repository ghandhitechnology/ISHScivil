import { PoolConfig, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Cloudflare Pages Functions(edge runtime)에서는 WebSocket 대신 HTTP fetch를 사용합니다.
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString } satisfies PoolConfig);

// 개발 환경의 HMR 로 PrismaClient 가 여러 번 생성되는 것을 막기 위한 글로벌 싱글턴
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
