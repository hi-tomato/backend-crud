# NestJS 핵심 개념

## 1. Module — 기능을 묶는 컨테이너

Module은 관련된 Controller, Service, Entity를 하나로 묶는 단위다.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],  // 다른 모듈 가져오기
  controllers: [UsersController],                // 이 모듈의 컨트롤러
  providers: [UsersService],                     // 이 모듈의 서비스 (Provider)
  exports: [UsersService],                       // 다른 모듈에 공개할 서비스
})
export class UsersModule {}
```

### Module 간 의존성

```
PostsModule이 UsersService를 쓰고 싶다면?

1. UsersModule에서 UsersService를 exports에 등록
2. PostsModule에서 UsersModule을 imports에 추가
```

```typescript
// users.module.ts
@Module({
  providers: [UsersService],
  exports: [UsersService],    // ← 외부에 공개
})
export class UsersModule {}

// posts.module.ts
@Module({
  imports: [UsersModule],     // ← UsersModule 가져오기
  providers: [PostsService],
})
export class PostsModule {}

// posts.service.ts — 이제 UsersService 주입 가능
@Injectable()
export class PostsService {
  constructor(private readonly usersService: UsersService) {}
}
```

> **프론트 비유**: React에서 Context Provider를 감싸야 하위 컴포넌트에서 `useContext`로 값을 꺼낼 수 있는 것과 같다. NestJS에서는 `exports`가 Provider, `imports`가 Consumer 역할이다.

---

## 2. Dependency Injection (DI) — 의존성 주입

NestJS의 가장 중요한 개념이다. 클래스가 직접 의존성을 만들지 않고, **프레임워크가 알아서 넣어준다**.

### DI 없이 (나쁜 예)

```typescript
class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService(); // 직접 생성 ← 문제!
  }
}
```

### DI 사용 (좋은 예)

```typescript
@Controller('users')
class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // NestJS가 UsersService 인스턴스를 자동으로 넣어준다
}
```

### 왜 DI를 쓰는가?

1. **테스트가 쉽다**: 테스트 시 가짜(Mock) 서비스를 주입할 수 있다
2. **결합도가 낮다**: Service를 교체해도 Controller를 수정할 필요 없다
3. **싱글톤 관리**: NestJS가 인스턴스를 하나만 만들어 재사용한다

> **프론트 비유**: React의 `useContext`와 비슷하다. 컴포넌트가 직접 값을 만들지 않고, Provider가 제공한 값을 주입받아 사용한다. NestJS의 DI는 이것의 더 체계적인 버전이다.

### Provider 등록 과정

```
1. @Injectable() 데코레이터로 클래스를 "주입 가능"하게 표시
2. Module의 providers 배열에 등록
3. 다른 클래스의 constructor에서 타입으로 요청
4. NestJS IoC 컨테이너가 자동으로 인스턴스를 생성하고 주입
```

---

## 3. 데코레이터 (Decorator)

NestJS는 TypeScript 데코레이터를 적극 활용한다. 데코레이터는 **클래스나 메서드에 메타데이터를 붙이는 문법**이다.

### 주요 데코레이터 정리

| 데코레이터 | 위치 | 역할 |
|---|---|---|
| `@Module()` | 클래스 | 모듈 정의 |
| `@Controller('path')` | 클래스 | 컨트롤러 + 라우트 prefix |
| `@Injectable()` | 클래스 | DI 가능한 Provider로 등록 |
| `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()` | 메서드 | HTTP 메서드 라우팅 |
| `@Body()` | 파라미터 | 요청 body 추출 |
| `@Param('id')` | 파라미터 | URL 파라미터 추출 |
| `@Query()` | 파라미터 | 쿼리스트링 추출 |
| `@Headers()` | 파라미터 | 요청 헤더 추출 |
| `@UseGuards()` | 클래스/메서드 | Guard 적용 |
| `@UsePipes()` | 클래스/메서드 | Pipe 적용 |
| `@UseInterceptors()` | 클래스/메서드 | Interceptor 적용 |
| `@UseFilters()` | 클래스/메서드 | Exception Filter 적용 |

### 실제 사용 예시

```typescript
@Controller('posts')          // /posts 라우트
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()                      // GET /posts
  findAll(@Query('page') page: number) {
    return this.postsService.findAll(page);
  }

  @Get(':id')                 // GET /posts/123
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()                     // POST /posts
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Patch(':id')               // PATCH /posts/123
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')              // DELETE /posts/123
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
```

---

## 4. 요청 생명주기 (Request Lifecycle)

HTTP 요청이 들어왔을 때 NestJS 내부에서 거치는 순서다. 이 순서를 이해하면 어디에 어떤 로직을 넣어야 하는지 판단할 수 있다.

```
클라이언트 요청
    ↓
[Middleware]        ← Express 미들웨어와 동일. 로깅, CORS 등
    ↓
[Guard]             ← 인증/인가 체크. "이 요청을 처리해도 되는가?"
    ↓
[Interceptor] (전)  ← 요청 전처리. 로깅 시작, 캐시 확인 등
    ↓
[Pipe]              ← 데이터 변환 & 유효성 검사
    ↓
[Controller]        ← 라우트 핸들러 실행
    ↓
[Interceptor] (후)  ← 응답 후처리. 응답 변환, 로깅 완료 등
    ↓
[Exception Filter]  ← 에러 발생 시 처리. 에러 응답 포맷팅
    ↓
클라이언트 응답
```

### 각 단계별 역할과 사용 시점

**Middleware** — 가장 먼저 실행. Express 미들웨어와 동일
```typescript
// 예: 요청 로깅
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}
```

**Guard** — "이 요청을 허용할 것인가?" (true/false 반환)
```typescript
// 예: JWT 인증 확인
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization; // 토큰 있으면 통과
  }
}

// 사용
@UseGuards(AuthGuard)
@Get('profile')
getProfile() { ... }
```

**Interceptor** — 요청 전후에 로직 추가 (AOP 패턴)
```typescript
// 예: 응답 시간 측정
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`${Date.now() - start}ms`)),
    );
  }
}
```

**Pipe** — 데이터 변환 및 유효성 검사
```typescript
// 내장 Pipe 사용
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  // id가 자동으로 number로 변환됨
  // 변환 실패 시 400 에러 자동 반환
}
```

**Exception Filter** — 에러 응답 커스터마이징
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

> **프론트 비유**: React의 렌더링 파이프라인과 비슷하다.
> - Middleware = React Router의 loader
> - Guard = Route의 접근 권한 체크
> - Interceptor = React Query의 queryFn wrapper (요청 전후 처리)
> - Pipe = props 유효성 검사 (PropTypes/Zod)
> - Exception Filter = Error Boundary

---

## 핵심 요약

1. **Module**은 관련 기능을 캡슐화하고, `imports`/`exports`로 모듈 간 의존성을 관리한다
2. **DI**는 NestJS의 핵심 — `@Injectable()` + `providers` 등록 + constructor 주입
3. **데코레이터**로 라우팅, 파라미터 추출, 기능 적용을 선언적으로 처리한다
4. **요청 생명주기**를 이해하면 로직을 올바른 위치에 배치할 수 있다

> 다음 문서: [03-crud-patterns.md](./03-crud-patterns.md) — CRUD 베스트 프랙티스
