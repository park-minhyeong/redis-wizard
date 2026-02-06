# Redis Wizard

Redis Wizard는 `redis` 라이브러리를 감싸서 간편한 데이터베이스 작업을 제공하는 TypeScript 기반 Redis 유틸리티 패키지입니다.

## 주요 기능

- 🔑 **자동 키 프리픽스 관리**: 테이블/스코프 프리픽스를 자동으로 추가하여 키를 체계적으로 관리
- 🔄 **자동 직렬화/역직렬화**: 객체를 자동으로 JSON으로 변환하여 저장하고 읽을 때 자동 파싱
- ⏰ **만료 시간 관리**: 기본 만료 시간 설정 및 개별 키별 만료 시간 설정 지원
- 🛡️ **타입 안정성**: TypeScript 제네릭을 통한 완전한 타입 지원
- 🔌 **자동 연결 관리**: Redis 연결을 자동으로 초기화하고 관리
- 📦 **간단한 API**: 직관적이고 사용하기 쉬운 메서드 제공

## 설치

```bash
npm install redis-wizard
```

## 환경 변수 설정

Redis 연결을 위해 다음 환경 변수를 설정하세요:

```bash
# Redis URL (필수)
REDIS_URL=redis://localhost:6379

# 또는 Redis 포트만 지정 (기본 호스트: localhost)
REDIS_PORT=6379

# 연결 풀 설정 (선택사항)
REDIS_CONNECT_TIMEOUT=10000
REDIS_KEEP_ALIVE=true
REDIS_KEEP_ALIVE_DELAY=0
REDIS_LAZY_CONNECT=false
REDIS_MAX_RETRIES=10
```

## 사용 예제

### 기본 사용법

```typescript
import { createRedis } from 'redis-wizard';

// 타입 정의
interface Application {
  id: string;
  title: string;
  status: 'draft' | 'published';
  createdAt: Date;
}

// Redis Wizard 인스턴스 생성
const redis = createRedis<Application>({
  table: "draft:applications",
  cacheExpired: 3600, // 기본 만료 시간: 1시간
});

// 데이터 생성
await redis.create("app-123", {
  id: "app-123",
  title: "My Application",
  status: "draft",
  createdAt: new Date(),
});

// 데이터 조회
const app = await redis.read("app-123");
console.log(app); // { id: "app-123", title: "My Application", ... }

// 데이터 부분 업데이트
const updated = await redis.update("app-123", {
  status: "published"
});
console.log(updated); // 업데이트된 전체 객체

// 키 존재 여부 확인
const exists = await redis.exists("app-123");
console.log(exists); // true

// 만료 시간 설정
await redis.setExpire("app-123", 7200); // 2시간

// 남은 만료 시간 조회
const ttl = await redis.getTtl("app-123");
console.log(ttl); // 남은 초 수 (예: 3600)

// 데이터 삭제
await redis.delete("app-123");
```

### 개별 만료 시간 설정

```typescript
// create 시 만료 시간 지정
await redis.create("app-456", appData, 1800); // 30분

// update 시 만료 시간 지정
await redis.update("app-456", { status: "published" }, 3600); // 1시간
```

### 연결 관리

```typescript
import { disconnect, getRedisClient } from 'redis-wizard';

// Redis 클라이언트 직접 접근 (필요한 경우)
const client = await getRedisClient();

// 연결 종료
await disconnect();
```

## API 문서

### `createRedis<T>(config: RedisWizardConfig): RedisWizard<T>`

Redis Wizard 인스턴스를 생성합니다.

**파라미터:**
- `config.table` (string, 필수): 테이블/스코프 프리픽스 (예: "draft:applications")
- `config.cacheExpired` (number, 선택): 기본 캐시 만료 시간(초)

**반환값:** RedisWizard 인스턴스

### `read(key: string): Promise<T | null>`

키에 해당하는 값을 조회합니다.

**파라미터:**
- `key` (string): 조회할 키 (table 프리픽스는 자동 추가)

**반환값:** 값이 존재하면 파싱된 객체, 없으면 `null`

### `create(key: string, value: T, expireSeconds?: number): Promise<void>`

키-값 쌍을 저장합니다.

**파라미터:**
- `key` (string): 저장할 키 (table 프리픽스는 자동 추가)
- `value` (T): 저장할 값 (객체는 자동 직렬화)
- `expireSeconds` (number, 선택): 만료 시간(초), 지정하지 않으면 `config.cacheExpired` 사용

### `update(key: string, partial: Partial<T>, expireSeconds?: number): Promise<T | null>`

키의 값을 부분 업데이트합니다.

**파라미터:**
- `key` (string): 업데이트할 키 (table 프리픽스는 자동 추가)
- `partial` (Partial<T>): 업데이트할 부분 값
- `expireSeconds` (number, 선택): 만료 시간(초), 지정하지 않으면 `config.cacheExpired` 사용

**반환값:** 업데이트된 값, 키가 존재하지 않으면 `null`

### `delete(key: string): Promise<boolean>`

키를 삭제합니다.

**파라미터:**
- `key` (string): 삭제할 키 (table 프리픽스는 자동 추가)

**반환값:** 삭제 성공 여부

### `exists(key: string): Promise<boolean>`

키의 존재 여부를 확인합니다.

**파라미터:**
- `key` (string): 확인할 키 (table 프리픽스는 자동 추가)

**반환값:** 키가 존재하면 `true`

### `setExpire(key: string, seconds?: number): Promise<boolean>`

키의 만료 시간을 설정합니다.

**파라미터:**
- `key` (string): 만료 시간을 설정할 키 (table 프리픽스는 자동 추가)
- `seconds` (number, 선택): 만료 시간(초), 지정하지 않으면 `config.cacheExpired` 사용

**반환값:** 설정 성공 여부

### `getTtl(key: string): Promise<number | null>`

키의 남은 만료 시간을 조회합니다.

**파라미터:**
- `key` (string): 조회할 키 (table 프리픽스는 자동 추가)

**반환값:** 남은 만료 시간(초), 만료 시간이 없으면 `null`

## 키 네이밍 규칙

Redis Wizard는 자동으로 키에 프리픽스를 추가합니다:

```typescript
const redis = createRedis({
  table: "draft:applications"
});

// "app-123" 키는 실제로 "draft:applications:app-123"로 저장됩니다
await redis.create("app-123", data);
```

이를 통해 여러 테이블/스코프를 체계적으로 관리할 수 있습니다.

## 개발

```bash
# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 배포 (빌드 + 버전 업데이트 + 패키지 설정)
npm run deploy
```

## 라이선스

MIT

## 작성자

park-minhyeong
