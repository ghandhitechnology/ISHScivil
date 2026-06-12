"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { LoginModal } from "@/components/LoginModal";
import { VoteButton } from "@/components/VoteButton";
import { TeacherBadge } from "@/components/TeacherBadge";
import { Discussion } from "@/components/Discussion";
import type { ComplaintDetail } from "@/lib/types";

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [voted, setVoted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/complaints/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setComplaint(data.complaint);
        setVoted(data.voted);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <TopBar onLoginClick={() => setLoginOpen(true)} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-muted hover:text-primary transition-colors"
        >
          ← 목록으로
        </Link>

        {loading ? (
          <div className="mt-6 rounded border border-border bg-surface p-6">
            <div className="h-6 w-3/4 bg-muted-bg rounded" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full bg-muted-bg rounded" />
              <div className="h-4 w-5/6 bg-muted-bg rounded" />
            </div>
          </div>
        ) : notFound ? (
          <p className="mt-10 rounded border border-border bg-muted-bg p-8 text-center text-sm text-muted">
            민원을 찾을 수 없습니다.
          </p>
        ) : (
          complaint && (
            <>
              <article className="mt-4 rounded border border-border bg-surface p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      {complaint.author_role === "TEACHER" && <TeacherBadge />}
                      {complaint.status === "ARCHIVED" && (
                        <span className="rounded bg-archived-bg px-1.5 py-0.5 text-[11px] font-medium text-archived-text">
                          보관됨
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl font-semibold text-foreground leading-tight">{complaint.title}</h1>
                  </div>
                  <VoteButton
                    complaintId={complaint.id}
                    initialVoted={voted}
                    initialCount={complaint.vote_count}
                    onRequireLogin={() => setLoginOpen(true)}
                  />
                </div>

                <ul className="mt-5 space-y-2 rounded border-l-4 border-primary bg-muted-bg p-4 text-sm text-text-secondary">
                  {complaint.summary.map((s, i) => (
                    <li key={i} className="flex gap-2 items-start leading-relaxed">
                      <span className="text-primary select-none">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 whitespace-pre-wrap leading-relaxed text-sm text-text-secondary">
                  {complaint.content}
                </p>

                <p className="mt-6 text-xs text-muted">
                  제시일자:{" "}
                  {new Date(complaint.created_at).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </article>

              <Discussion complaintId={complaint.id} onRequireLogin={() => setLoginOpen(true)} />
            </>
          )
        )}
      </main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
