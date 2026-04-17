# NestJS 리팩토링 패턴 가이드

> 현재 프로젝트를 업계 표준 수준으로 개선하기 위한 리팩토링 가이드입니다.
> 힌트 위주로 작성되었으며, 코드는 직접 작성해보세요.

## 목차

1. [에러 메시지 상수화](#1-에러-메시지-상수화)
2. [CommonService 분리](#2-commonservice-분리)
3. [findOrFail 공통화](#3-findorfail-공통화)
4. [Response Interceptor](#4-response-interceptor)
5. [Role Guard](#5-role-guard)
6. [Config Validation](#6-config-validation)
7. [실습 체크리스트](#7-실습-체크리스트)

---

## 1. 에러 메시지 상수화

### 현재 문제

```
'Post not found'                    (영어)
'검색하신 유저가 존재하지 않습니다'       (한글)
'You are not the author'            (영어)
→ 한/영 혼재, 메시지 관리 어려움
```

### 목표

모든 에러 메시지를 한 곳에서 관리합니다.

### 힌트

> 💡 힌트 1: `src/common/const/error-messages.ts` 파일을 만드세요.
> 도메인별로 그룹화하면 찾기 쉽습니다.
>
> ```
> export const ERROR = {
>   POST: {
>     NOT_FOUND: '...',
>     FORBIDDEN: '...',
>   },
>   COMMENT: {
>     NOT_FOUND: '...',
>     FORBIDDEN: '...',
>   },
>   USER: {
>     NOT_FOUND: '...',
>   },
> };
> ```

> 💡 힌트 2: 기존 서비스에서 문자열 리터럴을 상수로 교체하세요.
>
> ```
> // Before
> throw new NotFoundException('Post not found');
>
> // After
> throw new NotFoundException(ERROR.POST.NOT_FOUND);
> ```

> 💡 힌트 3: 한국어로 통일할지 영어로 통일할지 먼저 결정하세요.
> 프론트엔드에서 에러 메시지를 사용자에게 직접 보여준다면 → 한국어
> 프론트엔드에서 에러 코드로 분기한다면 → 영어 + 에러 코드

---

## 2. CommonService 분리

### 현재 문제

```
CommonService가 담당하는 것:
  - Offset 페이지네이션
  - Cursor 페이지네이션
  - 이미지 로컬 업로드
  - Presigned URL 발급
  → 단일 책임 원칙 위반
```

### 목표

역할별로 서비스를 분리합니다.

```
src/common/
  ├── pagination.service.ts    → paginate(), cursorPaginate()
  └── upload.service.ts        → uploadImage(), getPresignedUrl()
```

### 힌트

> 💡 힌트 1: 새 서비스 파일을 만들고 `CommonService`에서 관련 메서드를 이동하세요.
> S3Client 초기화 로직은 `UploadService`의 constructor로 이동합니다.

> 💡 힌트 2: `CommonModule`의 `providers`와 `exports`에 새 서비스를 등록하세요.
>
> ```
> providers: [PaginationService, UploadService],
> exports: [PaginationService, UploadService],
> ```

> 💡 힌트 3: `PostsService`에서 `CommonService` 대신 `PaginationService`를 주입받도록 수정하세요.
> `CommonController`에서도 `UploadService`를 주입받도록 수정합니다.

> 💡 힌트 4: 분리 후 `CommonService`가 비어있으면 삭제해도 됩니다.

---

## 3. findOrFail 공통화

### 현재 문제

```
PostsService    → private findPostOrFail()     (private 메서드)
CommentService  → 각 메서드에서 직접 null 체크   (중복 패턴)
UsersService    → findOne()에서 직접 체크        (또 다른 방식)
→ 도메인마다 다른 패턴
```

### 목표

공통 유틸 함수로 추출하여 모든 도메인에서 동일한 패턴을 사용합니다.

### 힌트

> 💡 힌트 1: `src/common/utils/assert.ts` 파일을 만드세요.
>
> ```
> export function assertFound<T>(
>   entity: T | null,
>   name: string,
> ): T {
>   // entity가 null이면 NotFoundException throw
>   // null이 아니면 entity 반환 (타입이 T로 좁혀짐)
> }
> ```

> 💡 힌트 2: 사용하는 쪽에서는 이렇게 됩니다.
>
> ```
> // Before
> const post = await this.postsRepository.findOne({ where: { id } });
> if (!post) {
>   throw new NotFoundException('Post not found');
> }
>
> // After (한 줄)
> const post = assertFound(await this.postsRepository.findOne({ where: { id } }), '게시글');
> ```

> 💡 힌트 3: 권한 검증도 같은 방식으로 공통화할 수 있습니다.
>
> ```
> export function assertOwner(entityUserId: number, currentUserId: number): void {
>   // 같지 않으면 ForbiddenException throw
> }
> ```

---

## 4. Response Interceptor

### 현재 문제

```
GET /posts     → { data: [...], meta: {...} }
GET /posts/1   → { id, title, content, ... }
POST /comments → { id, content, ... }
→ 엔드포인트마다 응답 구조가 다름
```

### 목표

모든 응답을 통일된 형태로 감쌉니다.

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-17T..."
}
```

### 힌트

> 💡 힌트 1: NestJS의 `@Injectable()` + `NestInterceptor`를 구현하세요.
>
> ```
> @Injectable()
> export class ResponseInterceptor implements NestInterceptor {
>   intercept(context: ExecutionContext, next: CallHandler) {
>     return next.handle().pipe(
>       map((data) => ({
>         // data를 감싸서 반환
>       })),
>     );
>   }
> }
> ```

> 💡 힌트 2: `rxjs`의 `map` 오퍼레이터를 사용합니다.
>
> ```
> import { map } from 'rxjs/operators';
> ```

> 💡 힌트 3: `main.ts`에서 글로벌로 적용하세요.
>
> ```
> app.useGlobalInterceptors(new ResponseInterceptor());
> ```

> 💡 힌트 4: 페이지네이션 응답은 이미 `{ data, meta }` 구조라서
> Interceptor에서 중복으로 감싸지 않도록 조건 분기가 필요합니다.
>
> ```
> // data 안에 이미 data 키가 있으면 → 페이지네이션 응답 → 그대로 반환
> // 아니면 → { success, data, timestamp } 로 감싸기
> ```

---

## 5. Role Guard

### 현재 문제

```
JwtAuthGuard만 있음 → 로그인 여부만 체크
모든 인증된 사용자가 모든 작업 가능
→ ADMIN/USER 역할 구분 없음
```

### 목표

UserRole enum을 활용한 역할 기반 접근 제어를 구현합니다.

```
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
deleteUser() {}
→ ADMIN만 유저 삭제 가능
```

### 힌트

> 💡 힌트 1: 커스텀 데코레이터 `@Roles()`를 만드세요.
>
> ```
> // auth/decorators/roles.decorator.ts
> import { SetMetadata } from '@nestjs/common';
>
> // SetMetadata는 메타데이터를 라우트에 붙이는 역할
> // Guard에서 Reflector로 읽어올 수 있음
> ```

> 💡 힌트 2: `RolesGuard`를 만드세요.
>
> ```
> // auth/guards/roles.guard.ts
> @Injectable()
> export class RolesGuard implements CanActivate {
>   constructor(private reflector: Reflector) {}
>
>   canActivate(context: ExecutionContext): boolean {
>     // 1) reflector로 @Roles()에서 설정한 역할 가져오기
>     // 2) request.user에서 현재 사용자 역할 가져오기
>     // 3) 비교해서 true/false 반환
>   }
> }
> ```

> 💡 힌트 3: `Reflector`는 NestJS가 자동 주입해줍니다.
> `@nestjs/core`에서 import합니다.

> 💡 힌트 4: Guard 적용 순서가 중요합니다.
>
> ```
> @UseGuards(JwtAuthGuard, RolesGuard)
> //         1) 먼저 인증  2) 그 다음 역할 체크
> ```

> 💡 힌트 5: 현재 JWT payload에 `role`이 없습니다.
> `AuthService.generateTokens()`에서 payload에 role을 추가해야 합니다.
> `JwtPayload` 타입에도 `role` 필드를 추가하세요.

---

## 6. Config Validation

### 현재 문제

```
.env에 값이 없으면:
  configService.get('DB_HOST') → undefined
  → 런타임에 에러 발생 (서버가 뜬 후에야 발견)
```

### 목표

서버 시작 시 필수 환경변수가 없으면 즉시 실패하도록 합니다.

### 힌트

> 💡 힌트 1: `joi` 패키지를 설치하세요.
>
> ```bash
> npm install joi
> ```

> 💡 힌트 2: `ConfigModule.forRoot()`에 `validationSchema`를 추가하세요.
>
> ```
> ConfigModule.forRoot({
>   isGlobal: true,
>   validationSchema: Joi.object({
>     DB_HOST: Joi.string().required(),
>     DB_PORT: Joi.number().default(5432),
>     JWT_SECRET: Joi.string().required(),
>     // ... 나머지 환경변수
>   }),
> })
> ```

> 💡 힌트 3: `.required()`는 필수값, `.default()`는 기본값 지정입니다.
> 필수값이 없으면 서버가 아예 뜨지 않습니다.
>
> ```
> Error: Config validation error:
>   "JWT_SECRET" is required
> ```

> 💡 힌트 4: `BCRYPT_ROUNDS`처럼 기본값이 있는 항목은
> `Joi.number().default(10)` 으로 설정하면 `.env`에 없어도 기본값을 사용합니다.

---

## 7. 실습 체크리스트

### Phase 1 — 코드 정리 (쉬움)

- [ ] 에러 메시지 상수 파일 생성 (`common/const/error-messages.ts`)
- [ ] 모든 서비스의 에러 메시지를 상수로 교체
- [ ] 한/영 통일 확인

### Phase 2 — 구조 개선 (쉬움)

- [ ] `CommonService` → `PaginationService` + `UploadService` 분리
- [ ] `CommonModule` providers/exports 수정
- [ ] 기존 주입처 (`PostsService`, `CommonController`) 수정
- [ ] `assertFound`, `assertOwner` 공통 유틸 생성
- [ ] `PostsService`, `CommentService`에 적용

### Phase 3 — NestJS 패턴 (보통)

- [ ] `ResponseInterceptor` 구현 및 글로벌 적용
- [ ] 모든 엔드포인트 응답 형태 확인
- [ ] 페이지네이션 응답과 일반 응답 구분 처리

### Phase 4 — 인가 고도화 (보통)

- [ ] `@Roles()` 커스텀 데코레이터 생성
- [ ] `RolesGuard` 구현
- [ ] JWT payload에 `role` 추가
- [ ] `JwtPayload` 타입 수정
- [ ] 관리자 전용 엔드포인트에 적용 테스트

### Phase 5 — 안정성 (보통)

- [ ] `joi` 설치
- [ ] `ConfigModule`에 `validationSchema` 추가
- [ ] 모든 필수 환경변수 정의
- [ ] `.env`에서 값 하나 제거 후 서버 시작 실패 확인
