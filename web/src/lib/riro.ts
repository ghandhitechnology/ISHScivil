// 리로 인증 서비스(riro-auth, FastAPI) 호출 모듈

export type RiroSuccess = {
  status: "success";
  name: string;
  student_number: string;
  generation: number;
  student: string; // 직책: "재학생" | "졸업생" | "교사" 등
};
export type RiroError = { status: "error"; message: string };
export type RiroResult = RiroSuccess | RiroError;

const RIRO_AUTH_URL = process.env.RIRO_AUTH_URL ?? "http://localhost:8000";

/** 직책 문자열을 시스템 role 로 매핑한다(설계.md §4). */
export function mapRole(student: string): "STUDENT" | "TEACHER" {
  const isTeacher =
    student.includes("교") && !student.includes("학") && !student.includes("졸");
  return isTeacher ? "TEACHER" : "STUDENT";
}

/** 리로 서비스에 로그인 위임. 네트워크 실패 시 error 결과를 돌려준다. */
export async function riroLogin(id: string, password: string): Promise<RiroResult> {
  try {
    const res = await fetch(`${RIRO_AUTH_URL}/api/riro_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
      // 인증 서비스가 내부 재시도(최대 5회)를 하므로 넉넉히 대기
      signal: AbortSignal.timeout(60_000),
    });
    return (await res.json()) as RiroResult;
  } catch {
    return { status: "error", message: "인증 서버에 연결할 수 없습니다." };
  }
}
