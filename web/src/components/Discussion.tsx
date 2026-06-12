"use client";

import { useEffect, useState } from "react";
import { TeacherBadge } from "./TeacherBadge";
import { useSession } from "./SessionProvider";
import type { CommentItem } from "@/lib/types";

async function fetchComments(complaintId: string): Promise<CommentItem[]> {
  const res = await fetch(`/api/complaints/${complaintId}/comments`, { cache: "no-store" });
  const data = await res.json();
  return (data.comments ?? []) as CommentItem[];
}

export function Discussion({
  complaintId,
  onRequireLogin,
}: {
  complaintId: string;
  onRequireLogin: () => void;
}) {
  const { session } = useSession();
  const isAdmin = session.authenticated && session.role === "ADMIN";
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    fetchComments(complaintId).then((items) => setComments(items));
  }

  useEffect(() => {
    fetchComments(complaintId).then((items) => setComments(items));
  }, [complaintId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session.authenticated) return onRequireLogin();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent("");
        await load();
      } else {
        const { message } = await res.json().catch(() => ({}));
        alert(message ?? "작성 실패");
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleHidden(id: number) {
    const res = await fetch(`/api/admin/comments/${id}`, { method: "PATCH" });
    if (res.ok) {
      await load();
    } else {
      alert("처리 실패");
    }
  }

  const input =
    "flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted transition-colors resize-y min-h-[5rem]";

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        의견 {comments.length > 0 ? `${comments.length}개` : ""}
      </h2>

      <ul className="space-y-3">
        {comments.map((c) => (
          <li
            key={c.comment_id}
            className={`rounded border p-4 ${
              c.hidden ? "opacity-60 bg-muted-bg border-border" : c.is_teacher ? "bg-teacher-bg border-primary/30" : "bg-surface border-border"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {c.is_teacher ? (
                  <TeacherBadge />
                ) : (
                  <span className="text-xs font-medium text-muted">익명</span>
                )}
                {c.hidden && (
                  <span className="rounded bg-error/10 px-1.5 py-0.5 text-[10px] font-medium text-error">
                    숨김
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {new Date(c.created_at).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => toggleHidden(c.comment_id)}
                    className="rounded border border-border bg-muted-bg px-2 py-0.5 text-[11px] text-text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    {c.hidden ? "숨김 해제" : "숨김"}
                  </button>
                )}
              </div>
            </div>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${c.hidden ? "text-muted line-through" : "text-text-secondary"}`}>
              {c.content}
            </p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="rounded border border-border bg-muted-bg p-6 text-center text-sm text-muted">
            아직 의견이 없습니다.
          </li>
        )}
      </ul>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={session.authenticated ? "의견을 작성해주세요" : "로그인 후 작성할 수 있습니다"}
          disabled={!session.authenticated}
          className={input}
        />
        <button
          type="submit"
          disabled={loading || !session.authenticated}
          className="rounded bg-primary px-5 py-2 font-medium text-primary-text hover:bg-primary-hover transition-colors disabled:opacity-60 shrink-0"
        >
          등록
        </button>
      </form>
    </section>
  );
}
