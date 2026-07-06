import { err, ok, type Result } from "@poc/core";

/** JSON 文字列を Result で安全にパースする。 */
export function parseJson<T = unknown>(input: string): Result<T> {
  try {
    return ok(JSON.parse(input) as T);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/** ランダムな id を生成する（crypto ベース）。 */
export function generateId(): string {
  return crypto.randomUUID();
}
