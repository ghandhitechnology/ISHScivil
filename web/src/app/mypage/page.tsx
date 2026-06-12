"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { LoginModal } from "@/components/LoginModal";
import { TeacherBadge } from "@/components/TeacherBadge";
import { useSession } from "@/components/SessionProvider";
import type { ComplaintSummary, MyCommentItem } from "@/lib/types";

type Tab = "complaints" | "votes" | "comments";

export default function MyPage() {
  const { session, loading: sessionLoading } = useSession();
  const [tab, setTab] = useState<Tab>("complaints");
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [votes, setVotes] = useState<ComplaintSummary[]>([]);
  const [comments, setComments] = useState<MyCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!session.authenticated) return;
    Promise.all([
      fetch("/api/me/complaints", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/me/votes", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/me/comments", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([c, v, cm]) => {
        setComplaints(c.complaints ?? []);
        setVotes(v.complaints ?? []);
        setComments(cm.comments ?? []);
      })
      .finally(() => setLoading(false));
  }, [session.authenticated]);

  if (sessionLoading) {
    return (
      <>
        <TopBar onLoginClick={() => setLoginOpen(true)} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
          <div className="mt-6 h-6 w-32 bg-muted-bg rounded" />
          <div className="mt-2 h-4 w-48 bg-muted-bg rounded" />
          <div className="mt-6 flex border-b border-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-2">
                <div className="h-5 w-16 bg-muted-bg rounded" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded border border-border bg-surface p-4">
                <div className="h-5 w-1/2 bg-muted-bg rounded" />
                <div className="mt-2 h-4 w-3/4 bg-muted-bg rounded" />
              </div>
            ))}
          </div>
        </main>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  if (!session.authenticated) {
    return (
      <>
        <TopBar onLoginClick={() => setLoginOpen(true)} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
          <div className="mt-16 rounded border border-border bg-muted-bg p-8 text-center">
            <p className="text-sm text-muted">로그인 후 이용할 수 있습니다.</p>
            <button
              onClick={() => setLoginOpen(true)}
              className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover transition-colors"
            >
              로그인
            </button>
          </div>
        </main>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "complaints", label: "내 민원", count: complaints.length },
    { key: "votes", label: "찬성한 민원", count: votes.length },
    { key: "comments", label: "내 의견", count: comments.length },
  ];

  return (
    <>
      <TopBar onLoginClick={() => setLoginOpen(true)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <Link href="/" className="mt-6 inline-block text-sm text-muted hover:text-primary transition-colors">
          ← 목록으로
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-foreground">마이페이지</h1>
        <p className="mt-1 text-sm text-muted">{session.name}님의 활동 내역입니다.</p>

        <div className="mt-6 flex border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 rounded px-1.5 py-0.5 text-xs ${
                  tab === t.key ? "bg-primary-subtle text-primary" : "bg-muted-bg text-muted"
                }`}
              >
                {t.count}
              </span>
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded border border-border bg-surface p-4">
                  <div className="h-5 w-1/2 bg-muted-bg rounded" />
                  <div className="mt-2 h-4 w-3/4 bg-muted-bg rounded" />
                </div>
              ))}
            </div>
          ) : tab === "complaints" ? (
            <ComplaintList items={complaints} empty="제시한 민원이 없습니다." />
          ) : tab === "votes" ? (
            <ComplaintList items={votes} empty="찬성한 민원이 없습니다." />
          ) : (
            <CommentList items={comments} empty="남긴 의견이 없습니다." />
          )}
        </div>
      </main>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

function ComplaintList({ items, empty }: { items: ComplaintSummary[]; empty: string }) {
  if (items.length === 0) {
    return <p className="rounded border border-border bg-muted-bg p-8 text-center text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((c) => (
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
                {c.status === "ARCHIVED" && (
                  <span className="rounded bg-archived-bg px-1.5 py-0.5 text-[11px] font-medium text-archived-text">
                    보관됨
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted">{c.summary[0]}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-primary">찬성 {c.vote_count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CommentList({ items, empty }: { items: MyCommentItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="rounded border border-border bg-muted-bg p-8 text-center text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.comment_id}>
          <Link
            href={`/complaint/${c.complaint_id}`}
            className="group block rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-hover"
          >
            <p className="truncate text-sm text-foreground group-hover:text-primary transition-colors">
              {c.complaint_title}
            </p>
            <p className="mt-1.5 text-sm text-text-secondary line-clamp-2">{c.content}</p>
            <p className="mt-2 text-xs text-muted">
              {new Date(c.created_at).toLocaleString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
