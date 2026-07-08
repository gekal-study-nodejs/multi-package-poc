# リリース手順（バージョンアップ）

このリポジトリは **Changesets** でバージョン管理し、**GitHub Packages**
(`https://npm.pkg.github.com`) へ公開する。スコープは所有者名に合わせて
`@gekal-study-nodejs` に統一している。

- 対象パッケージ: `@gekal-study-nodejs/core` / `@gekal-study-nodejs/utils` / `@gekal-study-nodejs/client`
- バージョニング方式: **独立バージョン**（パッケージごとに semver）
- パッケージ間参照: `workspace:^`（公開時に実バージョンへ自動変換）

> このドキュメントは **stable（`latest`）リリース**の手順。プレリリース
> （snapshot / rc）のバージョン対応と運用は [docs/PRERELEASE.md](PRERELEASE.md) を参照。

---

## TL;DR

開発者がやるのは **1〜2 のみ**。3 以降は GitHub Actions が自動化する。

1. コードを変更する
2. `pnpm changeset` で変更セットを追加し、PR を作って main にマージ
3. Release ワークフローが「Version Packages」PR を自動生成
4. その PR をマージ → GitHub Packages へ自動 publish

---

## bump レベルの決め方（semver）

1 つの変更につき changeset を 1 つ作る。影響するパッケージごとにレベルを選ぶ。

| レベル | 使う場面 | 例 |
|---|---|---|
| `patch` | 後方互換のバグ修正・内部改善 | 不具合修正、リファクタ |
| `minor` | 後方互換の機能追加 | 新しい関数・オプション追加 |
| `major` | 破壊的変更 | 関数削除・シグネチャ変更 |

---

## 手順（開発者が行う部分）

### 1. 変更セットを追加する

```bash
pnpm changeset
```

対話式で以下を選ぶ（→ `.changeset/<random-name>.md` が生成される）:

1. 変更したパッケージを選択（スペースで選択）
2. major / minor / patch を選択
3. 変更内容の要約を入力 … **この文がそのまま CHANGELOG に載る**

> 手で書く場合は `.changeset/` に次の形式の Markdown を置いてもよい:
>
> ```md
> ---
> "@gekal-study-nodejs/utils": patch
> ---
>
> Add `isBlank` helper to check for empty or whitespace-only strings.
> ```

### 2. コミットして PR を出す

```bash
git add -A
git commit -m "feat(utils): add isBlank helper"
# feature ブランチから main へ PR を作成しマージ
```

CI（`ci.yml`）が `lint → typecheck → test → build` を実行する。

---

## 手順（GitHub Actions が自動で行う部分）

### 3. 「Version Packages」PR が自動生成される

main に未消化の changeset がある状態で push されると、Release ワークフロー
(`release.yml`) の `changesets/action` が PR を自動作成/更新する。この PR には:

- 各 `package.json` の `version` 更新（例: `utils` 0.1.0 → 0.1.1）
- `CHANGELOG.md` の自動生成（changeset の要約から）
- 消費済み changeset ファイルの削除

が含まれる。**この時点ではまだ publish されない。**

### 4. Version PR をマージ → 公開

Version PR をマージすると Release ワークフローが再実行され、未消化 changeset が
無いため `pnpm release`（build → `changeset publish`）で GitHub Packages に公開される。

- 認証は `secrets.GITHUB_TOKEN`（`packages: write`）で完結。**追加 secret 不要。**
- `changeset publish` は冪等 — レジストリに未存在のバージョンのみ publish する。
- 公開物は `https://github.com/orgs/gekal-study-nodejs/packages` に表示される。

---

## 依存パッケージの連動（重要）

内部依存は `workspace:^` レンジのため、**依存先の bump レベルによって依存元が
連動するかが変わる**。

| 依存先(utils)の bump | レンジ `workspace:^0.1.0` を超えるか | 依存元(client)の再リリース |
|---|---|---|
| patch (0.1.0 → 0.1.1) | 超えない | **なし** |
| minor (0.1.0 → 0.2.0) | 超える | あり（client も bump） |
| major (0.1.0 → 1.0.0) | 超える | あり（client も bump） |

patch 上げでは依存元を再公開しなくても解決可能なので、Changesets は
`client` を bump しない。これは意図された挙動。

---

## ローカルで挙動を確認したいとき（任意）

publish はせず、バージョン計算と CHANGELOG 生成だけ試せる。

```bash
pnpm changeset status --verbose   # 上がる対象をプレビュー
pnpm changeset version            # package.json と CHANGELOG を更新（publish しない）
git restore . && git clean -fd    # 試したら元に戻す
```

> `changeset version` はローカルのファイルを書き換えるだけ。CI に任せる運用では
> 手元で実行する必要はない。

---

## 手動 publish（通常は不要）

CI を使わずローカルから公開する場合は、`write:packages` スコープ付きの
Personal Access Token が必要（`gh` の既定トークンには含まれない）。

```bash
# ~/.npmrc に認証を追加
//npm.pkg.github.com/:_authToken=<write:packages 付き PAT>

pnpm release   # build → changeset publish
```
