# Cloudflare Pages 배포 가이드

이 문서는 인곽 민원 창구를 Cloudflare Pages에 배포하기 전에 필요한 인프라, 환경설정, 보안, 운영 요소를 정리합니다.

---

## 1. 전체 배포 아키텍처

```
[사용자]
   │
   ▼
[Cloudflare Pages]  Next.js 15.3.0 App Router (이 저장소 web/)
   │                 ├─ Pages Functions (API Routes, `runtime = 'edge'`)
   │                 └─ Static Assets
   │
   ├─ POST /api/auth/login  ────────┐
   │                                ▼
   │                      [riro-auth 마이크로서비스]
   │                      FastAPI (별도 서버/VPS/컨테이너)
   │
   ▼
[PostgreSQL 데이터베이스]
   Supabase / Neon / AWS RDS / 자체 PostgreSQL
   반드시 connection pooling(PgBouncer) 또는 Prisma Accelerate 사용
```

---

## 2. 사전 준비 사항

### 2.1 필수 계정 및 서비스

- Cloudflare 계정 (Pages, Workers, D1/R2 등 사용 가능)
- PostgreSQL 호스팅 서비스 계정
  - 권장: Supabase, Neon (serverless 친화적, pooling 지원)
- riro-auth를 호스팅할 서버 또는 컨테이너 플랫폼
  - 권장: Railway, Render, Fly.io, 또는 학교/개인 VPS

### 2.2 도메인 및 DNS

- Cloudflare Pages 기본 도메인: `*.pages.dev`
- 커스텀 도메인 사용 시 Cloudflare DNS에서 CNAME 설정
- riro-auth에 등록할 `FRONTEND_ORIGIN` 결정 필요

---

## 3. 데이터베이스 설정 (PostgreSQL)

Cloudflare Pages Functions(edge runtime)에서는 SQLite 파일에 접근할 수 없습니다. 개발/운영 모두 PostgreSQL이 필요하며, edge runtime에서는 `@neondatabase/serverless` 드라이버 어댑터를 사용합니다.

### 3.1 권장: Neon PostgreSQL

1. [Neon](https://neon.tech)에서 물리 프로젝트를 생성합니다.
2. `psql` 또는 Neon 대시보드에서 데이터베이스를 만듭니다(예: `ishs_minwon`).
3. **Connection String**을 복사합니다.

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/ishs_minwon?sslmode=require"
```

### 3.2 로컬 개발용 PostgreSQL

Docker Compose로 로컬 PostgreSQL을 실행할 수 있습니다.

```bash
cd web
docker compose up -d
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ishs_minwon
```

### 3.3 마이그레이션 실행

```bash
cd web
# 첫 마이그레이션 생성
npx prisma migrate dev --name init

# 이후 운영 DB에 적용
npm run db:migrate
```

---

## 4. 환경변수

### 4.1 Cloudflare Pages Dashboard → Settings → Environment variables

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `SESSION_SECRET` | JWT 서명용 비밀키 | `openssl rand -base64 32` |
| `RIRO_AUTH_URL` | riro-auth 서비스 공개 URL | `https://riro-auth.example.com` |
| `ALLOW_DEV_LOGIN` | 운영에서는 반드시 `false` | `false` |
| `NODE_ENV` | `production` 고정 | `production` |

### 4.2 riro-auth 서버 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `FRONTEND_ORIGIN` | 메인 앱 출처 | `https://ishs-minwon.pages.dev` |

---

## 5. Cloudflare Pages 빌드 설정

### 5.1 빌드 명령어

Cloudflare Pages 대시보드의 Build settings:

- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`

> `pages:build`는 `package.json`에 정의된 `npx @cloudflare/next-on-pages`를 실행합니다.

### 5.2 Node.js 버전

- **Node Version**: `20` (`.nvmrc` 참고)
- Cloudflare Pages의 "Build system version"을 `2`로 설정하면 Node 20이 사용됩니다.

### 5.3 `runtime = 'edge'`

Cloudflare Pages Functions를 사용하려는 모든 API 라우트와 동적 페이지 상단에 반드시 아래 구문이 있어야 합니다.

```ts
export const runtime = 'edge';
```

이 설정이 없으면 `next-on-pages`가 라우트를 Pages Function으로 생성하지 않아 404가 반환될 수 있습니다. 이미 모든 API 라우트와 `/admin/dashboard`, `/archived`, `/complaint/[id]`, `/mypage`에 적용되어 있습니다.

### 5.4 wrangler.toml

`wrangler.toml`이 이미 포함되어 있습니다. 필요에 따라 `compatibility_date`를 최신으로 업데이트하세요.

---

## 6. riro-auth 배포

`riro-auth/`는 Python FastAPI 애플리케이션입니다. Cloudflare Pages에서는 실행할 수 없으므로 별도로 배포해야 합니다.

### 6.1 권장 배포 방식

**Docker + VPS/Cloud Container Platform**

```dockerfile
# riro-auth/Dockerfile 예시
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.2 CORS 제한

`FRONTEND_ORIGIN` 환경변수를 설정하면, riro-auth는 해당 출처에서만 인증 요청을 받습니다.

---

## 7. 보안 체크리스트

- [ ] `ALLOW_DEV_LOGIN=false` (운영)
- [ ] `SESSION_SECRET`이 32바이트 이상의 강력한 랜덤 문자열
- [ ] 쿠키 `secure: true` (`NODE_ENV=production` 시 자동 적용)
- [ ] riro-auth CORS가 `FRONTEND_ORIGIN`으로 제한됨
- [ ] riro-auth 서버가 HTTPS로 노출됨
- [ ] PostgreSQL 접근은 IP 허용목록 + 강력한 비밀번호
- [ ] 관리자 계정(`하태욱`) 외 ADMIN 권한 부여 금지
- [ ] Cloudflare WAF / Rate Limiting 활성화 권장

---

## 8. 배포 후 확인 사항

1. 메인 페이지 접속 및 민원 목록 노출
2. 리로스쿨 로그인 (또는 운영에서는 실제 리로 인증)
3. 민원 작성, 투표, 댓글 작성
4. 관리자 계정으로 `/admin/dashboard` 접속
5. 댓글 숨김/해제, 사용자 정지/해제, 민원 삭제
6. 정지된 사용자가 로그인/글쓰기 차단되는지 확인

---

## 9. 알려진 제약 및 개선 권장 사항

| 항목 | 현재 상태 | 권장 개선 |
|------|----------|----------|
| Next.js 버전 | `15.3.0` (Cloudflare Pages 호환) | `@cloudflare/next-on-pages`가 Next.js 16을 지원하면 업그레이드 |
| Edge Runtime | 모든 API/동적 페이지에 적용 | Pages Functions로 정상 동작 |
| DB | SQLite (개발) | PostgreSQL + pooling |
| 인증 서비스 | 별도 FastAPI | VPS/컨테이너 배포 |
| 이미지 최적화 | `next/image unoptimized` | Cloudflare Images 또는 그대로 유지 |
| Rate Limiting | 없음 | Cloudflare Rate Limiting 또는 API Gateway |
| 로깅/모니터링 | 콘솔 로그 | Cloudflare Workers Logs, Sentry |
| 백업 | 없음 | PostgreSQL 자동 백업 설정 |

---

## 10. Troubleshooting

### Pages Functions가 404를 반환하는 경우

1. 해당 파일 상단에 `export const runtime = 'edge';`가 있는지 확인합니다.
2. `npm run pages:build` 로컬에서 성공하는지 확인합니다.
3. Cloudflare Pages 빌드 설정에서 **Build command**가 `npm run pages:build`이고 **Build output directory**가 `.vercel/output/static`인지 확인합니다.
4. Cloudflare Pages 대시보드 → Settings → Functions → **Compatibility flags**에 `nodejs_compat`가 포함되어 있는지 확인합니다.

### 메인 페이지는 뜨지만 API 호출이 실패하는 경우

Cloudflare Pages Functions는 로컬 SQLite 파일에 접근할 수 없습니다. `DATABASE_URL`을 PostgreSQL 연결 문자열로 변경하고 Prisma driver adapter를 설정해야 합니다(3장 참고).

---

## 11. 배포 명령어 요약

```bash
# 1. 의존성 설치 및 Prisma 클라이언트 생성
cd web
npm install

# 2. PostgreSQL 마이그레이션 (최초 1회)
npx prisma migrate deploy

# 3. Cloudflare Pages 빌드
npm run pages:build

# 4. Cloudflare Pages에 배포 (wrangler 로그인 필요)
npm run pages:deploy
```
