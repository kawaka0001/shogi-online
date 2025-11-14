# 将棋オンライン対戦

オンラインで将棋を対戦できるアプリケーション（完全自動開発実験プロジェクト）

## 🤖 完全自動開発システム

このプロジェクトはClaude Code + GitHub Actionsを使った自動開発の実験です。

### 使い方

```bash
# 自動開発ループを開始
./auto-dev.sh

# ドライランモード（実行せずに確認）
./auto-dev.sh --dry-run
```

### ワークフロー（ほぼ完全自動）

1. **Issue管理**: GitHub Projects でタスク管理（24件のissue）
2. **自動実装**: `auto-dev.sh` が次のTodoタスクを取得し、Claude Codeに実装指示
3. **新セッション**: 各issue毎に新しいClaude Codeセッション = クリーンなコンテキスト
4. **PR作成**: 実装完了後、自動的にPR作成
5. **自動レビュー**: GitHub Actionsが品質チェック（ビルド・型チェック・Lint）
6. **自動マージ**: チェック成功 → 自動承認 → 自動マージ
7. **ループ**: 次のissueへ自動的に進む

### あなたがすること

**最小限の操作:**
- `./auto-dev.sh` を実行
- 各issue完了後、Enterキーを押すだけ（自動マージを待機）
- 問題があれば手動介入

**完全放置は不可:** 各issue完了ごとにEnterキー押下が必要です。

### Claude Code Slash Commands

- `/start` - 次のissueを実装開始
- `/next` - 次の5つのTodoタスクを表示
- `/status` - プロジェクトの現状確認（GitHub Projects連携）

### GitHub Actions（自動化）

- **自動レビュー**: PR作成時に品質チェック実行
- **自動マージ**: チェック成功 → 自動承認 → 自動マージ
- **通知**: マージ完了後、次のタスクを通知

詳細: `.github/workflows/`

## 技術スタック

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **リアルタイム対戦**: Supabase Realtime (予定)
- **AI対戦**: 将棋エンジン連携 (予定)
- **認証**: Supabase Auth (予定)

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト
npm test
```

## GitLab Flow

- `main`: 本番環境（デプロイ用）
- `development`: 開発統合ブランチ
- `feature/issue-{number}`: 機能開発ブランチ

開発フロー:
```
feature/issue-N → (PR) → development → (リリース時PR) → main
```

## リポジトリ

https://github.com/kawaka0001/shogi-online
