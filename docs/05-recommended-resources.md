# 추천 오픈소스 & 학습 자료

## 1. 참고할 만한 오픈소스 프로젝트

### 입문 ~ 중급

| 프로젝트 | 설명 |
|---|---|
| **nestjs/nest (공식 예제)** | `sample/` 디렉토리에 20개 이상의 패턴별 예제가 있다. CRUD, Auth, WebSocket, GraphQL 등 |
| **nestjs/typescript-starter** | 공식 스타터 템플릿. 가장 기본적인 프로젝트 구조 |

### 실무 수준

| 프로젝트 | 설명 |
|---|---|
| **brocoders/nestjs-boilerplate** | 인증, 역할, 메일, 파일 업로드, DB 시딩 등 실무 기능이 포함된 보일러플레이트 |
| **rubiin/ultimate-nest** | Prisma, Redis, S3, Swagger, 테스트 등 실무 스택이 통합된 고급 보일러플레이트 |
| **ever-co/ever-demand** | NestJS로 만든 실제 프로덕션 수준의 커머스 플랫폼 |

### 특정 패턴 학습

| 프로젝트 | 학습 포인트 |
|---|---|
| **lujakob/nestjs-realworld-example-app** | Medium 클론. 실제 앱의 CRUD + 인증 구조 |
| **nestjs/cqrs (공식)** | CQRS 패턴 구현 예제 |

> 위 프로젝트들은 모두 GitHub에서 검색할 수 있다. 스타 수가 높은 프로젝트 위주로 선별했다.

---

## 2. 공식 문서 핵심 섹션

NestJS 공식 문서(docs.nestjs.com)는 매우 잘 정리되어 있다. 아래 순서로 읽는 것을 추천한다.

### 우선 읽기 (CRUD 학습 직후)

1. **Overview > First Steps** — 프로젝트 구조 이해
2. **Overview > Modules** — 모듈 시스템 이해
3. **Overview > Providers** — DI 패턴 이해
4. **Overview > Pipes** — 유효성 검사 이해
5. **Overview > Exception Filters** — 에러 핸들링

### 다음 단계

6. **Overview > Guards** — 인증/인가 구현 시
7. **Overview > Interceptors** — 응답 변환, 로깅 필요 시
8. **Techniques > Database** — TypeORM 또는 Prisma 연동
9. **Techniques > Configuration** — 환경변수 관리
10. **Techniques > Authentication** — JWT 인증 구현

### 필요할 때 참고

- **Techniques > Validation** — 고급 유효성 검사
- **Techniques > Caching** — 캐싱 전략
- **Techniques > Task Scheduling** — 크론잡/스케줄링
- **Techniques > Queues** — 비동기 작업 큐 (Bull)
- **Security > CORS, Helmet, Rate Limiting** — 보안 설정

---

## 3. 프론트엔드 개발자를 위한 학습 로드맵

```
Phase 1: 기초 (현재 단계)
├── NestJS CRUD 기본 ✅
├── DTO & 유효성 검사 (class-validator)
├── 데이터베이스 연동 (TypeORM 또는 Prisma)
└── 에러 핸들링 (HttpException)

Phase 2: 인증 & 보안
├── JWT 인증 구현
├── Guard를 활용한 인가
├── bcrypt 패스워드 해싱
└── CORS, Helmet, Rate Limiting

Phase 3: 실무 패턴
├── ConfigModule (환경변수)
├── Interceptor (로깅, 응답 변환)
├── Custom Decorator
├── Swagger API 문서화
└── 테스트 (Unit, E2E)

Phase 4: 고급 주제
├── WebSocket (실시간 통신)
├── Queue (Bull — 비동기 작업)
├── Caching (Redis)
├── Microservices 패턴
└── CQRS & Event Sourcing
```

### Phase별 추천 실습 프로젝트

| Phase | 프로젝트 | 학습 포인트 |
|---|---|---|
| 1 | 할일 목록 API | CRUD, DTO, DB 연동 |
| 2 | 블로그 API + 회원가입/로그인 | JWT, Guard, 관계형 데이터 |
| 3 | 파일 업로드 + API 문서화 | Multer, Swagger, Interceptor |
| 4 | 실시간 채팅 | WebSocket Gateway, Redis Pub/Sub |

---

## 4. 프론트엔드 경험이 도움 되는 부분

백엔드를 처음 배울 때 프론트엔드 경험이 유리한 점들:

- **TypeScript**: 이미 TS에 익숙하므로 NestJS의 타입 시스템을 빠르게 이해할 수 있다
- **컴포넌트 사고방식**: 기능을 독립적인 단위(Module)로 분리하는 사고가 이미 있다
- **API 소비자 관점**: 좋은 API가 뭔지 이미 알고 있다. 프론트에서 쓰기 좋은 API를 설계할 수 있다
- **비동기 처리**: Promise, async/await에 익숙하다
- **데코레이터**: Angular 경험이 있다면 특히 유리하다

---

## 5. 함께 알면 좋은 도구들

| 도구 | 용도 |
|---|---|
| **Swagger (`@nestjs/swagger`)** | API 문서 자동 생성 |
| **Prisma Studio** | DB GUI 뷰어 (프론트 개발 시 유용) |
| **Docker** | 로컬 DB(PostgreSQL, Redis) 실행 |
| **Postman / Insomnia / Bruno** | API 테스트 |
| **TablePlus / DBeaver** | DB 클라이언트 |

---

> 이 문서 시리즈: [01-아키텍처 개요](./01-architecture-overview.md) → [02-핵심 개념](./02-core-concepts.md) → [03-CRUD 패턴](./03-crud-patterns.md) → [04-고급 패턴](./04-advanced-patterns.md) → **05-추천 자료**
