"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import type { AdminUser, AdminComplaint, AdminComment } from "@/lib/types";

type AdminTab = "complaints" | "users" | "comments";

export default function AdminDashboard() {
  const { session, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("complaints");

  useEffect(() => {
    if (sessionLoading) return;
    if (!session.authenticated || session.role !== "ADMIN") {
      router.replace("/");
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session.authenticated || session.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted">
        접근 권한을 확인하는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="인천과학고"
              width={36}
              height={36}
              unoptimized
              className="rounded bg-surface shrink-0"
            />
            <div>
              <p className="font-semibold text-foreground">관리자 대시보드</p>
              <p className="text-[11px] text-muted">{session.name}님 접속 중</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded border border-border bg-muted-bg px-3 py-1.5 text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            사이트로 돌아가기
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <nav className="flex border-b border-border">
          {[
            { key: "complaints", label: "민원 관리" },
            { key: "users", label: "사용자 관리" },
            { key: "comments", label: "댓글 관리" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as AdminTab)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "complaints" && <ComplaintsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "comments" && <CommentsTab />}
        </div>
      </main>
    </div>
  );
}

function ComplaintsTab() {
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/complaints")
      .then((r) => r.json())
      .then((d) => setItems(d.complaints ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    if (!confirm("이 민원을 삭제 처리하시겠습니까?")) return;
    const res = await fetch(`/api/admin/complaints/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("삭제 실패");
    }
  }

  if (loading) return <p className="text-muted">불러오는 중…</p>;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted-bg text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">제목</th>
            <th className="px-4 py-3 font-medium">작성자</th>
            <th className="px-4 py-3 font-medium">상태</th>
            <th className="px-4 py-3 font-medium">찬성</th>
            <th className="px-4 py-3 font-medium">작성일</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-surface-hover">
              <td className="px-4 py-3">
                <Link href={`/complaint/${c.id}`} className="text-primary hover:underline">
                  {c.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {c.author.name} ({c.author.role})
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.vote_count}</td>
              <td className="px-4 py-3 text-muted">{new Date(c.created_at).toLocaleDateString("ko-KR")}</td>
              <td className="px-4 py-3">
                {c.status !== "DELETED" && (
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded border border-error/50 bg-error/10 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/20 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="p-6 text-center text-sm text-muted">민원이 없습니다.</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "DELETED"
      ? "bg-error/10 text-error"
      : status === "ARCHIVED"
      ? "bg-archived-bg text-archived-text"
      : "bg-primary-subtle text-primary";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${classes}`}>{status}</span>;
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function toggleSuspend(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH" });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, suspended: data.suspended } : u)));
      if (selectedUser?.id === id) {
        setSelectedUser((u) => (u ? { ...u, suspended: data.suspended } : null));
      }
    } else {
      alert("처리 실패");
    }
  }

  if (loading) return <p className="text-muted">불러오는 중…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">역할</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`cursor-pointer hover:bg-surface-hover ${selectedUser?.id === u.id ? "bg-muted-bg" : ""}`}
              >
                <td className="px-4 py-3">
                  <span className={u.suspended ? "text-error line-through" : "text-foreground"}>{u.name}</span>
                </td>
                <td className="px-4 py-3 text-muted">{u.role}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSuspend(u.id);
                    }}
                    disabled={u.role === "ADMIN"}
                    className="rounded border border-border bg-muted-bg px-2 py-1 text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
                  >
                    {u.suspended ? "해제" : "정지"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:col-span-2">
        {selectedUser ? (
          <UserDetail user={selectedUser} />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded border border-border text-sm text-muted">
            사용자를 선택하면 상세 내역이 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}

function UserDetail({ user }: { user: AdminUser }) {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${user.id}/complaints`).then((r) => r.json()),
      fetch(`/api/admin/users/${user.id}/comments`).then((r) => r.json()),
    ])
      .then(([c, cm]) => {
        setComplaints(c.complaints ?? []);
        setComments(cm.comments ?? []);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="space-y-4 rounded border border-border bg-surface p-4">
      <div>
        <h3 className={`text-lg font-semibold ${user.suspended ? "text-error" : "text-foreground"}`}>
          {user.name}
        </h3>
        <p className="text-sm text-muted">
          {user.role} · {user.studentNumber} · {user.generation}기 · 가입일{" "}
          {new Date(user.createdAt).toLocaleDateString("ko-KR")}
          {user.suspended && <span className="ml-2 text-error">(이용정지)</span>}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CountBox label="민원" count={user.counts.complaints} />
        <CountBox label="의견" count={user.counts.comments} />
        <CountBox label="찬성" count={user.counts.votes} />
      </div>

      {loading ? (
        <p className="text-muted">불러오는 중…</p>
      ) : (
        <>
          <div>
            <h4 className="mb-2 text-sm font-medium text-text-secondary">작성한 민원</h4>
            <ul className="space-y-2">
              {complaints.map((c) => (
                <li key={c.id}>
                  <Link href={`/complaint/${c.id}`} className="text-sm text-primary hover:underline">
                    {c.title}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{c.status}</span>
                </li>
              ))}
              {complaints.length === 0 && <li className="text-sm text-muted">없음</li>}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-text-secondary">작성한 의견(익명 해제)</h4>
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.comment_id} className="rounded border border-border bg-background p-2">
                  <Link href={`/complaint/${c.complaint_id}`} className="text-xs text-primary hover:underline">
                    {c.complaint_title}
                  </Link>
                  <p className="mt-1 text-sm text-text-secondary">{c.content}</p>
                </li>
              ))}
              {comments.length === 0 && <li className="text-sm text-muted">없음</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function CountBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded border border-border bg-background p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold text-primary">{count}</p>
    </div>
  );
}

function CommentsTab() {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((d) => setItems(d.comments ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function toggleHidden(id: number) {
    const res = await fetch(`/api/admin/comments/${id}`, { method: "PATCH" });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((c) => (c.comment_id === id ? { ...c, hidden: data.hidden } : c)));
    } else {
      alert("처리 실패");
    }
  }

  if (loading) return <p className="text-muted">불러오는 중…</p>;

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div
          key={c.comment_id}
          className={`rounded border border-border bg-surface p-4 ${c.hidden ? "opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between">
            <Link href={`/complaint/${c.complaint_id}`} className="text-sm text-primary hover:underline">
              {c.complaint_title}
            </Link>
            <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString("ko-KR")}</span>
          </div>
          <p className={`mt-2 ${c.hidden ? "text-muted line-through" : "text-text-secondary"}`}>{c.content}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              작성자: <span className="text-primary">{c.author.name}</span> ({c.author.role} / {c.author.generation}기)
            </p>
            <button
              onClick={() => toggleHidden(c.comment_id)}
              className="rounded border border-border bg-muted-bg px-2.5 py-1 text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {c.hidden ? "숨김 해제" : "숨김 처리"}
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="p-6 text-center text-sm text-muted">댓글이 없습니다.</p>}
    </div>
  );
}
