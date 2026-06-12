# riro-auth — 리로스쿨 인증 서비스

인곽 민원 창구의 사용자 신원 확인을 담당하는 마이크로서비스.
리로스쿨에 비공식 스크래핑 방식으로 로그인하여 이름·학번·기수·직책만 반환한다.
**ID/PW는 저장하지 않는다.**

## 실행

```bash
cd riro-auth
python -m venv .venv && source .venv/bin/activate   # (선택) 가상환경
pip install -r requirements.txt
uvicorn main:app --port 8000   # 5000 은 macOS AirPlay 와 충돌
```

## 엔드포인트

### `POST /api/riro_login`
요청
```json
{ "id": "리로아이디", "password": "비밀번호" }
```
성공
```json
{ "status": "success", "name": "홍길동", "student_number": "1203",
  "generation": 32, "student": "재학생" }
```
실패
```json
{ "status": "error", "message": "아이디 또는 비밀번호가 틀렸습니다." }
```

### `GET /health`
`{ "status": "ok" }`

## 메모
- `student` 필드는 직책("재학생"/"졸업생"/"교사" 등). 메인 앱이 이를 STUDENT/TEACHER로 매핑한다.
- 리로스쿨이 HTML 구조를 바꾸면 셀렉터가 깨질 수 있다 (`span.m_level3`, `.input_disabled`, `.elem_fix`).
