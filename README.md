# Backend CRUD - 커뮤니티 게시판 API

NestJS로 구축된 SNS 프로젝트 백엔드 API입니다.  
프론트엔드(JavaScript, React 등) 연습용 서버로, 새싹 **토마토**들이 실제 API와 통신하며 CRUD를 학습할 수 있습니다.

## 주요 기능

- JWT 기반 회원가입/로그인 (Access Token + Refresh Token)
- 게시글 CRUD (오프셋 페이지네이션 + 커서 페이지네이션 + 검색)
- 댓글 CRUD (소프트 삭제)
- 이미지 업로드 (로컬 저장 + MinIO Presigned URL)
- 역할 기반 접근 제어 (ADMIN, USER, VISITOR)
- 작성자 본인만 수정/삭제 가능

## 사전 준비

- **Node.js** 18 이상
- **Yarn** (권장) 또는 npm
- **Docker Desktop** ([Mac](https://docs.docker.com/desktop/setup/install/mac-install/) / [Windows](https://docs.docker.com/desktop/setup/install/windows-install/))

## 시작하기

### 1. 의존성 설치

```bash
yarn install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

> `.env` 파일이 생성됩니다. 기본값 그대로 사용해도 로컬 개발에 문제없습니다.
> `JWT_SECRET`만 원하는 값으로 변경하세요.

### 3. Docker 서비스 실행

Docker Desktop이 실행 중인지 확인한 후:

```bash
docker compose up -d
```

이 명령어로 아래 서비스가 시작됩니다:


| 서비스           | 포트                    | 설명              |
| ------------- | --------------------- | --------------- |
| PostgreSQL 16 | 5432                  | 메인 데이터베이스       |
| MinIO         | 9000 (API), 9001 (콘솔) | 이미지 저장소 (S3 호환) |


### 4. MinIO 버킷 생성 (이미지 업로드 사용 시)

1. 브라우저에서 `http://localhost:9001` 접속
2. ID: `minioadmin` / PW: `minioadmin` 으로 로그인
3. 좌측 메뉴 **Buckets** > **Create Bucket** 클릭
4. Bucket Name: `images` 입력 후 생성

### 5. 서버 실행

```bash
# 개발 모드 (파일 변경 시 자동 재시작)
# 스웨거 문서 실행 링크 (http://localhost:3000/api-docs)
yarn start:dev

# 일반 실행
yarn start

# 프로덕션 빌드 후 실행
yarn build && yarn start:prod
```

서버가 `http://localhost:3000`에서 실행됩니다.

---

## API 엔드포인트

### Auth (인증) - 토큰 불필요


| Method | Endpoint               | Description | Body                                         |
| ------ | ---------------------- | ----------- | -------------------------------------------- |
| POST   | `/auth/register/email` | 회원가입        | `{ email, name, password, passwordConfirm }` |
| POST   | `/auth/login/email`    | 로그인         | `{ email, password }`                        |
| POST   | `/auth/refreshToken`   | 토큰 갱신       | `{ refreshToken }`                           |


### Posts (게시글) - JWT 필요


| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| POST   | `/posts`        | 게시글 작성              |
| GET    | `/posts`        | 게시글 목록 (오프셋 페이지네이션) |
| GET    | `/posts/cursor` | 게시글 목록 (커서 페이지네이션)  |
| GET    | `/posts/:id`    | 게시글 상세 조회           |
| PATCH  | `/posts/:id`    | 게시글 수정 (작성자만)       |
| DELETE | `/posts/:id`    | 게시글 삭제 (작성자만)       |


### Comments (댓글) - JWT 필요


| Method | Endpoint                      | Description  |
| ------ | ----------------------------- | ------------ |
| POST   | `/posts/:postId/comments`     | 댓글 작성        |
| GET    | `/posts/:postId/comments/:id` | 댓글 조회        |
| PATCH  | `/posts/:postId/comments/:id` | 댓글 수정 (작성자만) |
| DELETE | `/posts/:postId/comments/:id` | 댓글 삭제 (작성자만) |


### Users (사용자) - JWT 필요


| Method | Endpoint     | Description |
| ------ | ------------ | ----------- |
| GET    | `/users`     | 전체 사용자 목록   |
| GET    | `/users/:id` | 사용자 상세 조회   |
| POST   | `/users`     | 사용자 생성      |
| PATCH  | `/users/:id` | 사용자 수정      |
| DELETE | `/users/:id` | 사용자 삭제      |


### Common (파일 업로드) - 토큰 불필요


| Method | Endpoint                 | Description                       |
| ------ | ------------------------ | --------------------------------- |
| POST   | `/common/image`          | 이미지 업로드 (단일, multipart/form-data) |
| POST   | `/common/images`         | 이미지 업로드 (최대 5개)                   |
| POST   | `/common/presigned-url`  | Presigned URL 발급 (단일)             |
| POST   | `/common/presigned-urls` | Presigned URL 발급 (다중)             |


### 인증 방법

로그인 후 받은 `accessToken`을 요청 헤더에 포함합니다:

```
Authorization: Bearer <accessToken>
```

---

## 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-17T12:00:00.000Z"
}
```

### 에러 응답

```json
{
  "success": false,
  "statusCode": 404,
  "code": "POST_NOT_FOUND",
  "message": "게시글을 찾을 수 없습니다",
  "timestamp": "2026-04-17T12:00:00.000Z"
}
```

프론트엔드에서 `code` 값으로 에러를 분기 처리할 수 있습니다.

### 에러 코드 목록

| 코드 | 상태 코드 | 설명 |
|------|-----------|------|
| `COMMON_UNAUTHORIZED` | 401 | 토큰 없음 |
| `COMMON_INVALID_TOKEN` | 401 | 토큰 만료 또는 유효하지 않음 |
| `COMMON_FORBIDDEN` | 403 | 권한 없음 (역할 부족) |
| `COMMON_FILE_NOT_FOUND` | 400 | 업로드 파일 누락 |
| `COMMON_UNSUPPORTED_FILE_TYPE` | 400 | 지원하지 않는 파일 형식 |
| `USER_NOT_FOUND` | 404 | 사용자를 찾을 수 없음 |
| `USER_EMAIL_EXISTS` | 409 | 이미 사용 중인 이메일 |
| `USER_PASSWORD_MISMATCH` | 400 | 비밀번호 불일치 |
| `POST_NOT_FOUND` | 404 | 게시글을 찾을 수 없음 |
| `POST_FORBIDDEN` | 403 | 게시글 작성자가 아님 |
| `COMMENT_NOT_FOUND` | 404 | 댓글을 찾을 수 없음 |
| `COMMENT_FORBIDDEN` | 403 | 댓글 작성자가 아님 |

---

## 페이지네이션

### 오프셋 페이지네이션 (`GET /posts`)


| 파라미터        | 기본값   | 설명                             |
| ----------- | ----- | ------------------------------ |
| `page`      | 1     | 페이지 번호                         |
| `limit`     | 20    | 한 페이지당 게시글 수 (10~100)          |
| `__order`   | DESC  | 정렬 방향 (DESC, ASC)              |
| `__orderBy` | title | 정렬 기준 (title, content, author) |
| `__search`  | -     | 검색어 (제목, 내용, 작성자 이름 검색)        |


### 커서 페이지네이션 (`GET /posts/cursor`)


| 파라미터       | 기본값  | 설명                 |
| ---------- | ---- | ------------------ |
| `__cursor` | 0    | 커서 위치 (마지막 게시글 ID) |
| `__limit`  | 20   | 가져올 게시글 수          |
| `__order`  | DESC | 정렬 방향 (DESC, ASC)  |


---

## 환경 변수


| 변수                 | 설명              | 기본값                     |
| ------------------ | --------------- | ----------------------- |
| `PORT`             | 서버 포트           | `3000`                  |
| `PROTOCOL`         | 프로토콜            | `http`                  |
| `HOST`             | 호스트 주소          | `localhost:3000`        |
| `DB_HOST`          | PostgreSQL 호스트  | `localhost`             |
| `DB_PORT`          | PostgreSQL 포트   | `5432`                  |
| `DB_USERNAME`      | PostgreSQL 사용자  | `postgres`              |
| `DB_PASSWORD`      | PostgreSQL 비밀번호 | `postgres`              |
| `DB_NAME`          | 데이터베이스 이름       | `postgres`              |
| `JWT_SECRET`       | JWT 서명 시크릿      | -                       |
| `BCRYPT_ROUNDS`    | bcrypt 해싱 라운드   | `10`                    |
| `MINIO_ENDPOINT`   | MinIO 엔드포인트     | `http://localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO 접근 키      | `minioadmin`            |
| `MINIO_SECRET_KEY` | MinIO 비밀 키      | `minioadmin`            |
| `MINIO_BUCKET`     | MinIO 버킷 이름     | `images`                |


---

## npm Scripts


| 명령어                | 설명             |
| ------------------ | -------------- |
| `yarn start`       | 서버 실행          |
| `yarn start:dev`   | 개발 모드 (watch)  |
| `yarn start:debug` | 디버그 모드         |
| `yarn start:prod`  | 프로덕션 실행 (빌드 후) |
| `yarn build`       | TypeScript 빌드  |
| `yarn lint`        | ESLint 실행      |
| `yarn format`      | Prettier 포맷팅   |
| `yarn test`        | 단위 테스트         |
| `yarn test:e2e`    | E2E 테스트        |
| `yarn test:cov`    | 테스트 커버리지       |


---

## 프로젝트 구조

```
src/
├── auth/              # 인증 (JWT, 가드, 데코레이터)
│   ├── decorators/    # @CurrentUser, @Roles
│   ├── guards/        # JwtAuthGuard, RolesGuard
│   ├── dto/           # RegisterDto, LoginDto
│   └── types/         # JwtPayload 타입
├── comment/           # 댓글 CRUD
├── common/            # 공통 유틸리티
│   ├── const/         # 에러 메시지, enum 상수
│   ├── dto/           # 페이지네이션 DTO
│   ├── interceptor/   # 응답 포맷 인터셉터
│   └── utils/         # assertFound, assertOwner
├── posts/             # 게시글 CRUD
├── users/             # 사용자 관리
├── app.module.ts      # 루트 모듈
└── main.ts            # 엔트리포인트
```

---

## 학습 자료

`docs/` 디렉토리에 NestJS 학습 가이드가 준비되어 있습니다:

- 아키텍처 개요
- 핵심 개념 (DI, 데코레이터, 요청 라이프사이클)
- CRUD 패턴
- 페이지네이션 구현
- 이미지 업로드
- 리팩토링 패턴

---

## 참고 사항

- `synchronize: true`가 설정되어 있어 엔티티 변경 시 DB 스키마가 자동으로 동기화됩니다 (개발 전용 설정).
- 지원하는 이미지 형식: `.jpg`, `.jpeg`, `.png`, `.webp` (최대 5MB)
- 모든 API 응답은 `{ success: true, data: ... }` 형태로 래핑됩니다.

