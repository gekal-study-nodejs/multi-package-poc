import { type Entity, ok, type Result } from "@poc/core";
import { generateId, parseJson } from "@poc/utils";

export interface User extends Entity {
  name: string;
}

/** メモリ上に User を保持する最小クライアント。cross-package 参照のデモ。 */
export class UserClient {
  private readonly store = new Map<string, User>();

  create(name: string): User {
    const user: User = { id: generateId(), name, createdAt: new Date() };
    this.store.set(user.id, user);
    return user;
  }

  get(id: string): Result<User> {
    const user = this.store.get(id);
    return user
      ? ok(user)
      : { ok: false, error: new Error(`User not found: ${id}`) };
  }

  /** JSON ペイロードから User を復元する。 */
  fromJson(payload: string): Result<User> {
    const parsed = parseJson<{ name: string }>(payload);
    if (!parsed.ok) return parsed;
    return ok(this.create(parsed.value.name));
  }
}
