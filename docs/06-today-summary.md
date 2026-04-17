# 오늘 배운 것 총정리 (2026-04-10)

## Phase 1: CRUD 기본

---

### 1. 프로젝트 구조

```
src/
├── main.ts                          # 앱 진입점
├── app.module.ts                    # 루트 모듈
├── users/                           # 유저 CRUD 모듈
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/user.entity.ts
│   ├── dto/create-user.dto.ts
│   ├── dto/update-user.dto.ts
│   └── const/userRole.ts
└── auth/                            # 인증 모듈
    ├── auth.module.ts
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── guards/jwt-auth.guard.ts
    ├── decorators/current-user.decorator.ts
    └── dto/
        ├── register.dto.ts
        └── login.dto.ts
```

---

### 2. Entity — DB 테이블 정의

**역할**: 데이터베이스 테이블과 1:1 매핑되는 클래스. **TypeORM 데코레이터만** 사용한다.

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })      // DB 레벨 중복 방지
  email: string;

  @Exclude()                      // API 응답에서 제외
  @Column()
  password: string;

  @CreateDateColumn()             // 생성 시 자동 기록
  createdAt: Date;

  @Column({ default: '' })       // 기본값 설정
  profileImageUrl?: string;

  @Column({ default: UserRole.USER })
  role: UserRole;
}
```

#### Entity 데코레이터 정리

| 데코레이터 | 역할 | 예시 |
|---|---|---|
| `@Entity()` | 클래스를 DB 테이블로 매핑 | `@Entity()` |
| `@PrimaryGeneratedColumn()` | 자동 증가 PK | id: number |
| `@Column()` | 일반 컬럼 | name: string |
| `@Column({ unique: true })` | 유니크 제약 | email: string |
| `@Column({ default: 값 })` | 기본값 설정 | role: UserRole |
| `@CreateDateColumn()` | 생성 시간 자동 기록 | createdAt: Date |
| `@UpdateDateColumn()` | 수정 시간 자동 갱신 | updatedAt: Date |
| `@Exclude()` | API 응답에서 해당 필드 제외 (class-transformer) | password |

---

### 3. DTO — 입력 데이터 검증

**역할**: 클라이언트에서 **받는** 데이터의 형태를 정의하고 유효성 검사. **class-validator 데코레이터만** 사용한다.

#### Entity vs DTO 차이

```
Entity  → "DB에 어떻게 저장할 것인가" (테이블 구조)
DTO     → "클라이언트에서 온 데이터가 유효한가" (입력 검증)

[클라이언트] --DTO로 검증--> [서버] --Entity로 저장--> [DB]
```

#### CreateUserDto

```typescript
export class CreateUserDto {
  @IsString()       // 문자열인지 검사
  @IsNotEmpty()     // 빈 값인지 검사
  name: string;

  @IsEmail()        // 이메일 형식인지 검사
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

#### UpdateUserDto — PartialType 활용

```typescript
export class UpdateUserDto extends PartialType(CreateUserDto) {}
// CreateUserDto의 모든 필드가 optional로 변환
// class-validator 데코레이터도 함께 상속!
```

#### class-validator 데코레이터 정리

| 데코레이터 | 역할 |
|---|---|
| `@IsString()` | 문자열인지 검사 |
| `@IsNotEmpty()` | 빈 값이 아닌지 검사 |
| `@IsEmail()` | 이메일 형식인지 검사 |
| `@IsNumber()` | 숫자인지 검사 |
| `@IsEnum(enum)` | enum 값인지 검사 |
| `@MinLength(n)` | 최소 길이 검사 |

#### ValidationPipe 글로벌 설정 (main.ts)

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // DTO에 없는 필드 자동 제거
  forbidNonWhitelisted: true,   // DTO에 없는 필드 오면 400 에러
  transform: true,              // 타입 자동 변환 (string → number)
}));
```

| 옵션 | 역할 |
|---|---|
| `whitelist` | DTO에 정의되지 않은 필드 자동 제거 |
| `forbidNonWhitelisted` | 정의되지 않은 필드 들어오면 400 에러 |
| `transform` | 타입 자동 변환 (쿼리스트링 string → number 등) |

---

### 4. Module — 기능을 묶는 컨테이너

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],  // Entity 등록
  controllers: [UsersController],                // 컨트롤러 등록
  providers: [UsersService],                     // 서비스 등록
  exports: [UsersService],                       // 다른 모듈에 공개
})
export class UsersModule {}
```

#### Module 속성 정리

| 속성 | 역할 |
|---|---|
| `imports` | 다른 모듈 가져오기 (해당 모듈의 exports 사용 가능) |
| `controllers` | 이 모듈의 컨트롤러 등록 |
| `providers` | 이 모듈의 서비스(Provider) 등록 |
| `exports` | 다른 모듈에 공개할 서비스 |

#### 모듈 간 의존성

```
AuthModule에서 UsersService를 쓰고 싶다면?

1. UsersModule → exports: [UsersService]    ← 공개
2. AuthModule  → imports: [UsersModule]     ← 가져오기
```

---

### 5. Controller — HTTP 라우팅

```typescript
@UseInterceptors(ClassSerializerInterceptor)  // @Exclude() 동작
@UseGuards(JwtAuthGuard)                       // 전체 라우트 보호
@Controller('users')                           // /users prefix
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()                                       // GET /users
  getAllUsers() {}

  @Get(':id')                                  // GET /users/:id
  getUserById(@Param('id', ParseIntPipe) id: number) {}

  @Post()                                      // POST /users
  create(@Body() dto: CreateUserDto) {}

  @Patch(':id')                                // PATCH /users/:id
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {}

  @Delete(':id')                               // DELETE /users/:id
  delete(@Param('id', ParseIntPipe) id: number) {}
}
```

#### Controller 데코레이터 정리

| 데코레이터 | 위치 | 역할 |
|---|---|---|
| `@Controller('path')` | 클래스 | 라우트 prefix 설정 |
| `@Get()` | 메서드 | GET 요청 처리 |
| `@Post()` | 메서드 | POST 요청 처리 |
| `@Patch(':id')` | 메서드 | PATCH 요청 처리 |
| `@Delete(':id')` | 메서드 | DELETE 요청 처리 |
| `@Body()` | 파라미터 | 요청 body 추출 |
| `@Param('id')` | 파라미터 | URL 파라미터 추출 |
| `@Query('key')` | 파라미터 | 쿼리스트링 추출 |
| `@UseGuards()` | 클래스/메서드 | Guard 적용 |
| `@UseInterceptors()` | 클래스/메서드 | Interceptor 적용 |

#### Pipe — 파라미터 변환

| Pipe | 역할 |
|---|---|
| `ParseIntPipe` | string → number 변환 (실패 시 400) |
| `ParseUUIDPipe` | UUID 형식 검증 |
| `DefaultValuePipe(값)` | 기본값 설정 |

---

### 6. Service — 비즈니스 로직

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)                    // TypeORM Repository 주입
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`검색하신 유저 ${id}가 존재하지 않습니다.`);
    }
    return user;
  }

  create(dto: CreateUserDto) {
    const newUser = this.usersRepository.create(dto);  // Entity 인스턴스 생성
    return this.usersRepository.save(newUser);          // DB에 저장
  }

  async update(id: number, dto: UpdateUserDto) {
    const result = await this.usersRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException(`검색하신 유저 ${id}가 존재하지 않습니다.`);
    }
    return this.findOne(id);                            // 수정된 데이터 반환
  }

  async delete(id: number) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`검색하신 유저 ${id}가 존재하지 않습니다.`);
    }
    return result;
  }
}
```

#### Repository 메서드 정리

| 메서드 | 역할 | 반환 |
|---|---|---|
| `.find()` | 전체 조회 | Entity[] |
| `.findOneBy({ id })` | 조건으로 1개 조회 | Entity \| null |
| `.create(dto)` | Entity 인스턴스 생성 (DB 저장 X) | Entity |
| `.save(entity)` | DB에 저장 (INSERT/UPDATE) | Entity |
| `.update(id, dto)` | 조건으로 업데이트 | UpdateResult |
| `.delete(id)` | 조건으로 삭제 | DeleteResult |

#### 에러 핸들링 — 내장 HttpException

| 클래스 | HTTP 코드 | 사용 시점 |
|---|---|---|
| `BadRequestException` | 400 | 잘못된 요청 데이터 |
| `UnauthorizedException` | 401 | 인증 필요 |
| `NotFoundException` | 404 | 리소스를 찾을 수 없음 |
| `ConflictException` | 409 | 중복 데이터 |

---

## Phase 2: 인증 (JWT)

---

### 7. JWT 인증 흐름

```
[회원가입] POST /auth/register
  → 비밀번호 bcrypt 해싱 → DB 저장 → 토큰 2개 발급

[로그인] POST /auth/login
  → DB에서 유저 조회 → bcrypt.compare() → 토큰 2개 발급

[인증된 요청] GET /users (Authorization: Bearer <token>)
  → JwtAuthGuard가 토큰 검증 → 통과/거부

[토큰 재발급] POST /auth/refresh
  → refreshToken 검증 → 새 토큰 2개 발급
```

#### Access Token vs Refresh Token

| | Access Token | Refresh Token |
|---|---|---|
| 수명 | 짧음 (1시간) | 김 (7일) |
| 용도 | API 요청에 사용 | Access Token 재발급 |
| 만료 시 | Refresh Token으로 재발급 | 다시 로그인 |

---

### 8. AuthService — 인증 로직

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // 토큰 생성 (재사용 가능한 메서드로 분리)
  generateTokens(userId: number, email: string) {
    const payload = { userId, email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  // 회원가입
  async register(dto: RegisterDto) {
    // 1. 이메일 중복 체크
    // 2. 비밀번호 확인 검증
    // 3. bcrypt.hash(password, 10) — 비밀번호 해싱
    // 4. DB에 저장
    // 5. 토큰 발급
  }

  // 로그인
  async login(dto: LoginDto) {
    // 1. 이메일로 유저 조회 (없으면 에러)
    // 2. bcrypt.compare() — 비밀번호 검증 (틀리면 에러)
    // 3. 토큰 발급
  }

  // 토큰 재발급
  async refreshToken(refreshToken: string) {
    // try/catch로 jwtService.verifyAsync(token)
    // 성공 → 새 토큰 발급
    // 실패 → UnauthorizedException
  }
}
```

#### bcrypt 메서드 정리

| 메서드 | 역할 | 사용 시점 |
|---|---|---|
| `bcrypt.hash(password, 10)` | 비밀번호를 해시로 변환 | 회원가입 시 |
| `bcrypt.compare(input, hashed)` | 입력값과 해시 비교 | 로그인 시 |

> `10`은 salt rounds — 높을수록 안전하지만 느림. 10이 일반적.

#### JwtService 메서드 정리

| 메서드 | 역할 | 사용 시점 |
|---|---|---|
| `jwtService.sign(payload, options)` | 토큰 생성 (동기) | 토큰 발급 시 |
| `jwtService.signAsync(payload, options)` | 토큰 생성 (비동기) | 토큰 발급 시 |
| `jwtService.verify(token)` | 토큰 검증 (동기) | Guard, refresh |
| `jwtService.verifyAsync(token)` | 토큰 검증 (비동기) | Guard, refresh |

---

### 9. AuthModule — JWT 설정

```typescript
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({          // 비동기 등록 (ConfigService 사용)
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

#### register vs registerAsync

| 방식 | 언제 사용 |
|---|---|
| `JwtModule.register({})` | 값을 하드코딩할 때 |
| `JwtModule.registerAsync({})` | ConfigService 등 다른 Provider에서 값을 가져올 때 |

> `registerAsync`는 ConfigModule이 완전히 로드된 후에 실행되므로 환경변수를 안전하게 읽을 수 있다.

---

### 10. Guard — 라우트 보호 (문지기)

**역할**: "이 요청을 허용할 것인가?" — `true`면 통과, 에러면 거부

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. request 객체 가져오기
    const request = context.switchToHttp().getRequest();

    // 2. Authorization 헤더에서 토큰 추출
    //    "Bearer eyJhbG..." → "eyJhbG..."
    const token = request.headers.authorization?.split(' ')[1];

    // 3. 토큰 없으면 거부
    if (!token) throw new UnauthorizedException('No token provided');

    // 4. 토큰 검증
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;    // 유저 정보를 request에 저장
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
```

#### 적용 방법

```typescript
// 클래스 전체에 적용 — 모든 라우트 보호
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {}

// 특정 라우트만 적용
@UseGuards(JwtAuthGuard)
@Delete(':id')
delete() {}
```

---

### 11. Custom Decorator — @CurrentUser()

**역할**: Guard가 `request.user`에 저장한 유저 정보를 깔끔하게 꺼내는 데코레이터

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// 사용
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: { userId: number; email: string }) {
  return user;
}
```

---

### 12. 응답 직렬화 — @Exclude()

**역할**: Entity의 특정 필드를 API 응답에서 자동 제거

```typescript
// Entity에 @Exclude() 추가
@Exclude()
@Column()
password: string;

// Controller에 ClassSerializerInterceptor 적용
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {}

// 응답에서 password가 자동으로 빠짐
```

---

## 핵심 개념 요약

### DI (의존성 주입)

```
1. @Injectable() — 클래스를 "주입 가능"하게 표시
2. Module의 providers에 등록
3. constructor에서 타입으로 요청
4. NestJS가 자동으로 인스턴스 생성 + 주입
```

### 요청 생명주기

```
요청 → Middleware → Guard → Interceptor(전) → Pipe → Controller → Interceptor(후) → 응답
                     ↑                         ↑
               오늘 배운 것              ValidationPipe
```

### Entity vs DTO (가장 중요!)

```
Entity = DB 테이블 구조    → TypeORM 데코레이터 (@Column, @Entity)
DTO    = 입력 데이터 검증  → class-validator 데코레이터 (@IsString, @IsEmail)

절대 섞지 않는다!
```

---

## 설치한 패키지 정리

```bash
# TypeORM + PostgreSQL
npm install @nestjs/typeorm typeorm pg

# 환경변수 관리
npm install @nestjs/config

# 유효성 검사
npm install class-validator class-transformer

# DTO 유틸리티 (PartialType)
npm install @nestjs/mapped-types

# JWT 인증
npm install @nestjs/jwt

# 비밀번호 해싱
npm install bcrypt
npm install -D @types/bcrypt
```

---

## 다음 학습 (Phase 3)

```
Phase 3: 실무 패턴
├── Swagger API 문서화        ← API 문서 자동 생성
├── Exception Filter          ← 에러 응답 포맷 통일
├── Interceptor               ← 응답 포맷 통일
└── 테스트 (Unit, E2E)        ← 코드 품질 보장
```
