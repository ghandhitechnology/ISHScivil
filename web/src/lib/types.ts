// 클라이언트 공용 타입 (API 응답 형태와 일치)

export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export type ComplaintSummary = {
  id: string;
  title: string;
  summary: [string, string, string] | string[];
  status: string;
  vote_count: number;
  author_role: Role | null;
  created_at: string;
};

export type ComplaintDetail = ComplaintSummary & {
  content: string;
};

export type CommentItem = {
  comment_id: number;
  content: string;
  is_teacher: boolean;
  created_at: string;
  hidden?: boolean;
};

export type MyCommentItem = {
  comment_id: number;
  content: string;
  created_at: string;
  complaint_id: string;
  complaint_title: string;
};

export type AdminUser = {
  id: string;
  riroId: string;
  name: string;
  role: Role;
  studentNumber: string;
  generation: number;
  suspended: boolean;
  createdAt: string;
  counts: { complaints: number; comments: number; votes: number };
};

export type AdminComplaint = {
  id: string;
  title: string;
  summary: string[];
  content: string;
  status: string;
  vote_count: number;
  in_top3_days: number;
  created_at: string;
  author: { id: string; name: string; role: Role; generation: number };
  counts: { votes: number; comments: number };
};

export type AdminComment = {
  comment_id: number;
  content: string;
  created_at: string;
  complaint_id: string;
  complaint_title: string;
  hidden: boolean;
  author: { id: string; name: string; role: Role; generation: number };
};

export type SessionState =
  | { authenticated: false }
  | { authenticated: true; role: Role; name: string; generation: number };
