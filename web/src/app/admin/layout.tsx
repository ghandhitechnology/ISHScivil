import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 대시보드 | 인곽 민원 창구",
  description: "인곽 민원 창구 관리자 대시보드",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
