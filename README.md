# multi-package-poc

TypeScript 製マルチライブラリ（モノレポ）の PoC。

## スタック

- **pnpm workspaces** … パッケージ管理
- **Turborepo** … 依存グラフ順のタスク実行 + キャッシュ
- **tsup** … ESM ビルド + `.d.ts` 生成
- **Vitest** … テスト
- **Changesets** … 独立バージョニング & 公開
- **Biome** … Lint + Format（単一バイナリでリポジトリ全体を高速チェック）
- **GitHub Actions** … CI（lint/typecheck/test/build）+ Changesets 自動リリース

## パッケージ

| パッケージ | 役割 | 依存 |
|---|---|---|
| `@gekal-study-nodejs/core` | Result 型・基本エンティティ | なし |
| `@gekal-study-nodejs/utils` | JSON/ID などの共通ヘルパー | core |
| `@gekal-study-nodejs/client` | 上2つを合成した高レベル API | core, utils |

配布は **ESM-only**、パッケージ間参照は **ビルド済み参照（方式A / `exports` 経由）**。

## コマンド

```bash
pnpm install        # 依存インストール
pnpm build          # 依存順に全パッケージをビルド
pnpm test           # 全テスト
pnpm typecheck      # 型チェック
pnpm lint           # Biome で lint + format チェック（変更なし）
pnpm format         # Biome で自動修正（--write）
pnpm changeset      # 変更セットを追加（リリース準備）
pnpm release        # build → changeset publish
```

## 公開先: GitHub Packages

パッケージは **GitHub Packages**（`https://npm.pkg.github.com`）に公開する。
GitHub Packages はスコープ＝リポジトリ所有者名が必須のため、スコープは
`@gekal-study-nodejs` に統一している。

設定:

- ルート [`.npmrc`](.npmrc) … `@gekal-study-nodejs` スコープを GitHub Packages へルーティング
- 各 `package.json` … `publishConfig.registry` と `repository`（リポジトリ紐付け）
- 認証トークンはコミットしない（CI は `GITHUB_TOKEN`、ローカルは各自の `~/.npmrc`）

## CI / CD（GitHub Actions）

- `.github/workflows/ci.yml` … PR・push で `lint → typecheck → test → build` を実行
- `.github/workflows/release.yml` … main への push で Changesets が
  「Version Packages」PR を自動生成 / 未消化 changeset が無ければ GitHub Packages へ publish
  - 認証は `secrets.GITHUB_TOKEN`（`packages: write` 権限）で完結し、**追加 secret 不要**

## リリースフロー

1. PR で `pnpm changeset` を実行し semver レベルを記録
2. main マージで Changesets が "Version Packages" PR を自動生成
3. その PR をマージ → 変更のあったパッケージのみ GitHub Packages へ publish

> 詳細な手順は [docs/RELEASING.md](docs/RELEASING.md) を参照。

## 利用側（consumer）のセットアップ

これらのパッケージを別プロジェクトから利用する場合、プロジェクトの `.npmrc` に:

```
@gekal-study-nodejs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`read:packages` スコープを持つ Personal Access Token を `NODE_AUTH_TOKEN` に設定して
`pnpm add @gekal-study-nodejs/client` などでインストールする。
