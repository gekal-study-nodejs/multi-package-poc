# @gekal-study-nodejs/core

Result 型・基本エンティティなど、全パッケージ共通の型プリミティブ。依存なし。

> [multi-package-poc](https://github.com/gekal-study-nodejs/multi-package-poc) のパッケージ。
> インストール手順（GitHub Packages / `.npmrc` 設定）はリポジトリ README を参照。

## インストール

```bash
pnpm add @gekal-study-nodejs/core
```

## API

| 名前 | 種別 | 説明 |
|---|---|---|
| `Result<T, E>` | type | 成功 `{ ok: true, value }` / 失敗 `{ ok: false, error }` を型で表す軽量 Result |
| `ok(value)` | function | 成功 Result を生成 |
| `err(error)` | function | 失敗 Result を生成 |
| `Entity` | interface | `id` / `createdAt` を持つ共通エンティティ |
| `CORE_VERSION` | const | バージョン文字列 |

## 使用例

```ts
import { ok, err, type Result } from "@gekal-study-nodejs/core";

function half(n: number): Result<number> {
  return n % 2 === 0 ? ok(n / 2) : err(new Error("odd number"));
}

const r = half(10);
if (r.ok) {
  console.log(r.value); // 5
} else {
  console.error(r.error);
}
```
