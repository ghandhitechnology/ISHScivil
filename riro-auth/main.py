"""
리로스쿨 인증 마이크로서비스 (인곽 민원 창구)

번외_인곽위키/route/riroschoolauth.py 의 검증된 스크래퍼를 그대로 재사용한다.
리로스쿨은 공식 OAuth/API를 제공하지 않으므로, 서버가 브라우저를 흉내 내어
직접 로그인하고 프로필 HTML을 파싱하는 비공식 방식이다.

보안 불변식: ID/PW는 인증 순간에만 사용하고 로그/예외 메시지/저장 어디에도 남기지 않는다.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
import time
from bs4 import BeautifulSoup

app = FastAPI(title="riro-auth", description="인곽 민원 창구 리로스쿨 인증 서비스")

# 운영 환경에서는 FRONTEND_ORIGIN 환경변수로 허용 출처를 제한한다.
# 예: FRONTEND_ORIGIN=https://ishs-minwon.pages.dev
_frontend_origin = os.environ.get("FRONTEND_ORIGIN", "*")
allow_origins = [_frontend_origin] if _frontend_origin else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

BASE = "https://iscience.riroschool.kr"
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
}
SLEEP_SEC = 2
MAX_RETRIES = 5


class LoginRequest(BaseModel):
    id: str
    password: str


def check_riro_login(user_id: str, user_pw: str):
    s = requests.Session()

    for _ in range(MAX_RETRIES):
        try:
            # ① 기존 세션 초기화
            try:
                s.post(f"{BASE}/user.php?action=user_logout", timeout=10)
            except requests.RequestException:
                pass

            # ② 로그인 → token 발급
            r = s.post(
                f"{BASE}/ajax.php",
                headers=HEADERS,
                data={
                    "app": "user", "mode": "login", "userType": "1",
                    "id": user_id, "pw": user_pw, "deeplink": "", "redirect_link": "",
                },
                timeout=15,
            )

            try:
                login_json = r.json()
            except ValueError:
                return {"status": "error", "message": "인증 서버에서 잘못된 응답을 받았습니다."}

            code = str(login_json.get("code"))
            if code == "902":
                return {"status": "error", "message": "아이디 또는 비밀번호가 틀렸습니다."}
            if code != "000":
                return {"status": "error", "message": f"로그인 실패 code={code}"}

            token = login_json.get("token")
            if not token:
                return {"status": "error", "message": "Token not found"}

            # ③ 프로필 HTML
            r2 = s.post(
                f"{BASE}/user.php",
                headers=HEADERS,
                data={"pw": user_pw},
                cookies={"cookie_token": token},
                allow_redirects=False,
                timeout=15,
            )
            soup = BeautifulSoup(r2.text, "html.parser")

            account_type = "normal"
            try:
                if soup.select(".td_title")[0].get_text() == "통합아이디":
                    account_type = "integrated"
            except Exception:
                pass

            # ④ 파싱
            if account_type == "normal":
                el_student = soup.select_one("span.m_level3") or soup.select_one("span.m_level1")
                inputs = soup.select(".input_disabled")
                if not el_student or len(inputs) < 2:
                    raise RuntimeError("Cannot parse user info")

                student = el_student.get_text(strip=True) or ""
                name = inputs[0].get_text(strip=True) or ""
                student_number_raw = inputs[1].get_text(strip=True) or ""
                student_number = (
                    student_number_raw[0] + student_number_raw[2:]
                    if len(student_number_raw) >= 3 else student_number_raw
                )
                generation = 0
                if len(user_id) >= 2 and user_id[:2].isdigit():
                    generation = int("20" + user_id[:2]) - 1994 + 1

                if all([name, student_number, student]) and generation > 0:
                    return {
                        "status": "success",
                        "name": name,
                        "student_number": student_number,
                        "generation": generation,
                        "student": student,
                    }

            elif account_type == "integrated":
                try:
                    riro_id = soup.select(".elem_fix")[0].get_text()[:8]
                    student = soup.select(".elem_fix")[0].get_text()[15:-1]
                    inputs = soup.select(".input_disabled")
                    name = inputs[0].get_text(strip=True) or ""
                    student_number_raw = inputs[1].get_text(strip=True) or ""
                    student_number = (
                        student_number_raw[0] + student_number_raw[2:]
                        if len(student_number_raw) >= 3 else student_number_raw
                    )
                    generation = 0
                    if len(riro_id) >= 2 and riro_id[:2].isdigit():
                        generation = int("20" + riro_id[:2]) - 1994 + 1

                    if all([name, student_number, student]) and generation > 0:
                        return {
                            "status": "success",
                            "name": name,
                            "student_number": student_number,
                            "generation": generation,
                            "student": student,
                        }
                except Exception:
                    pass

            raise RuntimeError("Data missing. Retrying...")

        except (requests.RequestException, RuntimeError):
            time.sleep(SLEEP_SEC)

    return {"status": "error", "message": "인증 서버와 통신 중 오류가 발생했습니다."}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/riro_login")
def riro_login_api(req: LoginRequest):
    return check_riro_login(req.id, req.password)


if __name__ == "__main__":
    import uvicorn
    # 포트 5000 은 macOS AirPlay 수신(ControlCenter)과 충돌하므로 8000 사용
    uvicorn.run(app, host="0.0.0.0", port=8000)
