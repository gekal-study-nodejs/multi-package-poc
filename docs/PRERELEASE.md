# ブランチ昇格モデルと公開チャネル（snapshot / rc / stable）

このリポジトリは **ブランチ = 公開チャネル**の 3 段昇格モデルでリリースする。
同じ変更を **snapshot → rc → stable** の順で公開しながら、`develop → main → release`
へマージで昇格させていく。

```
feature ─▶ develop ─▶ main ─▶ release
            (始点)    (昇格)   (昇格)
             │         │         │
          snapshot     rc      stable
```

stable の詳細手順は [docs/RELEASING.md](RELEASING.md) を参照。

---

## チャネル対応表

| ブランチ | チャネル | version 形式 | dist-tag | トリガー | changeset 消費 | 消費側 install |
|---|---|---|---|---|---|---|
| `develop` | **snapshot** | `X.Y.Z-snapshot-<sha>` | `snapshot` | `develop` への push | しない（使い捨て） | `pnpm add <pkg>@<version>` |
| `main` | **rc** | `X.Y.Z-rc-<sha>` | `rc` | `main` への push | しない（使い捨て） | `pnpm add <pkg>@rc` |
| `release` | **stable** | `X.Y.Z` | `latest` | `release` への push（Version PR 経由） | **する** | `pnpm add <pkg>` |

- `<pkg>` は `@gekal-study-nodejs/core` / `utils` / `client`。消費側 `.npmrc` は
  [README](../README.md#利用側consumerのセットアップ) を参照。
- `X.Y.Z` は未消化 changeset から**計算した次期版**（[.changeset/config.json](../.changeset/config.json)
  の `snapshot.useCalculatedVersion: true`）。**snapshot / rc / stable で同じ `X.Y.Z` を共有し、
  接尾辞（`-snapshot-<sha>` / `-rc-<sha>` / なし）だけが進む**のが本モデルの肝。
- `<sha>` は publish 時のフル commit SHA（`prereleaseTemplate: "{tag}-{commit}"`）。
- dist-tag が分かれているので **stable 利用者（`latest`）は snapshot/rc の影響を受けない**。

---

## なぜ pre モードではなく snapshot 方式の rc か

changesets の pre モード（`X.Y.Z-rc.0/.1`）は状態ファイル `.changeset/pre.json` を
リポジトリに commit するため、`develop / main / release` の 3 ブランチ間で
このファイルが競合・伝播し、昇格マージのたびに enter/exit 調整が必要になり破綻しやすい。

本モデルでは代わりに **`changeset version --snapshot <tag>`**（使い捨て）を使い、
rc も snapshot と同じ「計算済み版 + sha」で発行する。これにより:

- `pre.json` を一切持たない → ブランチ間の競合ゼロ。
- **changeset の消費（実バージョン確定）は release ブランチで一度だけ**。develop / main は
  changeset を読むだけで消さない（マージで release まで運ばれる）。

---

## 運用フロー

### 1. 変更を develop に入れる（snapshot 発行）

1. feature ブランチで実装し、`pnpm changeset` で changeset を追加。
2. `develop` に PR → マージ。
3. push を受けて [snapshot.yml](../.github/workflows/snapshot.yml) が
   `X.Y.Z-snapshot-<sha>` を `snapshot` タグへ公開（Job Summary に install 例）。

### 2. develop → main へ昇格（rc 発行）

1. `develop` を `main` にマージ（changeset ファイルも一緒に運ばれる）。
2. push を受けて [rc.yml](../.github/workflows/rc.yml) が
   `X.Y.Z-rc-<sha>` を `rc` タグへ公開。

### 3. main → release へ昇格（stable 公開）

1. `main` を `release` にマージ。
2. [release.yml](../.github/workflows/release.yml) の `changesets/action` が
   **「Version Packages」PR** を `release` 向けに作成（`package.json` の版を `X.Y.Z` に確定、
   CHANGELOG 生成、changeset ファイル削除）。
3. その Version PR をマージ → stable を `latest` タグで公開。
4. **back-merge**: 確定した版 bump / CHANGELOG / changeset 削除を `release → develop`
   （必要に応じて `main`）へ反映し、次サイクルの計算基準を揃える。

> **前提**: snapshot / rc は未消化 changeset が 1 つ以上あるときのみ公開される
> （無ければ各ワークフローは no-op）。

---

## 初期セットアップ

`develop` と `release` ブランチを作成しておく（`main` は既存）。

```bash
git switch -c develop && git push -u origin develop
git switch -c release && git push -u origin release
git switch develop
```

ブランチ保護を敷く場合は、各チャネルの publish が `secrets.GITHUB_TOKEN`
（`packages: write`）で動くこと、release の Version PR マージが必要なことに留意。

---

## ローカル検証（publish しない）

```bash
# snapshot 版の計算結果を確認
pnpm changeset version --snapshot snapshot   # 0.0.0 ではなく X.Y.Z-snapshot-<sha>
git restore packages && git clean -fd .changeset  # 元に戻す（config は消さない）

# rc 版の計算結果を確認
pnpm changeset version --snapshot rc          # X.Y.Z-rc-<sha>
git restore packages && git clean -fd .changeset
```

> `git restore .`（全体）は禁物 — 設定ファイルの編集ごと戻ってしまう。`packages` のみ戻す。
