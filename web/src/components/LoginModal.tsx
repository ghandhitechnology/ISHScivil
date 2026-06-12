"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useSession } from "./SessionProvider";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useSession();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(id, pw);
      setId("");
      setPw("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted transition-colors";

  return (
    <Modal open={open} onClose={onClose} title="리로스쿨 로그인">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          리로스쿨 계정으로 본인 인증을 합니다. 아이디와 비밀번호는 인증 후 즉시 폐기됩니다.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">아이디</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={input}
            placeholder="리로스쿨 아이디"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={input}
            placeholder="비밀번호"
          />
        </div>
        {error && <p className="text-sm font-medium text-error">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-primary py-2.5 font-medium text-primary-text hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {loading ? "인증 중…" : "로그인"}
        </button>
      </form>
    </Modal>
  );
}
