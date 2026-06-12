import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 상위 디렉터리의 다른 lockfile 로 인한 workspace root 오추론 방지
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
