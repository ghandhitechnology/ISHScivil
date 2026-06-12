// 익명화 직렬화 유틸 (설계서 §6)
// 작성자 식별값(authorId/실명/학번 등)은 절대 응답 페이로드에 포함하지 않는다.

import type { Complaint, Comment, User } from "@prisma/client";

type ComplaintWithAuthor = Complaint & { author?: Pick<User, "role"> | null };

/** 민원을 익명화하여 직렬화. authorRole 만 노출. */
export function serializeComplaint(c: ComplaintWithAuthor) {
  return {
    id: c.id,
    title: c.title,
    summary: [c.summary1, c.summary2, c.summary3],
    content: c.content,
    status: c.status,
    vote_count: c.voteCount,
    author_role: c.author?.role ?? null, // "STUDENT" | "TEACHER" | "ADMIN"
    created_at: c.createdAt,
  };
}

/** 목록용 요약 직렬화(content 제외). */
export function serializeComplaintSummary(c: ComplaintWithAuthor) {
  return {
    id: c.id,
    title: c.title,
    summary: [c.summary1, c.summary2, c.summary3],
    status: c.status,
    vote_count: c.voteCount,
    author_role: c.author?.role ?? null,
    created_at: c.createdAt,
  };
}

type CommentWithAuthor = Comment & { author: Pick<User, "role"> };

/** 댓글 직렬화. 교직원만 is_teacher:true 마킹(설계서 §6.2), 학생은 식별 불가. */
export function serializeComment(c: CommentWithAuthor, includeHidden = false) {
  const base = {
    comment_id: c.id,
    content: c.content,
    is_teacher: c.author.role === "TEACHER",
    created_at: c.createdAt,
  };
  if (includeHidden) {
    return { ...base, hidden: c.hidden };
  }
  return base;
}
