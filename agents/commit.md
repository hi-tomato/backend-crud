# /commit - 변경 사항을 논리적 단위로 분리하여 커밋

많은 파일이 변경되었을 때, 관련된 파일들끼리 묶어서 작은 단위의 커밋으로 분리합니다.

## 사용법

```
/commit
```

실행하면 변경 사항을 분석하고 논리적 단위로 나눠서 커밋합니다.

## 핵심 원칙

> **각 커밋은 에러 없이 독립적으로 동작하는 하나의 기능 단위여야 합니다.**

- 각 커밋 시점에서 빌드가 성공해야 함
- 각 커밋 시점에서 타입 에러가 없어야 함
- 각 커밋 시점에서 테스트가 통과해야 함
- 의존하는 코드가 없는 상태로 커밋하면 안 됨 (예: 타입만 추가하고 해당 타입을 사용하는 코드는 다음 커밋)
- **도메인 로직(API, 훅)은 UI 적용 전에 먼저 커밋** (API → 훅 → 컴포넌트 → 페이지 순서)

**잘못된 예시**:

```
커밋 1: ForkliftCallStatus enum 추가
커밋 2: ForkliftCall interface 추가 (ForkliftCallStatus 참조)
커밋 3: ForkliftCallApi 추가 (ForkliftCall 참조)
```

→ 커밋 1만 있으면 사용되지 않는 enum이 존재 (의미 없는 커밋)

**올바른 예시**:

```
커밋 1: ForkliftCall API 및 DTO 추가 (enum, interface, request/response dto, api 클래스 함께)
커밋 2: ForkliftCall 관련 훅 추가 (useForkliftCallQuery, useForkliftCallMutation 등)
커밋 3: ForkliftCall 목록 컴포넌트 추가
커밋 4: ForkliftCall 페이지에 목록 컴포넌트 연결
```

→ 각 커밋이 독립적으로 의미 있고 에러 없이 동작
→ 도메인 로직(API, 훅)이 UI보다 먼저 커밋됨

## 실행 절차

### 1. 변경 사항 분석

```bash
git status
git diff --stat
git diff
```

변경된 파일 목록과 각 파일의 변경 내용을 확인합니다.

### 2. 논리적 그룹 분류

변경된 파일들을 다음 기준으로 그룹화합니다:

#### 2.1 도메인/기능 기준

| 경로 패턴                      | 그룹          |
| ------------------------------ | ------------- |
| `src/api/{domain}/`            | API 도메인별  |
| `src/domain/{area}/{feature}/` | 도메인 기능별 |
| `src/components/`              | 공유 컴포넌트 |
| `src/utils/`                   | 유틸리티      |
| `src/page/`                    | 페이지        |

#### 2.2 변경 유형 기준

같은 도메인 내에서도 변경 유형에 따라 추가 분리 가능:

- **타입/인터페이스**: `*.interface.ts`, `*.type.ts`, `dto/`, `enum/`
- **API 레이어**: `*.api.ts`, `dto/request/`, `dto/response/`
- **컴포넌트**: `components/`, `*.tsx`
- **훅**: `hooks/`, `use*.ts`
- **서비스/유틸**: `service/`, `utils/`, `lib/`
- **테스트**: `*.test.ts`, `*.spec.ts`
- **설정**: `*.config.*`, `package.json`, `tsconfig.json`
- **문서**: `*.md`, `CLAUDE.md`

#### 2.3 관계 기반 그룹화 (필수)

**의존성이 있는 파일들은 반드시 함께 커밋**:

- **API 레이어**: API 클래스 + Request DTO + Response DTO + Interface + Enum → 하나의 커밋
- **훅 레이어**: Query 훅, Mutation 훅 등 도메인 훅 → 별도 커밋 (API 커밋 이후)
- **컴포넌트 레이어**: UI 컴포넌트들 → 별도 커밋 (훅 커밋 이후)
- **페이지 레이어**: 페이지에 컴포넌트 연결 → 별도 커밋 (컴포넌트 커밋 이후)
- 유틸 함수 + 해당 테스트 파일 → 하나의 커밋

**레이어별 분리 원칙**:

- 도메인 로직(API, 훅)은 UI 적용 전에 먼저 커밋
- 훅은 API를 사용하므로 API 커밋 이후에 커밋
- 컴포넌트는 훅을 사용하므로 훅 커밋 이후에 커밋

### 3. 커밋 단위 검증

각 커밋 그룹에 대해 다음을 확인:

1. **이 커밋만으로 빌드가 되는가?**
   - 참조하는 타입/함수가 모두 포함되어 있는가?
   - import 에러가 발생하지 않는가?

2. **이 커밋이 의미 있는 단위인가?**
   - 사용되지 않는 코드만 추가하는 건 아닌가?
   - 기능적으로 완결된 단위인가?

3. **다음 커밋과 분리해도 되는가?**
   - 다음 커밋 없이도 이 커밋이 독립적으로 의미가 있는가?

### 4. 커밋 순서 결정

의존성을 고려하여 커밋 순서를 결정합니다:

1. **공통 유틸/타입** (여러 곳에서 참조됨)
2. **API 레이어** (enum + interface + dto + api 클래스 함께)
3. **훅/서비스** (컴포넌트에서 사용)
4. **컴포넌트** (페이지에서 사용)
5. **페이지**
6. **테스트** (테스트 대상과 함께 또는 별도)
7. **설정/문서**

### 5. 그룹별 커밋 생성

각 그룹에 대해:

1. 해당 그룹의 파일들만 스테이징
2. 변경 내용에 맞는 커밋 메시지 작성 (CLAUDE.md 컨벤션 준수)
3. 커밋 생성

```bash
# 1단계: API 전체 (enum + interface + dto + api 클래스)
git add src/api/forklift-call/
git commit -m "$(cat <<'EOF'
✨ Feat: ForkliftCall API 및 DTO 추가

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# 2단계: 훅 (도메인 로직)
git add src/domain/wms/forklift-call/lib/hooks/
git commit -m "$(cat <<'EOF'
✨ Feat: ForkliftCall 관련 훅 추가

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# 3단계: 컴포넌트 (UI)
git add src/domain/wms/forklift-call/components/
git commit -m "$(cat <<'EOF'
✨ Feat: ForkliftCall 목록 컴포넌트 추가

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# 4단계: 페이지 (컴포넌트 연결)
git add src/domain/wms/forklift-call/pages/
git commit -m "$(cat <<'EOF'
✨ Feat: ForkliftCall 페이지에 목록 컴포넌트 연결

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 6. 커밋 메시지 컨벤션

**형식**: `{이모지} {타입}: {한글 메시지}`

#### Gitmoji 선택 기준

| 변경 유형           | 이모지 | 타입     |
| ------------------- | ------ | -------- |
| 신규 기능/파일 추가 | ✨     | Feat     |
| 기존 코드 리팩토링  | ♻️     | Refactor |
| 비즈니스 로직 수정  | 👔     | Update   |
| UI/스타일 변경      | 💄     | Style    |
| 코드 삭제           | 🔥     | Remove   |
| 타입/인터페이스     | 🏷️     | Type     |
| 오타 수정           | ✏️     | Typo     |
| 버그 수정           | 🐛     | Fix      |
| 의존성 추가         | 📦     | Install  |
| 테스트              | 🧪     | Test     |
| 문서                | 📝     | Docs     |

### 7. 사용자 확인

커밋을 생성하기 전에 다음을 사용자에게 보여주고 확인받습니다:

```
📦 커밋 계획

1. ✨ Feat: ForkliftCall API 및 DTO 추가
   - src/api/forklift-call/dto/enum/forklift-call-status.enum.ts
   - src/api/forklift-call/dto/forklift-call.interface.ts
   - src/api/forklift-call/dto/request/create-forklift-call.request.ts
   - src/api/forklift-call/dto/response/create-forklift-call.response.ts
   - src/api/forklift-call/forklift-call.api.ts

2. ✨ Feat: ForkliftCall 관련 훅 추가
   - src/domain/wms/forklift-call/lib/hooks/useForkliftCallQuery.ts
   - src/domain/wms/forklift-call/lib/hooks/useForkliftCallMutation.ts

3. ✨ Feat: ForkliftCall 목록 컴포넌트 추가
   - src/domain/wms/forklift-call/components/ForkliftCallList.tsx
   - src/domain/wms/forklift-call/components/ForkliftCallCard.tsx

4. ✨ Feat: ForkliftCall 페이지에 컴포넌트 연결
   - src/domain/wms/forklift-call/pages/ForkliftCallPage.tsx

5. 📝 Docs: CLAUDE.md 업데이트
   - CLAUDE.md

각 커밋은 독립적으로 빌드/동작 가능합니다.
진행할까요? (Y/n)
```

## 예시 시나리오

### Before (단일 대규모 변경)

```
Changes not staged for commit:
  modified:   src/api/forklift-call/dto/enum/forklift-call-status.enum.ts
  modified:   src/api/forklift-call/dto/forklift-call.interface.ts
  modified:   src/api/forklift-call/dto/request/create-forklift-call.request.ts
  modified:   src/api/forklift-call/dto/response/create-forklift-call.response.ts
  modified:   src/api/forklift-call/forklift-call.api.ts
  modified:   src/domain/wms/forklift-call/components/ForkliftCallList.tsx
  modified:   src/domain/wms/forklift-call/lib/hooks/useForkliftCall.ts
  modified:   CLAUDE.md
```

### After (논리적 단위로 분리된 커밋)

```
e71829ff1 📝 Docs: CLAUDE.md 업데이트
d60617ff8 ✨ Feat: ForkliftCall 페이지에 컴포넌트 연결
c345b9bde ✨ Feat: ForkliftCall 목록 컴포넌트 추가
b234a8cde ✨ Feat: ForkliftCall 관련 훅 추가
a451f3b91 ✨ Feat: ForkliftCall API 및 DTO 추가
```

## 주의사항

- **에러 없는 커밋**: 각 커밋 시점에서 `npm run build`와 `npm test`가 통과해야 함
- **의존성 포함**: 타입을 추가하면 해당 타입을 사용하는 코드도 함께 커밋
- **의미 있는 단위**: 각 커밋이 독립적으로 의미 있는 기능 단위여야 함
- **너무 잘게 쪼개지 않기**: 파일 하나당 커밋 X, 기능 단위로 그룹화
- **커밋 메시지**: 변경의 "왜"를 설명, "무엇"은 diff에서 확인 가능
- **Co-Authored-By**: Claude가 들어가는 라인을 제외하고 커밋을 진행합니다.

## 옵션

### 푸시 포함

커밋 후 자동으로 푸시하려면:

```
/commit --push
```

### 드라이런 (미리보기만)

실제 커밋 없이 계획만 보려면:

```
/commit --dry-run
```
