"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { LoginModal } from "@/components/LoginModal";
import { TeacherBadge } from "@/components/TeacherBadge";
import type { ComplaintSummary } from "@/lib/types";

export default function ArchivedPage() {
  const [items, setItems] = useState<ComplaintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    fetch("/api/complaints/archived", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.complaints ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar onLoginClick={() => setLoginOpen(true)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <Link href="/" className="mt-6 inline-block text-sm text-muted hover:text-primary transition-colors">
          ← 목록으로
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-foreground">주요 민원 보관함</h1>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          인기 상위에 7일 이상 머물러 자동 보관된 민원입니다.
        </p>

        <ul className="mt-6 space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <li key={i} className="rounded border border-border bg-surface p-4">
                <div className="h-5 w-1/2 bg-muted-bg rounded" />
                <div className="mt-2 h-4 w-3/4 bg-muted-bg rounded" />
              </li>
            ))
          ) : (
            items.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/complaint/${c.id}`}
                  className="group flex items-center justify-between gap-4 rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-hover"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      {c.author_role === "TEACHER" && <TeacherBadge />}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{c.summary[0]}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary">찬성 {c.vote_count}</span>
                </Link>
              </li>
            ))
          )}
          {!loading && items.length === 0 && (
            <li className="rounded border border-border bg-muted-bg p-8 text-center text-sm text-muted">
              보관된 민원이 없습니다.
            </li>
          )}
        </ul>
      </main>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
