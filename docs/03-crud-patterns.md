# CRUD 베스트 프랙티스

## 1. DTO (Data Transfer Object) 패턴

DTO는 **클라이언트와 서버 사이에 주고받는 데이터의 형태를 정의**하는 클래스다.

> **프론트 비유**: TypeScript에서 API 응답 타입을 `interface`로 정의하는 것과 같다. 다만 NestJS의 DTO는 클래스(class)를 사용한다 — 런타임에 유효성 검사를 할 수 있기 때문이다.

### Create DTO

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Update DTO — PartialType 활용

```typescript
// dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// CreateUserDto의 모든 필드를 optional로 만든다
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

> `PartialType`은 TypeScript의 `Partial<T>`과 같은 역할이지만, class-validator 데코레이터도 함께 상속한다.

### 유효성 검사 활성화

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // DTO에 정의되지 않은 필드 자동 제거
    forbidNonWhitelisted: true,  // 정의되지 않은 필드가 오면 400 에러
    transform: true,        // 타입 자동 변환 (string → number 등)
  }));

  await app.listen(3000);
}
```

**필요한 패키지 설치**:
```bash
npm install class-validator class-transformer @nestjs/mapped-types
```

---

## 2. Entity vs DTO 분리

Entity는 **데이터베이스 테이블과 매핑되는 클래스**이고, DTO는 **API 요청/응답의 형태**다. 이 둘을 반드시 분리해야 한다.

### 왜 분리하는가?

```
[클라이언트] ←→ DTO ←→ [Service] ←→ Entity ←→ [Database]
```

- **보안**: Entity에는 password 같은 민감한 필드가 있다. DTO로 응답하면 필요한 필드만 내보낼 수 있다
- **유연성**: DB 스키마 변경이 API 응답에 직접 영향을 주지 않는다
- **유효성 검사**: 입력 DTO와 Entity의 검증 규칙이 다를 수 있다

### Entity 예시 (TypeORM)

```typescript
// entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;  // DB에는 있지만 API 응답에는 빠져야 함

  @CreateDateColumn()
  createdAt: Date;
}
```

### Prisma를 사용하는 경우

```typescript
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}

// Prisma는 Entity 클래스 대신 schema.prisma에서 모델을 정의한다.
// 타입은 자동 생성된다: import { User } from '@prisma/client'
```

---

## 3. Repository 패턴

Repository는 **데이터베이스 접근 로직을 캡슐화**한다. Service가 직접 DB를 다루지 않게 한다.

### TypeORM 방식

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}
```

### Prisma 방식

```typescript
// prisma.service.ts — 전역 Prisma 클라이언트
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

> **TypeORM vs Prisma**: 둘 다 널리 쓰인다. TypeORM은 데코레이터 기반으로 NestJS와 잘 어울리고, Prisma는 스키마 파일 기반으로 타입 안전성이 뛰어나다. 최근에는 Prisma가 더 인기 있는 추세다.

---

## 4. 에러 핸들링

### 기본 HttpException 사용

```typescript
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

@Injectable()
export class UsersService {
  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
      // → 404 { statusCode: 404, message: "User #1 not found" }
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already exists');
      // → 409 { statusCode: 409, message: "Email already exists" }
    }
    // ...
  }
}
```

### 주요 내장 Exception 클래스

| 클래스 | HTTP 코드 | 사용 시점 |
|---|---|---|
| `BadRequestException` | 400 | 잘못된 요청 데이터 |
| `UnauthorizedException` | 401 | 인증 필요 |
| `ForbiddenException` | 403 | 권한 없음 |
| `NotFoundException` | 404 | 리소스를 찾을 수 없음 |
| `ConflictException` | 409 | 중복 데이터 |
| `InternalServerErrorException` | 500 | 서버 내부 오류 |

> **프론트 비유**: API 호출 시 받는 HTTP 상태 코드를 서버에서 직접 던지는 것이다. 프론트에서 `if (res.status === 404)` 로 처리하던 그 코드를 서버가 의미있게 설정하는 부분.

---

## 5. 응답 직렬화 (Serialization)

Entity에서 특정 필드를 응답에서 제외하고 싶을 때 사용한다.

### class-transformer 활용

```typescript
// entities/user.entity.ts
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Exclude()           // ← API 응답에서 제외
  @Column()
  password: string;
}
```

```typescript
// Controller에서 ClassSerializerInterceptor 적용
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
    // password 필드가 자동으로 제거된 채 응답됨
  }
}
```

---

## 6. 전체 CRUD 흐름 요약

```
POST /users (body: { name, email, password })
    ↓
[ValidationPipe]        → CreateUserDto 유효성 검사
    ↓
[UsersController]       → create(dto) 호출
    ↓
[UsersService]          → 비즈니스 로직 (중복 체크 등)
    ↓
[Repository/Prisma]     → DB에 INSERT
    ↓
[Serialization]         → password 제거 후 응답
    ↓
201 Created { id: 1, name: "홍길동", email: "hong@email.com" }
```

> 다음 문서: [04-advanced-patterns.md](./04-advanced-patterns.md) — 실무에서 자주 쓰는 고급 패턴
