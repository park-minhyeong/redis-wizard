import { getRedisClient } from "./config";

/**
 * Redis에 키-값 쌍을 저장합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 * 값은 자동으로 JSON 문자열로 직렬화됩니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 저장할 키 (프리픽스 제외)
 * @param {T} value - 저장할 값 (객체는 자동 직렬화)
 * @param {number} [expireSeconds] - 만료 시간(초), 지정하지 않으면 기본값 사용
 * @returns {Promise<void>}
 * @throws {Error} Redis 저장 중 오류가 발생한 경우
 */
export const create = async <T = any>(
  table: string,
  key: string,
  value: T,
  expireSeconds?: number
): Promise<void> => {
  const client = await getRedisClient();
  const fullKey = `${table}:${key}`;
  const serialized =
    typeof value === "string" ? value : JSON.stringify(value);

  try {
    if (expireSeconds !== undefined) {
      await client.setEx(fullKey, expireSeconds, serialized);
    } else {
      await client.set(fullKey, serialized);
    }
  } catch (error) {
    console.error(`Redis SET 오류 (key: ${fullKey}):`, error);
    throw error;
  }
};
