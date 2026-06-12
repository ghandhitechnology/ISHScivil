"use client";

import { useState } from "react";
import { useSession } from "./SessionProvider";

export function VoteButton({
  complaintId,
  initialVoted,
  initialCount,
  onRequireLogin,
  compact = false,
}: {
  complaintId: string;
  initialVoted: boolean;
  initialCount: number;
  onRequireLogin: () => void;
  compact?: boolean;
}) {
  const { session } = useSession();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session.authenticated) return onRequireLogin();
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/vote`, {
        method: voted ? "DELETE" : "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message ?? "처리 중 오류가 발생했습니다.");
        return;
      }
      setVoted(data.voted);
      if (typeof data.vote_count === "number") setCount(data.vote_count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex shrink-0 items-center gap-1.5 rounded border font-medium transition-colors disabled:opacity-60 ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${
        voted
          ? "border-primary bg-primary-subtle text-primary hover:bg-primary hover:text-primary-text"
          : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
      }`}
      aria-pressed={voted}
    >
      <span className="text-sm">찬성</span>
      <span>{count}</span>
    </button>
  );
}
