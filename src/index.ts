import { read } from "./services/read";
import { create } from "./services/create";
import { update } from "./services/update";
import { deleteKey } from "./services/delete";
import { exists } from "./services/exists";
import { setExpire } from "./services/setExpire";
import { getTtl } from "./services/getTtl";

/**
 * Redis Wizard 설정
 */
export interface RedisWizardConfig {
  /** 테이블/스코프 프리픽스 (예: "draft:applications") */
  table: string;
  /** 기본 캐시 만료 시간(초), 지정하지 않으면 만료 시간 없음 */
  cacheExpired?: number;
}

/**
 * Redis Wizard 인스턴스 인터페이스
 */
export interface RedisWizard<T = any> {
  /**
   * 키에 해당하는 값을 조회합니다.
   * @param key - 조회할 키 (table 프리픽스는 자동 추가)
   * @returns 값이 존재하면 파싱된 객체, 없으면 null
   */
  read(key: string): Promise<T | null>;

  /**
   * 키-값 쌍을 저장합니다.
   * @param key - 저장할 키 (table 프리픽스는 자동 추가)
   * @param value - 저장할 값 (객체는 자동 직렬화)
   * @param expireSeconds - 만료 시간(초), 지정하지 않으면 config.cacheExpired 사용
   */
  create(key: string, value: T, expireSeconds?: number): Promise<void>;

  /**
   * 키의 값을 부분 업데이트합니다.
   * @param key - 업데이트할 키 (table 프리픽스는 자동 추가)
   * @param partial - 업데이트할 부분 값
   * @param expireSeconds - 만료 시간(초), 지정하지 않으면 config.cacheExpired 사용
   * @returns 업데이트된 값, 키가 존재하지 않으면 null
   */
  update(key: string, partial: Partial<T>, expireSeconds?: number): Promise<T | null>;

  /**
   * 키를 삭제합니다.
   * @param key - 삭제할 키 (table 프리픽스는 자동 추가)
   * @returns 삭제 성공 여부
   */
  delete(key: string): Promise<boolean>;

  /**
   * 키의 존재 여부를 확인합니다.
   * @param key - 확인할 키 (table 프리픽스는 자동 추가)
   * @returns 키가 존재하면 true
   */
  exists(key: string): Promise<boolean>;

  /**
   * 키의 만료 시간을 설정합니다.
   * @param key - 만료 시간을 설정할 키 (table 프리픽스는 자동 추가)
   * @param seconds - 만료 시간(초), 지정하지 않으면 config.cacheExpired 사용
   * @returns 설정 성공 여부
   */
  setExpire(key: string, seconds?: number): Promise<boolean>;

  /**
   * 키의 남은 만료 시간을 조회합니다.
   * @param key - 조회할 키 (table 프리픽스는 자동 추가)
   * @returns 남은 만료 시간(초), 만료 시간이 없으면 null
   */
  getTtl(key: string): Promise<number | null>;
}

/**
 * Redis Wizard 인스턴스를 생성합니다.
 * 
 * @example
 * ```typescript
 * interface Application {
 *   id: string;
 *   title: string;
 *   status: 'draft' | 'published';
 * }
 * 
 * const redis = createRedis<Application>({
 *   table: "draft:applications",
 *   cacheExpired: 10000,
 * });
 * 
 * await redis.create("app-123", { id: "app-123", title: "My App", status: "draft" });
 * const app = await redis.read("app-123");
 * await redis.update("app-123", { status: "published" });
 * await redis.delete("app-123");
 * ```
 * 
 * @param config - Redis Wizard 설정
 * @returns Redis Wizard 인스턴스
 */
export function createRedis<T = any>(
  config: RedisWizardConfig
): RedisWizard<T> {
  const { table, cacheExpired } = config;

  return {
    async read(key: string): Promise<T | null> {
      return await read<T>(table, key);
    },

    async create(key: string, value: T, expireSeconds?: number): Promise<void> {
      await create(table, key, value, expireSeconds ?? cacheExpired);
    },

    async update(
      key: string,
      partial: Partial<T>,
      expireSeconds?: number
    ): Promise<T | null> {
      return await update<T>(table, key, partial, expireSeconds ?? cacheExpired);
    },

    async delete(key: string): Promise<boolean> {
      return await deleteKey(table, key);
    },

    async exists(key: string): Promise<boolean> {
      return await exists(table, key);
    },

    async setExpire(key: string, seconds?: number): Promise<boolean> {
      const expireSeconds = seconds ?? cacheExpired;
      if (expireSeconds === undefined) {
        throw new Error("만료 시간을 지정해야 합니다. createRedis의 cacheExpired 설정 또는 seconds 파라미터를 제공하세요.");
      }
      return await setExpire(table, key, expireSeconds);
    },

    async getTtl(key: string): Promise<number | null> {
      return await getTtl(table, key);
    },
  };
}

// Redis 연결 관리 함수 export
export { disconnect } from "./services/config";
export { getRedisClient } from "./services/config";
