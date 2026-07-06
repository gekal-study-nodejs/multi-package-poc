/** 成功/失敗を型で表現する軽量 Result 型。 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** 全パッケージ共通の識別子付きエンティティ。 */
export interface Entity {
  readonly id: string;
  readonly createdAt: Date;
}

export const CORE_VERSION = "0.1.0";
