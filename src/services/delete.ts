import { getRedisClient } from "./config";

/**
 * Redis에서 키를 삭제합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 삭제할 키 (프리픽스 제외)
 * @returns {Promise<boolean>} 삭제 성공 여부 (키가 존재했으면 true, 없었으면 false)
 * @throws {Error} Redis 삭제 중 오류가 발생한 경우
 */
export const deleteKey = async (
  table: string,
  key: string
): Promise<boolean> => {
  const client = await getRedisClient();
  const fullKey = `${table}:${key}`;

  try {
    const result = await client.del(fullKey);
    return result > 0;
  } catch (error) {
    console.error(`Redis DEL 오류 (key: ${fullKey}):`, error);
    throw error;
  }
};
