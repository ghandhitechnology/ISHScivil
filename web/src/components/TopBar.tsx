"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "./SessionProvider";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "학생",
  TEACHER: "교사",
  ADMIN: "관리자",
};

export function TopBar({ onLoginClick }: { onLoginClick: () => void }) {
  const { session, logout } = useSession();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur transition-all ${
        compact ? "py-2" : "py-3"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="인천과학고"
            width={compact ? 28 : 36}
            height={compact ? 28 : 36}
            unoptimized
            className="rounded bg-surface shrink-0 transition-all"
          />
          <div className="leading-tight">
            <p className="font-semibold text-foreground">인곽 민원 창구</p>
            {!compact && <p className="text-[11px] text-muted">인천과학고 학내 민원 게시판</p>}
          </div>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {session.authenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded border border-border bg-muted-bg px-3 py-1.5 text-sm text-text-secondary hover:border-border-strong hover:bg-surface-hover transition-colors"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="hidden sm:inline">
                  {session.name} <span className="text-xs text-muted">({ROLE_LABEL[session.role]})</span>
                </span>
                <span className="sm:hidden">{ROLE_LABEL[session.role]}</span>
                <svg
                  className={`h-4 w-4 text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-40 rounded border border-border bg-surface shadow-lg py-1"
                  role="menu"
                >
                  <Link
                    href="/mypage"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-text-secondary hover:bg-muted-bg hover:text-foreground transition-colors"
                    role="menuitem"
                  >
                    마이페이지
                  </Link>
                  {session.role === "ADMIN" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-admin hover:bg-admin-hover transition-colors"
                      role="menuitem"
                    >
                      관리자
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-muted-bg hover:text-foreground transition-colors"
                    role="menuitem"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="rounded bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-text hover:bg-primary-hover transition-colors"
            >
              리로스쿨 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
