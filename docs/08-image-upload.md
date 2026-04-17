# 이미지 업로드 구현 가이드

> Multer를 사용한 로컬 이미지 업로드 → 이후 AWS S3 마이그레이션 순서로 학습합니다.

## 목차

1. [동작 원리](#1-동작-원리)
2. [로컬 저장 구현](#2-로컬-저장-구현)
3. [Posts와 연결](#3-posts와-연결)
4. [AWS S3 마이그레이션](#4-aws-s3-마이그레이션)
5. [실습 체크리스트](#5-실습-체크리스트)

---

## 1. 동작 원리

```
클라이언트
    │
    │  POST /common/image
    │  Content-Type: multipart/form-data
    │  Body: { image: File }
    ▼
CommonController
    │
    │  @UseInterceptors(FileInterceptor('image'))
    │  @UploadedFile() file: Express.Multer.File
    ▼
저장 (로컬 or S3)
    │
    │  저장된 경로/URL 반환
    ▼
클라이언트
    │
    │  반환받은 URL을 POST /posts의 imagePath에 담아 전송
    ▼
DB 저장
```

---

## 2. 로컬 저장 구현

### 2-1. 패키지 설치

```bash
npm install @types/multer
```

> 💡 NestJS에는 Multer가 내장되어 있어 별도 설치 없이 `@types/multer`만 설치하면 됩니다.

### 2-2. 업로드 폴더 생성

```
프로젝트 루트/public/images/
```

> 💡 힌트: `.gitignore`에 `public/images/*`를 추가하되, 폴더는 유지하려면 `public/images/.gitkeep` 파일을 만드세요.

### 2-3. CommonController에 업로드 엔드포인트 추가

```
POST /common/image
```

적용할 데코레이터:
- `@UseInterceptors(FileInterceptor('image'))` — 'image' 키로 파일 받기
- `@UploadedFile() file: Express.Multer.File` — 파일 객체 주입

> 💡 힌트: `FileInterceptor`는 `@nestjs/platform-express`에서 import합니다.

### 2-4. Multer 저장 옵션 설정

```typescript
// 저장 위치와 파일명 지정
MulterModule.register({
  storage: diskStorage({
    destination: './public/images',
    filename: (req, file, cb) => {
      // 파일명 중복 방지 — uuid 사용 권장
      // 원본 확장자 유지
    },
  }),
})
```

> 💡 힌트: 파일명 중복 방지는 `uuid` 패키지를 사용하세요.
> ```bash
> npm install uuid @types/uuid
> ```

### 2-5. Static 파일 서빙 설정

`main.ts`에서 업로드된 파일을 URL로 접근 가능하게 설정합니다.

```typescript
// main.ts
app.useStaticAssets(join(__dirname, '..', 'public'), {
  prefix: '/public',
});

// import 필요
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
```

> 💡 `NestFactory.create<NestExpressApplication>(AppModule)` 으로 타입 변경 필요

설정 후 접근 방법:
```
http://localhost:3000/public/images/파일명.jpg
```

### 2-6. 업로드 응답 형태

```json
{
  "imageUrl": "http://localhost:3000/public/images/uuid.jpg"
}
```

---

## 3. Posts와 연결

이미지 업로드 후 반환받은 URL을 게시글 생성 시 `imagePath`에 담아 전송합니다.

```
1. POST /common/image → { imageUrl: "http://..." } 반환
2. POST /posts        → { title, content, imagePath: ["http://..."] }
```

---

## 4. AWS S3 마이그레이션

로컬 저장 방식이 동작하면 S3로 교체합니다.

### 필요 패키지

```bash
npm install @aws-sdk/client-s3 multer-s3
```

### 로컬 vs S3 차이점

| 항목 | 로컬 | S3 |
|------|------|----|
| 저장 위치 | 서버 디스크 | AWS 클라우드 |
| 서버 재시작 | 파일 유지 | 파일 유지 |
| 스케일 아웃 | 파일 공유 불가 | 공유 가능 |
| 비용 | 무료 | 유료 |
| 실무 사용 | X | O |

### 변경되는 부분

```
diskStorage() → multerS3()
destination   → bucket, key
반환 URL      → S3 URL (https://bucket.s3.region.amazonaws.com/key)
```

> 💡 로컬 저장과 S3의 차이는 **storage 옵션만** 바꾸면 됩니다. 나머지 로직은 동일합니다.

### 필요한 환경변수

```
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

---

## 5. 실습 체크리스트

### Phase 1 — 로컬 저장

- [ ] `@types/multer`, `uuid` 패키지 설치
- [ ] `public/images/` 폴더 생성
- [ ] `MulterModule` 설정 (destination, filename with uuid)
- [ ] `CommonController`에 `POST /common/image` 추가
- [ ] `main.ts`에 Static 파일 서빙 설정
- [ ] 포스트맨으로 이미지 업로드 테스트
  - Body → form-data → image(File) 키로 이미지 전송
  - 응답으로 imageUrl 확인
  - 브라우저에서 반환된 URL 직접 접근 확인

### Phase 2 — Posts 연결

- [ ] `POST /posts` 요청 시 imagePath에 URL 배열 담아 전송
- [ ] DB에 imagePath가 저장되는지 확인

### Phase 3 — S3 마이그레이션 (선택)

- [ ] AWS S3 버킷 생성
- [ ] IAM 키 발급 및 `.env` 설정
- [ ] `multer-s3` storage로 교체
- [ ] S3 URL로 이미지 접근 확인
