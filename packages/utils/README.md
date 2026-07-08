# @gekal-study-nodejs/utils

`@gekal-study-nodejs/core` の上に構築した共通ヘルパー（JSON / ID など）。

> [multi-package-poc](https://github.com/gekal-study-nodejs/multi-package-poc) のパッケージ。
> インストール手順（GitHub Packages / `.npmrc` 設定）はリポジトリ README を参照。

## インストール

```bash
pnpm add @gekal-study-nodejs/utils
```

## API

| 名前 | 種別 | 説明 |
|---|---|---|
| `parseJson<T>(input)` | function | JSON 文字列を `Result<T>` で安全にパース（例外を投げない） |
| `generateId()` | function | `crypto.randomUUID()` によるランダム id を生成 |

## 使用例

```ts
import { parseJson, generateId } from "@gekal-study-nodejs/utils";

const parsed = parseJson<{ name: string }>('{"name":"Ada"}');
if (parsed.ok) {
  console.log(parsed.value.name); // "Ada"
}

console.log(generateId()); // 例: "1e4b0c2a-..."
```
