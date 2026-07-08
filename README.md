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
pnpm release        # build → changeset publish（stable / latest）
pnpm version:snapshot   # X.Y.Z-snapshot-<sha> にバージョン（publish しない）
pnpm release:snapshot   # build → snapshot タグで publish
pnpm version:rc         # X.Y.Z-rc-<sha> にバージョン（publish しない）
pnpm release:rc         # build → rc タグで publish
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

**ブランチ = 公開チャネル**の 3 段昇格モデル。`develop → main → release` へマージで
昇格しながら、同じ変更を **snapshot → rc → stable** の順で公開する。

| ブランチ | チャネル | version | dist-tag | ワークフロー |
|---|---|---|---|---|
| `develop` | snapshot | `X.Y.Z-snapshot-<sha>` | `snapshot` | `snapshot.yml` |
| `main` | rc | `X.Y.Z-rc-<sha>` | `rc` | `rc.yml` |
| `release` | stable | `X.Y.Z` | `latest` | `release.yml` |

- `.github/workflows/ci.yml` … `develop/main/release` の PR・push で `lint → typecheck → test → build`
- `.github/workflows/release-preview.yml` … PR に「リリース予定バージョン」を sticky コメント（`changeset status` で非破壊算出）
- `.github/workflows/snapshot.yml` … `develop` への push で snapshot を公開（使い捨て）
- `.github/workflows/rc.yml` … `main` への push で rc を公開（使い捨て）
- `.github/workflows/release.yml` … `release` への push で「Version Packages」PR を生成し、
  マージで stable を公開（ここで初めて changeset を消費し `X.Y.Z` を確定）
- 認証はいずれも `secrets.GITHUB_TOKEN`（`packages: write`）で完結し、**追加 secret 不要**

昇格モデルとバージョン対応の詳細は [docs/PRERELEASE.md](docs/PRERELEASE.md) を参照。

## リリースフロー

1. feature ブランチで `pnpm changeset` を実行し semver レベルを記録 → `develop` にマージ（snapshot 公開）
2. `develop → main` へ昇格マージ（rc 公開）
3. `main → release` へ昇格マージ → 「Version Packages」PR をマージで stable 公開
4. 確定した版 bump / CHANGELOG を `release → develop` へ back-merge

> 詳細な手順は [docs/RELEASING.md](docs/RELEASING.md) を参照。

## 利用側（consumer）のセットアップ

これらのパッケージを別プロジェクトから利用する場合、プロジェクトの `.npmrc` に:

```
@gekal-study-nodejs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`read:packages` スコープを持つ Personal Access Token を `NODE_AUTH_TOKEN` に設定して
`pnpm add @gekal-study-nodejs/client` などでインストールする。

- stable: `pnpm add @gekal-study-nodejs/client`（`latest`）
- rc: `pnpm add @gekal-study-nodejs/client@rc`
- snapshot: `pnpm add @gekal-study-nodejs/client@<X.Y.Z-snapshot-\<sha\>>`（再現性のため exact 指定推奨）
