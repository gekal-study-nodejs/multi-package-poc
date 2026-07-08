# @gekal-study-nodejs/client

`@gekal-study-nodejs/core` と `@gekal-study-nodejs/utils` を合成した高レベル API。
メモリ上に `User` を保持する最小クライアント（cross-package 参照のデモ）。

> [multi-package-poc](https://github.com/gekal-study-nodejs/multi-package-poc) のパッケージ。
> インストール手順（GitHub Packages / `.npmrc` 設定）はリポジトリ README を参照。

## インストール

```bash
pnpm add @gekal-study-nodejs/client
```

## API: `UserClient`

| メソッド | 説明 |
|---|---|
| `create(name)` | `User` を生成して保持し、その `User` を返す |
| `get(id)` | `id` の `User` を `Result<User>` で返す（未存在なら失敗 Result） |
| `fromJson(payload)` | JSON ペイロード（`{ name }`）から `User` を復元 |
| `list()` | 登録済みの全 `User` を作成順で返す |
| `delete(id)` | `User` を削除し、削除できたかを `boolean` で返す |

## 使用例

```ts
import { UserClient } from "@gekal-study-nodejs/client";

const client = new UserClient();
const user = client.create("Ada");

const found = client.get(user.id);
if (found.ok) console.log(found.value.name); // "Ada"

client.list();          // [User]
client.delete(user.id); // true
```
