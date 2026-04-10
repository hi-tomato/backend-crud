# NestJS 아키텍처 개요

## NestJS란?

NestJS는 **Node.js 위에서 동작하는 서버사이드 프레임워크**다. Angular에서 영감을 받아 만들어졌기 때문에, 프론트엔드 개발자에게 친숙한 개념이 많다.

| 프론트엔드 (React/Angular) | NestJS (백엔드) |
|---|---|
| 컴포넌트 | Controller |
| 커스텀 훅 / 서비스 | Service (Provider) |
| Context Provider | Module |
| HOC / Middleware | Guard, Interceptor, Pipe |
| Route 정의 | @Controller() + @Get(), @Post() 등 |

---

## 모듈 기반 아키텍처

NestJS의 핵심은 **Module**이다. 모든 기능은 모듈 단위로 캡슐화된다.

```
AppModule (루트)
├── UsersModule        ← 사용자 관련 기능
│   ├── UsersController
│   ├── UsersService
│   └── User Entity
├── PostsModule        ← 게시글 관련 기능
│   ├── PostsController
│   ├── PostsService
│   └── Post Entity
└── AuthModule         ← 인증 관련 기능
    ├── AuthController
    ├── AuthService
    └── AuthGuard
```

> **프론트 비유**: React에서 `features/` 폴더 아래에 관련 컴포넌트, 훅, 유틸을 모아놓는 것과 같다. NestJS에서는 이걸 `Module`이라는 공식적인 단위로 관리한다.

---

## 레이어드 아키텍처 (Layered Architecture)

NestJS에서 가장 널리 쓰이는 패턴이다. 각 레이어는 **단일 책임**을 가진다.

```
[클라이언트 요청]
       ↓
┌─────────────────┐
│   Controller    │  ← HTTP 요청/응답 처리 (라우팅)
└────────┬────────┘
         ↓
┌─────────────────┐
│    Service      │  ← 비즈니스 로직
└────────┬────────┘
         ↓
┌─────────────────┐
│   Repository    │  ← 데이터베이스 접근
└─────────────────┘
```

### 각 레이어의 역할

**Controller** — "어떤 요청이 왔는지 파악하고 응답을 돌려준다"
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll(); // 비즈니스 로직은 Service에 위임
  }
}
```

**Service** — "실제 비즈니스 로직을 수행한다"
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll() {
    return this.usersRepository.find(); // DB 접근은 Repository에 위임
  }
}
```

**Repository** — "데이터베이스와 직접 통신한다"
```typescript
// TypeORM 사용 시 자동 생성되거나, 커스텀 Repository를 만들 수 있다
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  find() {
    return this.repo.find();
  }
}
```

> **왜 이렇게 나누는가?** Controller에 모든 로직을 넣으면 프론트에서 컴포넌트에 API 호출, 상태 관리, UI 로직을 전부 넣는 것과 같다. 테스트하기 어렵고, 재사용이 불가능하며, 코드가 금방 복잡해진다.

---

## 권장 디렉토리 구조

### Feature-based 구조 (권장)

```
src/
├── main.ts                          # 앱 진입점
├── app.module.ts                    # 루트 모듈
│
├── users/                           # 사용자 기능 모듈
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── users.controller.spec.ts
│
├── posts/                           # 게시글 기능 모듈
│   ├── posts.module.ts
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── dto/
│   │   ├── create-post.dto.ts
│   │   └── update-post.dto.ts
│   ├── entities/
│   │   └── post.entity.ts
│   └── posts.controller.spec.ts
│
├── auth/                            # 인증 모듈
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       └── login.dto.ts
│
└── common/                          # 공통 유틸리티
    ├── decorators/
    ├── filters/
    ├── guards/
    ├── interceptors/
    └── pipes/
```

> **프론트 비유**: Next.js의 app 디렉토리에서 `app/users/`, `app/posts/` 처럼 기능별로 폴더를 나누는 것과 동일한 사고방식이다.

### CLI로 모듈 생성하기

```bash
# users 모듈 한 번에 생성
nest generate resource users

# 개별 생성
nest generate module users
nest generate controller users
nest generate service users
```

`nest generate resource`는 Module, Controller, Service, DTO, Entity를 한 번에 만들어준다. CRUD 보일러플레이트까지 자동 생성된다.

---

## 핵심 요약

1. **모듈 단위로 기능을 캡슐화**한다 (Feature Module)
2. **Controller → Service → Repository** 레이어로 책임을 분리한다
3. Controller는 HTTP만, Service는 비즈니스 로직만, Repository는 DB만 담당한다
4. `nest generate resource`로 빠르게 기능 모듈을 생성할 수 있다

> 다음 문서: [02-core-concepts.md](./02-core-concepts.md) — 핵심 개념 (DI, 데코레이터, 요청 생명주기)
