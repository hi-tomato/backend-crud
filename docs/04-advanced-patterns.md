# 실무에서 자주 쓰는 NestJS 패턴

## 1. Config Module — 환경변수 관리

하드코딩된 값 대신 환경변수를 체계적으로 관리하는 패턴이다.

```bash
npm install @nestjs/config
```

### 기본 설정

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // 모든 모듈에서 사용 가능
      envFilePath: '.env',   // .env 파일 경로
    }),
  ],
})
export class AppModule {}
```

### 사용법

```typescript
// .env
DATABASE_URL=postgresql://localhost:5432/mydb
JWT_SECRET=my-secret-key

// 서비스에서 사용
@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  getJwtSecret() {
    return this.configService.get<string>('JWT_SECRET');
  }
}
```

### 환경변수 유효성 검사 (추천)

```typescript
// env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig);
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validate,  // 앱 시작 시 환경변수 검증
})
```

> **프론트 비유**: Vite의 `import.meta.env`나 Next.js의 `process.env`와 같은 역할이지만, 타입 안전성과 유효성 검사가 내장되어 있다.

---

## 2. Custom Decorator — 커스텀 데코레이터

반복되는 로직을 데코레이터로 추출하는 패턴이다.

### 현재 로그인 유저 가져오기

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Guard에서 설정한 user 객체
  },
);

// 사용
@Get('profile')
@UseGuards(AuthGuard)
getProfile(@CurrentUser() user: User) {
  // request.user 대신 깔끔하게 사용
  return user;
}
```

### 여러 데코레이터 합치기

```typescript
// common/decorators/auth.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth(...roles: string[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
  );
}

// 사용: 데코레이터 3개를 1개로 줄임
@Auth('admin')
@Delete(':id')
remove(@Param('id') id: string) { ... }
```

> **프론트 비유**: React에서 여러 HOC를 합쳐서 하나의 HOC로 만드는 `compose` 패턴과 같다.

---

## 3. Guard — 인증/인가

Guard는 **"이 요청을 처리해도 되는가?"** 를 판단한다. `true`를 반환하면 통과, `false`면 403 에러.

### JWT 인증 Guard

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
```

```typescript
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // 요청 객체에 유저 정보 저장
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 역할 기반 인가 (Role-based)

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true; // 역할 지정이 없으면 통과

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// 사용
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
remove(@Param('id') id: string) { ... }
```

> **프론트 비유**: React Router의 `ProtectedRoute` 컴포넌트와 같다. 로그인하지 않으면 리다이렉트하는 것처럼, Guard는 권한이 없으면 요청을 거부한다.

---

## 4. Interceptor — 요청 전후 처리

Interceptor는 **요청 전후에 공통 로직을 끼워넣는** 패턴이다 (AOP).

### 응답 포맷 통일

```typescript
// common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// 적용 전: { id: 1, name: "홍길동" }
// 적용 후: { success: true, data: { id: 1, name: "홍길동" }, timestamp: "..." }
```

### 로깅 Interceptor

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} — ${ms}ms`);
      }),
    );
  }
}
```

### 글로벌 적용

```typescript
// main.ts
app.useGlobalInterceptors(new TransformInterceptor());
```

---

## 5. Pipe — 데이터 변환과 유효성 검사

### 내장 Pipe 활용

```typescript
import { ParseIntPipe, ParseUUIDPipe, DefaultValuePipe } from '@nestjs/common';

@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  // "abc" 입력 시 → 400 Bad Request 자동 반환
}

@Get()
findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {
  // GET /users → page=1, limit=10 (기본값)
  // GET /users?page=2&limit=20 → page=2, limit=20
}
```

### 커스텀 Pipe

```typescript
// common/pipes/parse-optional-int.pipe.ts
@Injectable()
export class ParseOptionalIntPipe implements PipeTransform {
  transform(value: string | undefined): number | undefined {
    if (value === undefined || value === '') return undefined;
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException(`"${value}" is not a valid integer`);
    }
    return val;
  }
}
```

---

## 6. Event-driven 패턴

모듈 간 결합도를 낮추기 위해 이벤트를 사용하는 패턴이다.

```bash
npm install @nestjs/event-emitter
```

```typescript
// app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
})
export class AppModule {}
```

```typescript
// users.service.ts — 이벤트 발행
@Injectable()
export class UsersService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async create(dto: CreateUserDto) {
    const user = await this.usersRepository.save(dto);

    // 유저 생성 이벤트 발행
    this.eventEmitter.emit('user.created', { userId: user.id, email: user.email });

    return user;
  }
}

// notifications.service.ts — 이벤트 구독
@Injectable()
export class NotificationsService {
  @OnEvent('user.created')
  handleUserCreated(payload: { userId: number; email: string }) {
    // 환영 이메일 발송 등
    console.log(`Welcome email sent to ${payload.email}`);
  }
}
```

> **프론트 비유**: Redux의 dispatch/subscribe 또는 EventEmitter 패턴과 동일하다. 한 모듈이 다른 모듈을 직접 호출하는 대신, 이벤트를 발행하면 관심 있는 모듈이 구독해서 처리한다.

---

## 7. 패턴 선택 가이드

| 상황 | 사용할 패턴 |
|---|---|
| 모든 요청에 로깅이 필요 | Middleware 또는 Interceptor |
| 인증된 사용자만 접근 | Guard |
| 요청 데이터 검증 | Pipe + DTO + class-validator |
| 응답 포맷 통일 | Interceptor |
| 에러 응답 커스터마이징 | Exception Filter |
| 모듈 간 느슨한 연결 | Event Emitter |
| 환경변수 관리 | ConfigModule |
| 반복되는 데코레이터 조합 | Custom Decorator (applyDecorators) |

> 다음 문서: [05-recommended-resources.md](./05-recommended-resources.md) — 추천 오픈소스 & 학습 자료
