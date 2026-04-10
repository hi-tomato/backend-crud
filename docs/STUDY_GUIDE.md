# NestJS SNS 프로젝트 - 단계별 학습 가이드

> 이 가이드는 현재 SNS 프로젝트를 확장하면서 NestJS의 핵심 개념을 하나씩 익히는 실습형 커리큘럼입니다.
> 각 Step은 **개념 설명 -> 실습 -> 확인** 순서로 진행됩니다.

---

## 사전 준비

```bash
# 프로젝트 실행
yarn start:dev

# Docker로 PostgreSQL 실행 (docker-compose.yaml 이미 있음)
docker-compose up -d
```

서버가 `http://localhost:3000`에서 실행되는지 확인하세요.
API 테스트는 **Postman**, **Insomnia**, 또는 터미널의 `curl`을 사용합니다.

---

## Step 1: NestJS의 기본 구조 이해하기

### 개념
NestJS는 3가지 핵심 구성요소로 이루어져 있습니다:

| 구성요소 | 역할 | 비유 |
|---------|------|------|
| **Module** | 관련 기능을 묶는 컨테이너 | 부서 |
| **Controller** | HTTP 요청을 받아 처리 | 안내 데스크 |
| **Service** | 실제 비즈니스 로직 | 실무 담당자 |

```
요청 -> Controller (라우팅) -> Service (로직) -> 응답
```

### 실습: 현재 코드 읽어보기

아래 파일들을 순서대로 열어보고, 각각의 역할을 이해하세요:

1. **`src/main.ts`** - 앱의 시작점. `NestFactory.create()`로 앱을 생성합니다.
2. **`src/app.module.ts`** - 루트 모듈. 모든 모듈이 여기에 등록됩니다.
3. **`src/posts/posts.module.ts`** - Posts 기능 모듈.
4. **`src/posts/posts.controller.ts`** - Posts API 엔드포인트 정의.
5. **`src/posts/posts.service.ts`** - Posts 비즈니스 로직.

### 확인 문제
- [ ] `@Module()` 데코레이터 안의 `imports`, `controllers`, `providers`는 각각 무엇을 등록하나요?
- [ ] `@Controller('posts')`에서 `'posts'`는 어떤 역할을 하나요?
- [ ] Service를 Controller에서 어떻게 사용하고 있나요? (힌트: 생성자)

---

## Step 2: 새로운 엔드포인트 직접 만들어보기

### 개념: HTTP 메서드 데코레이터
```typescript
@Get()      // GET 요청
@Post()     // POST 요청
@Put()      // PUT 요청
@Patch()    // PATCH 요청 (부분 수정)
@Delete()   // DELETE 요청
```

### 실습: AppController에 간단한 엔드포인트 추가하기

`src/app.controller.ts`를 열어서 아래 엔드포인트들을 직접 만들어보세요:

```typescript
// 목표 1: GET /post/health -> { status: 'ok', timestamp: 현재시간 } 반환
// 목표 2: GET /post/about -> { name: 'SNS API', version: '1.0.0' } 반환
```

**힌트:**
```typescript
@Get('health')
getHealth() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### 확인
```bash
curl http://localhost:3000/post/health
curl http://localhost:3000/post/about
```
- [ ] 두 엔드포인트 모두 정상 응답하는지 확인

---

## Step 3: DTO (Data Transfer Object) 만들기

### 개념
DTO는 데이터의 형태를 정의하는 클래스입니다. "이 API에는 이런 데이터를 보내야 해"라는 계약서 같은 역할입니다.

### 실습: Posts용 DTO 만들기

1. `src/posts/dto/` 폴더를 만드세요.
2. 아래 파일들을 생성하세요:

**`src/posts/dto/create-post.dto.ts`**
```typescript
export class CreatePostDto {
  author: string;
  title: string;
  content: string;
}
```

**`src/posts/dto/update-post.dto.ts`**
```typescript
// PartialType을 사용하면 모든 필드가 optional이 됩니다
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
```

3. `posts.controller.ts`에서 DTO를 사용하도록 수정하세요:

```typescript
// Before
@Post()
postPost(@Body('author') author: string, @Body('title') title: string, ...) { }

// After
@Post()
postPost(@Body() createPostDto: CreatePostDto) {
  return this.postsService.createPost(createPostDto);
}
```

4. `posts.service.ts`도 DTO를 받도록 수정하세요.

### 확인
- [ ] `POST /posts`에 `{ "author": "test", "title": "hello", "content": "world" }` 보내서 정상 동작 확인
- [ ] `PUT /posts/:id`에 `{ "title": "updated" }`만 보내서 부분 수정 동작 확인

---

## Step 4: Pipe로 유효성 검사 추가하기

### 개념
Pipe는 요청 데이터를 **변환**하거나 **검증**하는 역할을 합니다.

```
요청 데이터 -> Pipe (검증/변환) -> Controller
```

### 실습: class-validator로 DTO 검증하기

1. 패키지 설치:
```bash
yarn add class-validator class-transformer
```

2. `main.ts`에 글로벌 파이프 추가:
```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());  // 이 줄 추가
  await app.listen(process.env.PORT ?? 3000);
}
```

3. DTO에 검증 데코레이터 추가:
```typescript
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @Length(1, 100)       // 최소 1자, 최대 100자
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
```

### 확인
```bash
# 빈 body로 요청 -> 에러 메시지 확인
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{}'

# title 없이 요청 -> 에러 메시지 확인
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"author": "test", "content": "hello"}'
```
- [ ] 유효하지 않은 데이터를 보냈을 때 400 에러와 상세 메시지가 오는지 확인
- [ ] 유효한 데이터를 보냈을 때 정상 생성되는지 확인

---

## Step 5: Users 모듈 만들기 (새 리소스 생성)

### 개념
NestJS CLI로 새로운 리소스를 한번에 만들 수 있습니다.

### 실습: Users CRUD 자동 생성

```bash
# NestJS CLI로 리소스 생성
npx nest generate resource users
# 선택: REST API -> Yes (CRUD)
```

이 명령어 하나로 아래 파일들이 자동 생성됩니다:
- `users.module.ts`
- `users.controller.ts`
- `users.service.ts`
- `dto/create-user.dto.ts`
- `dto/update-user.dto.ts`
- `entities/user.entity.ts`

### 다음 할 일

1. **User Entity 정의하기:**
```typescript
// src/users/entities/user.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

2. **UsersModule에 TypeORM 등록:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

3. **AppModule에 UsersModule과 User Entity 추가:**
```typescript
// app.module.ts의 entities 배열에 User 추가
// imports 배열에 UsersModule 추가
```

4. **UsersService에 CRUD 로직 구현:**
   - `create(createUserDto)` - 회원가입
   - `findAll()` - 전체 유저 조회
   - `findOne(id)` - 유저 상세 조회
   - `update(id, updateUserDto)` - 유저 정보 수정
   - `remove(id)` - 유저 삭제

### 확인
```bash
# 유저 생성
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "nickname": "tester", "password": "1234"}'

# 전체 유저 조회
curl http://localhost:3000/users
```
- [ ] 유저 CRUD 5개 엔드포인트 모두 동작하는지 확인
- [ ] DB에 유저 데이터가 저장되는지 확인

---

## Step 6: Entity 관계 설정하기 (Post <-> User)

### 개념
TypeORM의 관계 데코레이터:
- `@OneToMany` / `@ManyToOne` - 1:N 관계 (유저 한 명이 여러 게시글)
- `@OneToOne` - 1:1 관계
- `@ManyToMany` - N:M 관계

### 실습: User와 Post 연결하기

1. **Post Entity에 작성자 관계 추가:**
```typescript
// post.entity.ts
@ManyToOne(() => User, (user) => user.posts)
author: User;
```

2. **User Entity에 게시글 관계 추가:**
```typescript
// user.entity.ts
@OneToMany(() => Post, (post) => post.author)
posts: Post[];
```

3. **Post 생성 시 작성자 연결:**
```typescript
// posts.service.ts
async createPost(userId: number, createPostDto: CreatePostDto) {
  const post = this.postRepository.create({
    ...createPostDto,
    author: { id: userId },
  });
  return this.postRepository.save(post);
}
```

4. **Post 조회 시 작성자 정보 포함:**
```typescript
async getPosts() {
  return this.postRepository.find({
    relations: ['author'],
  });
}
```

### 확인
- [ ] Post 조회 시 author 정보가 함께 오는지 확인
- [ ] User 조회 시 posts 목록이 함께 오는지 확인

---

## Step 7: Guard로 인증 구현하기 (기초)

### 개념
Guard는 요청이 Controller에 도달하기 전에 **"이 사람이 접근해도 되는가?"**를 판단합니다.

```
요청 -> Guard (인증/인가 확인) -> Controller
```

### 실습: 간단한 토큰 기반 인증 Guard

> 실제 프로덕션에서는 JWT를 사용하지만, 학습을 위해 간단한 방식으로 시작합니다.

1. **Guard 파일 생성:**

```typescript
// src/auth/basic-token.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BasicTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const rawToken = request.headers['authorization'];

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다');
    }

    // Basic base64encodedString 형태에서 디코딩
    const token = rawToken.split(' ')[1];  // 'Basic xxxx' -> 'xxxx'
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');

    // 여기서 실제로는 DB에서 유저를 찾아 비밀번호를 확인해야 합니다
    // 지금은 구조만 이해하기 위한 예시입니다
    if (!email || !password) {
      throw new UnauthorizedException('잘못된 토큰입니다');
    }

    // request에 유저 정보를 담아서 Controller에서 사용할 수 있게 함
    request.user = { email, password };
    return true;
  }
}
```

2. **Controller에 Guard 적용:**
```typescript
import { UseGuards } from '@nestjs/common';

@Post()
@UseGuards(BasicTokenGuard)
postPost(@Body() createPostDto: CreatePostDto) {
  // ...
}
```

### 확인
```bash
# 토큰 없이 요청 -> 401 에러
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "test", "content": "hello"}'

# Basic 토큰으로 요청 (test@test.com:1234 를 base64 인코딩)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic dGVzdEB0ZXN0LmNvbToxMjM0" \
  -d '{"title": "test", "content": "hello"}'
```
- [ ] 토큰 없이 요청하면 401 에러가 오는지 확인
- [ ] 토큰과 함께 요청하면 정상 동작하는지 확인

---

## Step 8: Middleware와 Interceptor

### 개념: 요청의 생명주기

```
요청 -> Middleware -> Guard -> Interceptor(전) -> Pipe -> Controller -> Interceptor(후) -> 응답
```

### 실습 A: 로깅 Middleware 만들기

```typescript
// src/common/middleware/log.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${res.statusCode} - ${duration}ms`);
    });

    next();
  }
}
```

**AppModule에 Middleware 등록:**
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LogMiddleware)
      .forRoutes('*');  // 모든 라우트에 적용
  }
}
```

### 실습 B: 응답 변환 Interceptor 만들기

```typescript
// src/common/interceptor/response-transform.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 확인
- [ ] 서버 콘솔에 `GET /posts 200 - 15ms` 같은 로그가 찍히는지 확인
- [ ] API 응답이 `{ success: true, data: [...], timestamp: "..." }` 형태로 감싸지는지 확인

---

## Step 9: Exception Filter 만들기

### 개념
Exception Filter는 에러가 발생했을 때 **응답 형태를 통일**해주는 역할입니다.

### 실습: 커스텀 에러 응답 만들기

```typescript
// src/common/filter/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('Exception');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      success: false,
      statusCode: status,
      message: exception.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`${request.method} ${request.url} ${status} - ${exception.message}`);

    response.status(status).json(errorResponse);
  }
}
```

**main.ts에 글로벌 등록:**
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

### 확인
```bash
# 존재하지 않는 게시글 조회
curl http://localhost:3000/posts/99999
```
- [ ] 에러 응답이 `{ success: false, statusCode: 404, message: "...", path: "...", timestamp: "..." }` 형태인지 확인

---

## Step 10: Pagination (페이지네이션) 구현하기

### 개념
게시글이 많아지면 한번에 다 보내면 안 되겠죠? 페이지 단위로 나눠서 보내는 것이 페이지네이션입니다.

### 실습: 커서 기반 페이지네이션

1. **페이지네이션 DTO 만들기:**
```typescript
// src/posts/dto/paginate-post.dto.ts
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginatePostDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)  // Query string은 문자열이므로 숫자로 변환
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
```

2. **Service에 페이지네이션 로직 추가:**
```typescript
async getPosts(dto: PaginatePostDto) {
  const { page, limit } = dto;

  const [posts, total] = await this.postRepository.findAndCount({
    order: { id: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: posts,
    total,
    page,
    lastPage: Math.ceil(total / limit),
  };
}
```

3. **Controller 수정:**
```typescript
@Get()
getPosts(@Query() paginatePostDto: PaginatePostDto) {
  return this.postsService.getPosts(paginatePostDto);
}
```

### 확인
```bash
curl "http://localhost:3000/posts?page=1&limit=5"
curl "http://localhost:3000/posts?page=2&limit=5"
```
- [ ] `data`, `total`, `page`, `lastPage` 필드가 응답에 포함되는지 확인
- [ ] page를 바꾸면 다른 데이터가 오는지 확인

---

## Step 11: 댓글(Comments) 기능 추가하기

### 개념
지금까지 배운 것들을 종합해서 새로운 기능을 직접 구현해봅니다.

### 실습: 혼자서 만들어보기

아래 요구사항을 보고 직접 구현해보세요:

1. **Comment Entity:**
   - `id` (자동 생성)
   - `content` (댓글 내용)
   - `author` (User와 ManyToOne 관계)
   - `post` (Post와 ManyToOne 관계)
   - `createdAt` (생성일)

2. **API 엔드포인트:**
   - `POST /posts/:postId/comments` - 댓글 작성
   - `GET /posts/:postId/comments` - 특정 게시글의 댓글 목록
   - `PATCH /comments/:id` - 댓글 수정
   - `DELETE /comments/:id` - 댓글 삭제

3. **체크리스트:**
   - [ ] `nest generate resource comments` 로 리소스 생성
   - [ ] Comment Entity 정의 및 관계 설정
   - [ ] CreateCommentDto + 유효성 검사
   - [ ] CommentsService에 CRUD 로직 구현
   - [ ] CommentsController에 엔드포인트 구현
   - [ ] Post 조회 시 댓글 수(commentCount) 반영

> **막힐 때:** Step 5~6를 다시 참고하세요. 같은 패턴입니다!

---

## Step 12: 환경 변수 관리하기 (ConfigModule)

### 개념
DB 비밀번호 같은 민감한 정보를 코드에 직접 쓰면 안 됩니다. 환경 변수로 분리합니다.

### 실습

1. **패키지 설치:**
```bash
yarn add @nestjs/config
```

2. **`.env` 파일 생성** (프로젝트 루트):
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=postgres
```

3. **AppModule에 ConfigModule 추가:**
```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    // ...
  ],
})
```

4. **`.gitignore`에 `.env` 추가하는 것 잊지 마세요!**

### 확인
- [ ] `.env` 파일의 값을 바꿔도 앱이 정상 동작하는지 확인
- [ ] 코드에 하드코딩된 DB 정보가 없는지 확인

---

## 학습 로드맵 요약

```
Step 1-2:   기본 구조 이해 + 엔드포인트 만들기      (기초)
Step 3-4:   DTO + 유효성 검사                       (데이터 관리)
Step 5-6:   새 리소스 + Entity 관계                  (DB 연동)
Step 7:     Guard로 인증                            (보안)
Step 8-9:   Middleware, Interceptor, Filter          (요청 생명주기)
Step 10:    페이지네이션                             (실전 기능)
Step 11:    댓글 기능 (종합 실습)                     (복습)
Step 12:    환경 변수 관리                           (운영)
```

## 추천 학습 팁

1. **각 Step을 별도 브랜치에서 작업하세요:**
   ```bash
   git checkout -b step-3-dto
   ```

2. **모르는 데코레이터가 나오면 위에 마우스를 올려 타입 정의를 확인하세요.**

3. **에러가 나면 터미널 로그를 먼저 읽으세요.** NestJS 에러 메시지는 대체로 친절합니다.

4. **한 Step을 완료하면 반드시 Postman/curl로 직접 테스트하세요.** 눈으로만 보는 것과 직접 해보는 것은 다릅니다.

5. **막히면 나한테 물어보세요!** 각 Step에서 도움이 필요하면 언제든 질문하세요.
