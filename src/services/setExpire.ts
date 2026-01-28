import { getRedisClient } from "./config";

/**
 * Redis에서 키의 만료 시간을 설정합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 만료 시간을 설정할 키 (프리픽스 제외)
 * @param {number} seconds - 만료 시간(초)
 * @returns {Promise<boolean>} 설정 성공 여부
 * @throws {Error} Redis 만료 시간 설정 중 오류가 발생한 경우
 */
export const setExpire = async (
  table: string,
  key: string,
  seconds: number
): Promise<boolean> => {
  const client = await getRedisClient();
  const fullKey = `${table}:${key}`;

  try {
    const result = await client.expire(fullKey, seconds);
    return Boolean(result);
  } catch (error) {
    console.error(`Redis EXPIRE 오류 (key: ${fullKey}):`, error);
    throw error;
  }
};
