import { getRedisClient } from "./config";

/**
 * Redis에서 키의 존재 여부를 확인합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 확인할 키 (프리픽스 제외)
 * @returns {Promise<boolean>} 키가 존재하면 true, 없으면 false
 * @throws {Error} Redis 확인 중 오류가 발생한 경우
 */
export const exists = async (
  table: string,
  key: string
): Promise<boolean> => {
  const client = await getRedisClient();
  const fullKey = `${table}:${key}`;

  try {
    const result = await client.exists(fullKey);
    return result > 0;
  } catch (error) {
    console.error(`Redis EXISTS 오류 (key: ${fullKey}):`, error);
    throw error;
  }
};
