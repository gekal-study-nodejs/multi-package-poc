# プレリリース運用（snapshot / rc）

このリポジトリは stable（正式版）に加えて、**snapshot**（使い捨て検証版）と
**rc**（リリース候補）の 2 系統のプレリリースを扱う。いずれも **GitHub Packages**
(`https://npm.pkg.github.com`) へ、それぞれ別の **dist-tag** で公開する。

stable の通常フローは [docs/RELEASING.md](RELEASING.md) を参照。

---

## 3 系統の対応表

| 種別 | 用途 | version 形式 | dist-tag | トリガー | 履歴に残る | 消費側 install |
|---|---|---|---|---|---|---|
| **stable** | 正式リリース | `X.Y.Z` | `latest` | Version PR merge | ✓ | `pnpm add <pkg>` |
| **rc** | リリース候補 | `X.Y.Z-rc.N` | `rc` | pre モード中の Version PR merge | ✓ | `pnpm add <pkg>@rc` |
| **snapshot** | 使い捨て検証 | `0.0.0-snapshot-<sha>` | `snapshot` | PR に `publish-snapshot` ラベル / 手動実行 | ✗（git tag なし） | `pnpm add <pkg>@<version>` |

> `<pkg>` は `@gekal-study-nodejs/core` / `utils` / `client`。
> 消費側 `.npmrc` の設定は [README](../README.md#利用側consumerのセットアップ) を参照。

dist-tag が分かれているので、**stable 利用者は `latest` のまま影響を受けない**。
rc/snapshot は明示的にタグ/バージョンを指定した人だけが取得する。

---

## rc（リリース候補）

`X.Y.Z-rc.0`, `rc.1` … と番号を進めながら正式版前の検証を回す方式。
Changesets の **pre モード**を使う。pre モード中は `release.yml` がそのまま
rc バージョンの Version PR を作り、`changeset publish` が自動で dist-tag `rc`
へ公開する（`@changesets/cli` が pre 状態のときは `preState.tag` を dist-tag に使う）。

### ライフサイクル

```
pre enter rc  ──▶  changeset を消化する Version PR を merge  ──▶  X.Y.Z-rc.0
                     （さらに changeset を足して merge）      ──▶  X.Y.Z-rc.1 …
              ──▶  pre exit  ──▶  次の Version PR merge       ──▶  X.Y.Z（stable / latest）
```

### 操作（GitHub Actions）

1. **pre モードに入る**: Actions → **Pre-release Mode** ワークフローを
   `action: enter` / `tag: rc` で実行。`.changeset/pre.json` が main にコミットされる。
2. **rc を進める**: 通常どおり changeset 付き PR を main にマージする。`release.yml` が
   `X.Y.Z-rc.N` の Version PR を生成 → その PR をマージで `rc` タグへ publish。
3. **pre モードを抜ける**: 検証が済んだら **Pre-release Mode** を `action: exit` で実行。
   以降の Version PR は通常の stable（`latest`）に戻る。

> **補足**: `enter`/`exit` は `GITHUB_TOKEN` で main に直接 push する。ブランチ保護を
> 有効化している場合は github-actions bot の push を許可すること。`GITHUB_TOKEN` の
> push は他ワークフローを再起動しないため、pre モードは「状態の切り替え」だけを行い、
> 実際の rc 生成は次の通常マージが `release.yml` を pre モードで走らせて行う。

### ローカルで pre モードを操作する場合（任意）

```bash
pnpm pre:enter        # = changeset pre enter rc
# ... changeset を追加 ...
pnpm changeset version   # X.Y.Z-rc.N を確認（publish はしない）
pnpm pre:exit         # = changeset pre exit
```

---

## snapshot（使い捨て検証版）

PR 段階で「このコミットそのもの」を実バージョンとしてインストールして試すための、
履歴に残さない一時公開。バージョンは `0.0.0-snapshot-<コミットSHA>`
（[.changeset/config.json](../.changeset/config.json) の `snapshot.prereleaseTemplate` =
`{tag}-{commit}`。`{commit}` はフルの commit SHA）。

### 発行のしかた

- **PR ラベル**: PR に `publish-snapshot` ラベルを付ける。付与時、および以降の push
  ごとに [snapshot.yml](../.github/workflows/snapshot.yml) が実行され、snapshot を公開。
  公開後、PR に install 手順のコメントが付く。
- **手動**: Actions → **Snapshot** ワークフローを任意のブランチで `workflow_dispatch`。

> **前提**: PR に changeset が 1 つ以上あること。無いと bump 対象が無く、何も公開されない。
> snapshot 版が付くのは changeset を持つパッケージのみ。

### インストール（消費側）

```bash
pnpm add @gekal-study-nodejs/client@0.0.0-snapshot-<sha>
```

`snapshot` dist-tag からも取得できるが、複数コミットで上書きされるため
**再現性が必要なら exact バージョン指定**を推奨。

---

## ローカル検証（publish しない）

```bash
# snapshot 版のバージョン計算だけ試す
pnpm changeset version --snapshot snapshot   # package.json が 0.0.0-snapshot-<sha> になる
git restore . && git clean -fd               # 元に戻す

# rc 版のバージョン計算だけ試す
pnpm pre:enter && pnpm changeset version      # X.Y.Z-rc.0 を確認
git restore . && git clean -fd                # pre.json ごと戻す
```
