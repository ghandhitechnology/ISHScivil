"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { LoginModal } from "@/components/LoginModal";
import { ComplaintFormModal } from "@/components/ComplaintFormModal";
import { VoteButton } from "@/components/VoteButton";
import { TeacherBadge } from "@/components/TeacherBadge";
import { useSession } from "@/components/SessionProvider";
import type { ComplaintSummary } from "@/lib/types";

async function fetchHomeData(q?: string) {
  const searchParam = q ? `&q=${encodeURIComponent(q)}` : "";
  const [t, l] = await Promise.all([
    fetch("/api/complaints?status=ACTIVE&sort=top&limit=3", { cache: "no-store" }).then((r) => r.json()),
    fetch(`/api/complaints?status=ACTIVE&sort=latest&limit=50${searchParam}`, { cache: "no-store" }).then((r) =>
      r.json()
    ),
  ]);
  return {
    top3: (t.complaints ?? []) as ComplaintSummary[],
    latest: (l.complaints ?? []) as ComplaintSummary[],
  };
}

export default function Home() {
  const { session } = useSession();
  const [top3, setTop3] = useState<ComplaintSummary[]>([]);
  const [latest, setLatest] = useState<ComplaintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  function load(q?: string) {
    setLoading(true);
    fetchHomeData(q)
      .then(({ top3, latest }) => {
        setTop3(top3);
        setLatest(latest);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchHomeData()
      .then(({ top3, latest }) => {
        setTop3(top3);
        setLatest(latest);
      })
      .finally(() => setLoading(false));
  }, []);

  function requireLogin() {
    setLoginOpen(true);
  }

  function onProposeClick() {
    if (!session.authenticated) return setLoginOpen(true);
    setFormOpen(true);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    setSearchQuery(trimmed);
    load(trimmed || undefined);
  }

  function onClearSearch() {
    setQuery("");
    setSearchQuery("");
    load();
  }

  return (
    <>
      <TopBar onLoginClick={() => setLoginOpen(true)} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28">
        <form onSubmit={onSearchSubmit} className="mt-6 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="민원 제목이나 내용을 검색해주세요"
            className="flex-1 rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted transition-colors"
          />
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-text hover:bg-primary-hover transition-colors"
          >
            검색
          </button>
        </form>

        <section className="pt-8">
          <div className="mb-4 flex items-end justify-between border-b border-border pb-2">
            <h2 className="text-base font-semibold text-foreground">인기 민원</h2>
            <span className="text-xs text-muted">오늘의 상위 3건</span>
          </div>

          {loading && top3.length === 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded border border-border bg-surface p-5">
                  <div className="h-4 w-8 bg-muted-bg rounded" />
                  <div className="mt-3 h-5 w-full bg-muted-bg rounded" />
                  <div className="mt-2 h-4 w-3/4 bg-muted-bg rounded" />
                </div>
              ))}
            </div>
          ) : top3.length === 0 ? (
            <p className="rounded border border-border bg-muted-bg p-6 text-center text-sm text-muted">
              아직 민원이 없습니다.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {top3.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/complaint/${c.id}`}
                  className="group flex flex-col justify-between rounded border border-border bg-surface p-5 transition-colors hover:border-primary hover:bg-surface-hover"
                >
                  <div>
                    <span className="text-xs font-semibold text-primary">#{i + 1}</span>
                    <h3 className="mt-1.5 line-clamp-2 font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-muted leading-relaxed">{c.summary[0]}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">찬성 {c.vote_count}</span>
                    {c.author_role === "TEACHER" && <TeacherBadge />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="pt-10">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-base font-semibold text-foreground">
              {searchQuery ? `"${searchQuery}" 검색 결과` : "최신 민원"}
            </h2>
            <div className="flex items-center gap-3">
              {searchQuery && (
                <button
                  onClick={onClearSearch}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  검색 초기화
                </button>
              )}
              <Link href="/archived" className="text-xs text-muted hover:text-primary transition-colors">
                주요 민원 보관함 →
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {loading && latest.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <li key={i} className="rounded border border-border bg-surface p-4">
                  <div className="h-5 w-1/2 bg-muted-bg rounded" />
                  <div className="mt-2 h-4 w-3/4 bg-muted-bg rounded" />
                </li>
              ))
            ) : (
              latest.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center gap-4 rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-hover"
                >
                  <Link href={`/complaint/${c.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      {c.author_role === "TEACHER" && <TeacherBadge />}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{c.summary[0]}</p>
                  </Link>
                  <VoteButton
                    complaintId={c.id}
                    initialVoted={false}
                    initialCount={c.vote_count}
                    onRequireLogin={requireLogin}
                    compact
                  />
                </li>
              ))
            )}
            {!loading && latest.length === 0 && (
              <li className="rounded border border-border bg-muted-bg p-8 text-center text-sm text-muted">
                {searchQuery ? "검색 결과가 없습니다." : "등록된 민원이 없습니다. 첫 민원을 제시할 수 있습니다."}
              </li>
            )}
          </ul>
        </section>
      </main>

      <button
        onClick={onProposeClick}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded bg-primary px-5 py-3 font-medium text-primary-text shadow-md transition-colors hover:bg-primary-hover active:scale-95"
      >
        <span className="text-lg leading-none">＋</span> 민원 제시
      </button>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <ComplaintFormModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={() => load(searchQuery || undefined)} />
    </>
  );
}
