# NestJS CRUD 구현 플로우 가이드

> 이 프로젝트(sns)의 실제 코드 패턴을 기반으로 작성한 단계별 구현 가이드입니다.
> **Entity → DTO → Service → Controller → Module** 순서로 구현하세요.

---

## Phase 1: Entity 작성

### 1-1. 기본 구조
```ts
import { IsString } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseModel } from '../../common/entity/base.entity';

@Entity()
export class XxxModel extends BaseModel {
  // 관계 설정
  @ManyToOne(() => UserModel, (user) => user.xxxList)
  author: UserModel;

  // 컬럼 정의
  @Column()
  @IsString()
  title: string;

  // 기본값 있는 컬럼
  @Column({ default: 0 })
  likeCount: number;
}
```

### 1-2. 관계 패턴 정리
| 관계 | 데코레이터 | 예시 |
|------|-----------|------|
| 하나의 User가 여러 Post | `@OneToMany` (User쪽) + `@ManyToOne` (Post쪽) | User → Post |
| 여러 User가 여러 Chat | `@ManyToMany` + `@JoinTable` | User ↔ Chat |

### 1-3. 주의사항
- **반드시 `BaseModel`을 상속** → id, createdAt, updatedAt 자동 제공
- `@IsString()`, `@IsEmail()` 등 검증 데코레이터를 Entity에 같이 작성 → DTO에서 재사용됨
- 기본값은 `@Column({ default: 0 })`으로 설정 → Service에서 하드코딩 불필요
- **app.module.ts의 `entities` 배열에 추가** 필수

---

## Phase 2: DTO 작성

### 2-1. CreateDto (PickType 활용)
```ts
import { PickType } from '@nestjs/mapped-types';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { XxxModel } from '../entities/xxx.entity';

export class CreateXxxDto extends PickType(XxxModel, ['title', 'content']) {
  // Entity에 없는 추가 필드
  @IsNumber()
  @IsNotEmpty()
  postId: number;
}
```

### 2-2. UpdateDto (PartialType 활용)
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateXxxDto } from './create-xxx.dto';

export class UpdateXxxDto extends PartialType(CreateXxxDto) {}
```

### 2-3. PaginationDto (BasePaginationDto 상속)
```ts
import { IsString, IsOptional } from 'class-validator';
import { BasePaginationDto } from '../../common/dto/base-pagination.dto';

export class PaginateXxxDto extends BasePaginationDto {
  @IsString()
  @IsOptional()
  where__title__i_like?: string;  // LIKE 검색
}
```

### 2-4. DTO 선택 기준
| 상황 | 사용할 것 |
|------|----------|
| 생성 요청 | `PickType` |
| 수정 요청 | `PartialType` |
| 목록 조회 | `BasePaginationDto` 상속 |
| userId는 DTO에 넣지 말 것 | `@User('id')` 데코레이터 사용 |

---

## Phase 3: Service 작성

### 3-1. 기본 구조
```ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from '../../common/common.service';

@Injectable()
export class XxxService {
  constructor(
    @InjectRepository(XxxModel)
    private readonly xxxRepository: Repository<XxxModel>,
    private readonly commonService: CommonService,
  ) {}
}
```

### 3-2. CRUD 메서드 패턴

**READ - 단건 조회**
```ts
async getXxxById(id: number) {
  const item = await this.xxxRepository.findOne({
    where: { id },
    relations: { author: true },  // 관계 로드 필요 시
  });

  if (!item) {
    throw new NotFoundException('찾을 수 없습니다.');
  }

  return item;
}
```

**READ - 목록 조회 (페이지네이션)**
```ts
async paginateXxx(dto: BasePaginationDto, parentId?: number) {
  return this.commonService.paginate(
    dto,
    this.xxxRepository,
    {
      where: { parent: { id: parentId } },  // 필터 조건
    },
    'xxx',  // 다음 페이지 URL 경로
  );
}
```

**CREATE**
```ts
async createXxx(userId: number, dto: CreateXxxDto) {
  return this.xxxRepository.save({
    author: { id: userId },
    ...dto,
  });
}
```

**UPDATE - 본인 확인 포함**
```ts
async updateXxx(userId: number, id: number, dto: UpdateXxxDto) {
  const item = await this.getXxxById(id);

  // 권한 검증 (relations에 author 포함해야 함)
  if (item.author.id !== userId) {
    throw new ForbiddenException('작성자만 수정할 수 있습니다.');
  }

  return this.xxxRepository.save({
    ...item,
    ...dto,
  });
}
```

**DELETE**
```ts
async deleteXxx(userId: number, id: number) {
  const item = await this.getXxxById(id);

  if (item.author.id !== userId) {
    throw new ForbiddenException('작성자만 삭제할 수 있습니다.');
  }

  await this.xxxRepository.delete(id);
  return { success: true, message: `${id}번 항목이 삭제되었습니다.` };
}
```

### 3-3. 에러 처리 정리
| 상황 | 사용할 Exception |
|------|----------------|
| 데이터 없음 | `NotFoundException` |
| 권한 없음 (본인 아님) | `ForbiddenException` |
| 잘못된 요청 | `BadRequestException` |
| 인증 실패 | `UnauthorizedException` |

---

## Phase 4: Controller 작성

### 4-1. 기본 구조
```ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { User } from '../../users/decorator/user.decorator';

@Controller('posts/:postId/xxx')  // 중첩 라우팅 예시
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}
}
```

### 4-2. CRUD 엔드포인트 패턴

```ts
// 목록 조회 (인증 불필요)
@Get()
getXxxList(
  @Query() dto: PaginateXxxDto,
  @Param('postId', ParseIntPipe) postId: number,
) {
  return this.xxxService.paginateXxx(dto, postId);
}

// 단건 조회
@Get(':id')
getXxxById(@Param('id', ParseIntPipe) id: number) {
  return this.xxxService.getXxxById(id);
}

// 생성 (인증 필요)
@Post()
@UseGuards(AccessTokenGuard)
createXxx(
  @User('id') userId: number,
  @Body() body: CreateXxxDto,
) {
  return this.xxxService.createXxx(userId, body);
}

// 수정 (인증 필요)
@Patch(':id')
@UseGuards(AccessTokenGuard)
updateXxx(
  @User('id') userId: number,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateXxxDto,
) {
  return this.xxxService.updateXxx(userId, id, body);
}

// 삭제 (인증 필요)
@Delete(':id')
@UseGuards(AccessTokenGuard)
deleteXxx(
  @User('id') userId: number,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.xxxService.deleteXxx(userId, id);
}
```

### 4-3. 자주 쓰는 데코레이터 정리
| 데코레이터 | 역할 |
|-----------|------|
| `@UseGuards(AccessTokenGuard)` | JWT 인증 필수 |
| `@User('id')` | 현재 로그인 유저 ID |
| `@Param('id', ParseIntPipe)` | URL 파라미터 → number 변환 |
| `@Query()` | Query String |
| `@Body()` | Request Body |
| `@IsPublic()` | 인증 없이 접근 가능 (전역 Guard 무시) |

---

## Phase 5: Module 연결

### 5-1. 새 모듈 기본 구조
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { CommonModule } from '../../common/common.module';
import { XxxController } from './xxx.controller';
import { XxxService } from './xxx.service';
import { XxxModel } from './entities/xxx.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([XxxModel]),  // 이 모듈에서 쓸 Entity 등록
    CommonModule,    // CommonService (페이지네이션) 사용 시
    AuthModule,      // AccessTokenGuard 사용 시
    // PostsModule,  // PostsService 사용 시 (PostsModule에서 export 필요)
  ],
  controllers: [XxxController],
  providers: [XxxService],
  exports: [XxxService],  // 다른 모듈에서 XxxService 사용 시
})
export class XxxModule {}
```

### 5-2. app.module.ts 업데이트 체크리스트
```ts
// 1. Entity import 추가
import { XxxModel } from './xxx/entities/xxx.entity';

// 2. entities 배열에 추가
entities: [PostModel, UserModel, ..., XxxModel],

// 3. Module import 추가
imports: [..., XxxModule],
```

### 5-3. 다른 모듈의 Service 사용 시
```ts
// 사용하려는 서비스의 모듈 (예: PostsModule)
@Module({
  exports: [PostsService],  // ← export 필수
})
export class PostsModule {}

// 내 모듈
@Module({
  imports: [PostsModule],   // ← import 필수
})
export class XxxModule {}
```

---

## 체크리스트

새 기능 구현 시 순서대로 체크하세요.

### Entity
- [ ] `BaseModel` 상속
- [ ] `@Entity()` 데코레이터
- [ ] 컬럼에 `@IsString()` 등 검증 데코레이터 추가
- [ ] 관계 설정 (`@ManyToOne`, `@OneToMany` 등)
- [ ] 기본값 있는 컬럼은 `{ default: 0 }` 설정

### DTO
- [ ] Create: `PickType` 활용
- [ ] Update: `PartialType` 활용
- [ ] userId는 DTO에 넣지 않음 (`@User('id')` 사용)

### Service
- [ ] `@InjectRepository(XxxModel)` 주입
- [ ] 필요한 Service 주입 (CommonService 등)
- [ ] 단건 조회 시 `relations` 옵션 확인
- [ ] 수정/삭제 시 `author.id !== userId` 권한 검증

### Controller
- [ ] `@UseGuards(AccessTokenGuard)` 생성/수정/삭제에 적용
- [ ] `@Param`에 `ParseIntPipe` 적용
- [ ] 목록 조회에 `@Query()` 적용

### Module
- [ ] `TypeOrmModule.forFeature([XxxModel])` 추가
- [ ] 필요한 모듈 import (CommonModule, AuthModule 등)
- [ ] `app.module.ts`의 `entities` 배열에 추가
- [ ] `app.module.ts`의 `imports`에 XxxModule 추가

---

## 자주 발생하는 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| `UnknownDependenciesException` | 모듈에 필요한 import 누락 | Module의 `imports`에 해당 Module 추가 |
| `Entity metadata not found` | app.module.ts entities 누락 | `entities` 배열에 Entity 추가 |
| `Data type Array not supported` | Entity 필드 타입 오류 | `string[]` → `string` 수정 |
| `jwt malformed` | 토큰 형식 오류 | `Bearer <토큰>` 형식 확인 |
| `Access 토큰이 아닙니다` | Refresh 토큰을 사용함 | `accessToken` 값 사용 |
| `author.id` 접근 불가 | relations 누락 | `findOne`에 `relations: { author: true }` 추가 |
