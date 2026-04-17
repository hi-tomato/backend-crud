# Pagination 구현 가이드

> NestJS + TypeORM 환경에서 페이지네이션을 직접 구현하며 학습하기 위한 가이드입니다.
> 코드 힌트와 설명 위주로 작성되었습니다. 코드는 직접 작성해보세요.

## 목차

1. [페이지네이션이 왜 필요한가?](#1-페이지네이션이-왜-필요한가)
2. [두 가지 방식 비교](#2-두-가지-방식-비교)
3. [공통 응답 구조 설계](#3-공통-응답-구조-설계)
4. [Offset 기반 페이지네이션](#4-offset-기반-페이지네이션)
5. [Cursor 기반 페이지네이션](#5-cursor-기반-페이지네이션)
6. [컨트롤러 연결 시 주의사항](#6-컨트롤러-연결-시-주의사항)
7. [자주 하는 실수](#7-자주-하는-실수)
8. [실습 체크리스트](#8-실습-체크리스트)

---

## 1. 페이지네이션이 왜 필요한가?

게시글이 10만 개 있을 때 `find()`로 전부 가져오면 어떻게 될까요?

- 서버 메모리 과부하
- 응답 속도 급락
- 클라이언트 렌더링 불가

페이지네이션은 **"필요한 만큼만 잘라서 보내는"** 기법입니다.

> 💡 힌트: TypeORM의 `find()`에는 `take`(LIMIT)와 `skip`(OFFSET) 옵션이 있습니다.

---

## 2. 두 가지 방식 비교

### Offset 방식 (페이지 번호)

전체 데이터에서 "몇 번째부터 몇 개"를 가져올지 숫자로 지정합니다.

```
전체: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

page=1, limit=4 → SKIP 0,  TAKE 4 → [1, 2, 3, 4]
page=2, limit=4 → SKIP 4,  TAKE 4 → [5, 6, 7, 8]
page=3, limit=4 → SKIP 8,  TAKE 4 → [9, 10, 11, 12]
```

> 💡 힌트: SKIP을 `page`와 `limit`으로 어떻게 계산할 수 있을까요?

**단점:** 데이터가 실시간으로 추가/삭제되면 중복/누락이 생길 수 있습니다.

```
page=1 조회 시: [10, 9, 8, 7]  ← 새 글(11) 추가됨
page=2 조회 시: [7, 6, 5, 4]   ← 7이 중복!
```

---

### Cursor 방식 (무한스크롤)

"마지막으로 본 항목의 ID"를 기준으로 그 다음 데이터를 가져옵니다.

```
처음 요청 (cursor 없음)  → [12, 11, 10, 9]   nextCursor = 9
cursor=9 요청           → [8,  7,  6,  5]    nextCursor = 5
cursor=5 요청           → [4,  3,  2,  1]    nextCursor = null
```

> 💡 힌트: SQL로 표현하면 `WHERE id < cursor ORDER BY id DESC LIMIT ?` 입니다.

**장점:** 새 글이 추가되어도 중복/누락이 없습니다.

---

### 한눈에 비교

| 항목 | Offset | Cursor |
|------|--------|--------|
| UI 패턴 | 페이지 번호 버튼 | 무한스크롤 |
| 특정 페이지 이동 | 가능 | 불가능 |
| 실시간 데이터 안정성 | 취약 | 안전 |
| 구현 난이도 | 쉬움 | 보통 |

---

## 3. 공통 응답 구조 설계

프론트엔드가 사용하기 편하도록 **데이터(data)** 와 **페이지 정보(meta)** 를 분리합니다.

### Offset 응답

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 2,
    "limit": 10,
    "lastPage": 10,
    "hasNextPage": true
  }
}
```

> 💡 힌트: `lastPage`는 `total`과 `limit`으로 계산할 수 있습니다. `Math.ceil()`을 활용해보세요.

### Cursor 응답

```json
{
  "data": [...],
  "meta": {
    "count": 10,
    "nextCursor": 81,
    "hasNextPage": true
  }
}
```

> 💡 힌트: `nextCursor`는 현재 응답의 **마지막 항목 id**입니다. 마지막 페이지면 `null`을 반환하세요.

---

## 4. Offset 기반 페이지네이션

### 4-1. DTO 작성

`src/posts/dto/offset-pagination.dto.ts`

```
필드:
- page  (기본값 1, 최소 1)
- limit (기본값 20, 최소 1, 최대 100)
```

> 💡 힌트 1: 쿼리스트링은 항상 **문자열**로 들어옵니다. `@Type(() => Number)` 를 붙여야 숫자로 변환됩니다.

> 💡 힌트 2: 값이 없을 때 기본값을 주려면 `@IsOptional()` + 프로퍼티 초기화(`page: number = 1`)를 함께 사용하세요.

> 💡 힌트 3: `@Max(100)`으로 limit 최대값을 제한하지 않으면 `limit=99999` 요청이 가능해집니다.

---

### 4-2. 서비스 구현

`PostsService.getPosts(dto: OffsetPaginationDto)`

> 💡 힌트 1: TypeORM의 `findAndCount()`를 사용하면 데이터와 전체 개수를 **한 번의 쿼리**로 가져올 수 있습니다.
> 반환값은 `[data, total]` 튜플입니다.

> 💡 힌트 2: `take`는 LIMIT, `skip`은 OFFSET입니다.
> `skip = (page - 1) * limit` 공식을 사용하세요.

> 💡 힌트 3: `relations: { author: true }` 옵션으로 작성자 정보를 JOIN해서 가져오세요.

---

### 4-3. 동작 확인

```
GET /posts?page=1&limit=5
GET /posts?page=2&limit=5
GET /posts?page=999&limit=5   → data: [], hasNextPage: false
GET /posts                    → 기본값 적용 확인
```

---

## 5. Cursor 기반 페이지네이션

### 5-1. DTO 작성

`src/posts/dto/cursor-pagination.dto.ts`

```
필드:
- cursor? (optional, 숫자 — 첫 요청에는 없어도 됨)
- limit   (기본값 20)
```

> 💡 힌트: `cursor`는 반드시 `@IsOptional()`이어야 합니다. 첫 요청에는 cursor가 없기 때문입니다.

---

### 5-2. 서비스 구현

`PostsService.getPostsFeed(dto: CursorPaginationDto)`

> 💡 힌트 1: `find()`가 아닌 **QueryBuilder**를 사용하세요.
> `WHERE id < :cursor` 같은 조건부 쿼리는 QueryBuilder로 작성하는 게 자연스럽습니다.
>
> ```
> createQueryBuilder('post')
>   .leftJoinAndSelect(...)
>   .orderBy(...)
>   .take(...)
>   .where(...)    ← cursor가 있을 때만 추가!
> ```

> 💡 힌트 2: **limit + 1 트릭**을 사용하세요.
> `limit + 1`개를 요청해서, 결과가 `limit`을 초과하면 다음 페이지가 있다고 판단합니다.
>
> ```
> limit=10 → 11개 조회
>   11개 반환 → hasNextPage=true,  앞 10개만 data로
>   10개 이하 → hasNextPage=false, 전체를 data로
> ```

> 💡 힌트 3: `nextCursor`는 `data`의 **마지막 항목 id**입니다.
> `hasNextPage`가 false면 `nextCursor`는 `null`을 반환하세요.

> 💡 힌트 4: cursor가 없는 첫 요청에는 `WHERE` 조건을 **추가하면 안 됩니다**.
> `if (cursor)` 조건으로 분기하세요.

---

### 5-3. 동작 확인

```
GET /posts/feed?limit=5             → 최신 5개, nextCursor 확인
GET /posts/feed?cursor=XX&limit=5   → XX 이전 5개
GET /posts/feed?cursor=1&limit=5    → data: [], hasNextPage: false
```

---

## 6. 컨트롤러 연결 시 주의사항

### 라우트 순서 문제

NestJS는 라우트를 **선언 순서대로** 매칭합니다.

```
❌ 잘못된 순서
  @Get(':id')   ← 'feed'도 :id로 해석됨
  @Get('feed')  ← 절대 실행 안 됨

✅ 올바른 순서
  @Get('feed')  ← 구체적인 경로 먼저
  @Get(':id')   ← 동적 파라미터 나중에
```

### 쿼리스트링은 `@Query()`로

```
GET /posts?page=1&limit=10  →  @Query() dto: OffsetPaginationDto
GET /posts/feed?cursor=81   →  @Query() dto: CursorPaginationDto
```

> REST 원칙상 조회(GET) 요청의 파라미터는 Body가 아닌 Query로 받습니다.

---

## 7. 자주 하는 실수

**실수 1: skip 계산 오류**
```
❌ skip: page * limit       → page=1이면 10개를 건너뜀
✅ skip: (page - 1) * limit → page=1이면 0개를 건너뜀
```

**실수 2: nextCursor를 첫 번째 항목으로 잡음**
```
❌ nextCursor = data[0].id             → 첫 번째 항목
✅ nextCursor = data[data.length-1].id → 마지막 항목
```

**실수 3: limit+1 없이 hasNextPage 판단**
```
❌ hasNextPage = posts.length === limit  → 딱 맞아떨어지면 판단 불가
✅ take(limit + 1) 후 posts.length > limit 으로 판단
```

**실수 4: cursor 없을 때도 WHERE 추가**
```
❌ qb.where('post.id < :cursor', { cursor: undefined })
✅ if (cursor) { qb.where('post.id < :cursor', { cursor }) }
```

**실수 5: @Type(() => Number) 누락**
```
쿼리스트링 ?page=1 → TypeScript에서 "1" (문자열)로 들어옴
@Type(() => Number) 없으면 검증 실패
```

---

## 8. 실습 체크리스트

### Phase 1 — Offset 페이지네이션

- [ ] `offset-pagination.dto.ts` 작성 (page, limit, 유효성 검사, 기본값)
- [ ] `PostsService.getPosts()` 구현 (findAndCount, meta 계산)
- [ ] 컨트롤러에 `@Query()` 연결
- [ ] `meta.lastPage`, `meta.hasNextPage` 값 검증

### Phase 2 — Cursor 페이지네이션

- [ ] `cursor-pagination.dto.ts` 작성 (cursor optional, limit)
- [ ] `PostsService.getPostsFeed()` 구현 (QueryBuilder, limit+1 트릭)
- [ ] `@Get('feed')` 라우트를 `@Get(':id')` 보다 위에 선언
- [ ] `nextCursor: null`, `hasNextPage: false` 마지막 페이지 확인

### Phase 3 — 마무리 검증

- [ ] `GET /posts/feed` 가 `GET /posts/:id` 와 충돌하지 않는지 확인
- [ ] `page=0` 또는 `limit=0` 요청 시 400 에러 반환 확인
- [ ] `limit=200` 요청 시 400 에러 반환 확인
