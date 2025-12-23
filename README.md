# Daisy (Date Planner Project)

**Daisy**는 데이트 코스 및 장소를 계획하고 공유하는 Next.js 기반 웹 애플리케이션입니다.
오라클 클라우드 VM(MySQL)과 연동되어 있으며, Docker를 이용한 컨테이너 배포 및 GitHub Actions를 통한 CI/CD가 구성되어 있습니다.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MySQL (Prisma ORM)
- **Styling**: Tailwind CSS
- **Deployment**: Docker, Docker Compose (Oracle Cloud VM)
- **CI/CD**: GitHub Actions

## 🚀 Getting Started

### 1. Prerequisites (필수 사전 설정)

이 프로젝트를 실행하거나 배포하기 위해서는 다음 설정들이 필요합니다.

#### 환경 변수 (.env)
로컬 개발 시 `.env` (또는 `.env.local`) 파일을 생성하고 다음 값을 설정하세요.

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXT_PUBLIC_KAKAO_MAP_API_KEY=""
GEMINI_API_KEY=""
GOOGLE_PLACES_API_KEY=""
KAKAO_REST_API_KEY=""
TMAP_API_KEY=""
```

**설명:**
- `DATABASE_URL`: MySQL 데이터베이스 연결 문자열
- `NEXT_PUBLIC_KAKAO_MAP_API_KEY`: 카카오맵 JavaScript API 키 (클라이언트)
- `GEMINI_API_KEY`: Google Gemini AI 사용을 위한 API 키
- `GOOGLE_PLACES_API_KEY`: Google Places API 키
- `KAKAO_REST_API_KEY`: 카카오 REST API 키 (서버 측 요청)
- `TMAP_API_KEY`: TMAP API 키

#### GitHub Actions Secrets (자동 배포용)
`prod` 브랜치 푸시 시 Oracle Cloud VM으로 자동 배포하기 위해 GitHub Repository Settings > Secrets에 다음 값을 등록해야 합니다.
- `HOST`: 배포할 VM의 공인 IP 주소
- `USERNAME`: SSH 접속 사용자명 (예: `opc`, `ubuntu`)
- `KEY`: SSH Private Key 전문

### 2. Local Development

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션 (MySQL 연결 필요)
npx prisma generate
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

### 3. Docker Deployment (Manual)

GitHub Actions를 통하지 않고 수동으로 배포할 경우:

```bash
# Docker 컨테이너 빌드 및 실행
docker compose up -d --build

# (최초 실행 시) DB 마이그레이션 적용
docker compose exec app npx prisma migrate deploy
```

## 📂 Project Structure

- `src/`: 소스 코드 (App Router 구조)
- `prisma/`: DB 스키마 및 마이그레이션 파일
- `.github/workflows/`: CI/CD 설정 파일
- `docker-compose.yml`: Docker 배포 설정
- `Dockerfile`: 프로덕션용 이미지 빌드 설정 (Standalone 모드)