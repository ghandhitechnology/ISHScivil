"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function ComplaintFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    summary1: "",
    summary2: "",
    summary3: "",
    content: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "등록 실패" }));
        throw new Error(message ?? "등록 실패");
      }
      setForm({ title: "", summary1: "", summary2: "", summary3: "", content: "" });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted transition-colors";

  return (
    <Modal open={open} onClose={onClose} title="민원 제시">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">제목</label>
          <input
            className={input}
            placeholder="민원 제목을 간결하게 적어주세요"
            maxLength={100}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">세 줄 요약</label>
          <input
            className={input}
            placeholder="핵심 문제"
            maxLength={100}
            value={form.summary1}
            onChange={(e) => set("summary1", e.target.value)}
          />
          <input
            className={input}
            placeholder="현재 상황"
            maxLength={100}
            value={form.summary2}
            onChange={(e) => set("summary2", e.target.value)}
          />
          <input
            className={input}
            placeholder="요구 사항"
            maxLength={100}
            value={form.summary3}
            onChange={(e) => set("summary3", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">상세 내용</label>
          <textarea
            className={`${input} min-h-32 resize-y`}
            placeholder="구체적인 내용을 자유롭게 작성해주세요"
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
          />
        </div>
        {error && <p className="text-sm font-medium text-error">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-primary py-2.5 font-medium text-primary-text hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {loading ? "등록 중…" : "민원 등록"}
        </button>
      </form>
    </Modal>
  );
}
