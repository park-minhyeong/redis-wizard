import { getRedisClient } from "./config";

/**
 * Redis에서 키의 남은 만료 시간을 조회합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 조회할 키 (프리픽스 제외)
 * @returns {Promise<number | null>} 남은 만료 시간(초), 만료 시간이 없으면 null
 * @throws {Error} Redis 만료 시간 조회 중 오류가 발생한 경우
 */
export const getTtl = async (
  table: string,
  key: string
): Promise<number | null> => {
  const client = await getRedisClient();
  const fullKey = `${table}:${key}`;

  try {
    const ttl = await client.ttl(fullKey);
    return ttl >= 0 ? ttl : null;
  } catch (error) {
    console.error(`Redis TTL 오류 (key: ${fullKey}):`, error);
    throw error;
  }
};
