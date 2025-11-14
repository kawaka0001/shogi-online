# 将棋オンライン対戦

オンラインで将棋を対戦できるアプリケーション（完全自動開発実験プロジェクト）

## 🤖 完全自動開発システム

このプロジェクトはClaude Codeを使った完全自動開発の実験です。

### 使い方

```bash
# 自動開発ループを開始
./auto-dev.sh

# ドライランモード（実行せずに確認）
./auto-dev.sh --dry-run
```

### ワークフロー

1. **Issue作成**: GitHub Issuesでタスクを管理
2. **自動実装**: `auto-dev.sh`が自動的に次のissueを取得し、Claude Codeに実装指示
3. **新セッション**: 各issue毎に新しいClaude Codeセッション = クリーンなコンテキスト
4. **PR作成**: 実装完了後、自動的にPR作成
5. **レビュー**: 人間がPRをレビュー・マージ
6. **ループ**: 次のissueへ自動的に進む

### Claude Code Slash Commands

- `/start` - 次のissueを実装開始
- `/next` - 次の3つのissueを表示
- `/status` - プロジェクトの現状確認

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

- `main`: 開発ブランチ
- `feature/issue-{number}`: 機能開発ブランチ
- `production`: 本番デプロイブランチ（後で作成）

## リポジトリ

https://github.com/kawaka0001/shogi-online
