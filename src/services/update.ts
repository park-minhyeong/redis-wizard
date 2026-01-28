import { getRedisClient } from "./config";
import { read } from "./read";
import { create } from "./create";

/**
 * Redis에서 키의 값을 부분 업데이트합니다.
 * 기존 값을 읽어와서 병합한 후 저장합니다.
 * 키는 자동으로 table 프리픽스가 추가됩니다.
 *
 * @param {string} table - 테이블/스코프 프리픽스
 * @param {string} key - 업데이트할 키 (프리픽스 제외)
 * @param {Partial<T>} partial - 업데이트할 부분 값
 * @param {number} [expireSeconds] - 만료 시간(초), 지정하지 않으면 기본값 사용
 * @returns {Promise<T | null>} 업데이트된 값, 키가 존재하지 않으면 null
 * @throws {Error} Redis 업데이트 중 오류가 발생한 경우
 */
export const update = async <T = any>(
  table: string,
  key: string,
  partial: Partial<T>,
  expireSeconds?: number
): Promise<T | null> => {
  // 기존 값 조회
  const existing = await read<T>(table, key);

  if (existing === null) {
    return null;
  }

  // 기존 값과 병합
  const updated = { ...existing, ...partial } as T;

  // 저장
  await create(table, key, updated, expireSeconds);

  return updated;
};
