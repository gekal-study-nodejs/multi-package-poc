import { type Entity, ok, type Result } from "@gekal-study-nodejs/core";
import { generateId, parseJson } from "@gekal-study-nodejs/utils";

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

  /** 登録済みの全 User を作成順で返す。 */
  list(): User[] {
    return [...this.store.values()];
  }

  /** User を削除し、削除できたかどうかを返す。 */
  delete(id: string): boolean {
    return this.store.delete(id);
  }
}
