# 인곽 민원 창구 (ISHS Complaint Window)

인천과학고 학내 구성원(학생·교사)이 **익명으로 민원을 제기**하고, **일일 한도 내 찬성 투표**로
우선순위를 정하며, **교직원이 공신력 있게 답변**하는 민주적·투명한 민원 창구.

## 구성

```
02_인곽민원창구/
├── riro-auth/   리로스쿨 인증 마이크로서비스 (FastAPI, 비공식 스크래핑)
├── web/         메인 앱 (Next.js 16 App Router + Prisma + Tailwind)
└── 리로그인/     리로 로그인 설계 문서
```

- **인증**: 리로스쿨은 공식 API가 없어 `riro-auth` 가 브라우저를 흉내 내 로그인 후 프로필을 파싱한다.
  ID/PW 는 인증 순간에만 쓰고 저장하지 않으며, 메인 앱은 결과(이름·학번·기수·직책)만 받아
  서명된 세션 쿠키(JWT)를 발급한다.
- **익명성**: 민원/투표/댓글 응답에 작성자 식별값(이름·학번·user_id)을 절대 포함하지 않는다.
  댓글은 교직원만 `is_teacher` 로 표시되어 `교사` 배지가 붙는다.

## 빠른 시작

### 1) 리로 인증 서비스 (터미널 A)
```bash
cd riro-auth
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000   # 5000 은 macOS AirPlay 와 충돌
```

### 2) 웹 앱 (터미널 B)
```bash
cd web
npm install
cp .env.example .env        # SESSION_SECRET 채우기: openssl rand -base64 32
npm run db:push             # SQLite 스키마 생성
npm run seed                # 샘플 데이터
npm run dev                 # http://localhost:3000
```

> **개발 편의 로그인**: `.env` 의 `ALLOW_DEV_LOGIN=true` 일 때, 비밀번호 `dev` 로
> 리로 없이 로그인할 수 있다. 아이디가 `T` 로 시작하면 교사로 처리되고, `hataewook` 또는 `하태욱`이면 관리자로 처리된다. **운영에서는 반드시 false.**

## 배포

Cloudflare Pages 배포 가이드는 [`web/DEPLOY.md`](web/DEPLOY.md)를 참고하세요.

### 3) 주요 민원 자동 아카이빙 배치
```bash
cd web && npm run aging     # Top3 inTop3Days +1, 7일 도달 시 ARCHIVED
```
운영에서는 매일 자정 cron 으로 `npm run aging` 을 실행한다.

## 핵심 정책
- **일일 투표 한도**: 사용자당 오늘 활성화한 찬성표 최대 10개 (초과 시 400).
- **중복 투표 차단**: `(user, complaint)` 복합 유니크. 취소 시 잔여 즉시 복구.
- **자동 아카이빙**: 인기 Top3 에 7일 누적 머문 민원은 보관함으로 이관, Top3 후보에서 배제.

## 기술 메모
- **Prisma 6** 고정(7은 driver-adapter 전환으로 설정 복잡). 운영 전 SQLite→PostgreSQL 전환.
- **webpack dev 모드** 사용(`next dev --webpack`): 프로젝트 경로의 한글(멀티바이트) 문자에서
  Turbopack 이 라우트 빌드에 실패하는 이슈 우회.
- 세션은 `next-auth` 대신 `jose` 기반 경량 JWT 쿠키(React 19/Next 16 호환).
