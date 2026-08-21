import { getRedisClient } from "./config";

/**
 * Redis에서 키에 해당하는 값을 조회합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 * 값이 JSON 문자열인 경우 자동으로 파싱하여 반환합니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 조회할 키 (프리픽스 제외)
 * @returns {Promise<T | null>} 키에 해당하는 값, 존재하지 않으면 null
 * @throws {Error} Redis 조회 중 오류가 발생한 경우
 */
export const read = async <T = any>(
  table: string,
  key: string
): Promise<T | null> => {
  const client = await getRedisClient();
  const fullKey = `${table}:${key}`;

  try {
    const value = await client.get(fullKey);

    if (value === null) {
      return null;
    }

    // JSON 문자열인지 확인하고 파싱 시도
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      // JSON 형식인지 간단히 확인 (시작이 { 또는 [)
      if (
        (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) ||
        (trimmedValue.startsWith("[") && trimmedValue.endsWith("]"))
      ) {
        try {
          return JSON.parse(value) as T;
        } catch {
          // JSON 파싱 실패 시 원래 문자열 반환
          return value as T;
        }
      }
    }

    return value as T | null;
  } catch (error) {
    console.error(`Redis GET 오류 (key: ${fullKey}):`, error);
    throw error;
  }
};
