# Claude Code 自律開発ガイド

このドキュメントは、Claude Codeが自律的に開発を進めるためのガイドラインです。

## プロジェクト目標

オンライン対戦可能な将棋アプリケーションの開発

### MVP（最小限の遊べるバージョン）
1. ローカルで2人が対戦できる将棋
2. オンラインでリアルタイム対戦
3. AI対戦機能

## 開発原則

### 1. ドキュメント管理
- **仕様書 = GitHub Issue本文**
- リポジトリに `docs/` フォルダや仕様書mdファイルを作らない
- 調査結果・仕様詳細は全てissue本文に直接記述
- 他のissueから `#番号` で参照
- コード内コメントにもissue番号を記載（例: `// 詳細: #1`）

### 2. Issue駆動開発
- 1 issue = 1 feature branch = 1-2日の作業量
- Issue本文のDoDを完全に満たすまで完了としない
- 実装中に仕様が変わったらissue本文を更新
- 議論が必要な場合はissueコメントで行う

### 3. GitLab Flow
- `main`: 開発ブランチ
- `feature/issue-{number}`: 機能開発ブランチ
- `production`: 本番デプロイブランチ（後で作成）
- 全ての変更はPR経由

### 4. コード品質
- 必ずTypeScriptで型安全に実装
- `npm run build` が通ること
- `tsc --noEmit` でエラーがないこと
- レスポンシブデザイン必須

## 技術スタック

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui（必要に応じて導入）
- **State Management**: React Context → Zustand（将来的に）

### Backend & Database
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Authentication**: Supabase Auth

### AI対戦
- **Protocol**: USI (Universal Shogi Interface)
- **Engine**: YaneuraOu または 互換エンジン

## アーキテクチャ判断基準

### データ構造
- 盤面: 9x9の2次元配列
- 駒: 型定義で管理（`types/shogi.ts`）
- 状態管理: Context API → 必要に応じてZustand

### ファイル構成
```
app/              # Next.js App Router
├── page.tsx      # トップページ
├── game/         # ゲーム画面
└── api/          # API Routes

components/       # Reactコンポーネント
├── board/        # 盤面関連
├── piece/        # 駒関連
└── ui/           # 共通UIコンポーネント

lib/              # ビジネスロジック
├── game/         # ゲームロジック
│   ├── rules.ts      # ルール判定
│   ├── move.ts       # 移動処理
│   └── validation.ts # 合法手判定
└── utils/        # ユーティリティ

types/            # 型定義
└── shogi.ts      # 将棋関連の型
```

## Definition of Done (DoD)

全てのissueは以下を満たすまで完了としない：

- [ ] 機能が要件通りに動作する
- [ ] TypeScriptの型エラーがない（`tsc --noEmit`）
- [ ] ビルドが通る（`npm run build`）
- [ ] レスポンシブ対応（モバイル・タブレット・デスクトップ）
- [ ] issue本文のチェックリスト全てが完了
- [ ] PR作成済み
- [ ] コード内に関連issue番号を記載

## Issue更新の方法

調査結果や仕様詳細をissue本文に追記する場合：

```bash
gh issue edit <issue_number> --body "$(cat <<'EOF'
# Issue タイトル

## ✅ DoD
- [x] 完了した項目
- [ ] 未完了の項目

## 📝 詳細内容
調査結果や仕様をここに記述...

\`\`\`typescript
// コード例
\`\`\`
EOF
)"
```

または、issueコメントで追記：

```bash
gh issue comment <issue_number> --body "追加情報..."
```

## トラブルシューティング

### ビルドエラー
1. `npm run build` で確認
2. エラーメッセージを読んで修正
3. 型エラーは `tsc --noEmit` で確認

### 判断に迷った場合
1. issueコメントで質問を記録
2. CLAUDE.mdの原則に従う
3. シンプルな実装を優先

### 仕様が不明確な場合
1. issue本文を確認
2. 関連issue（特に #1 ルールリサーチ）を参照
3. 必要ならissueコメントで質問

## コミットメッセージ

日本語OK、以下の形式：

```
[動詞] 変更内容の要約

詳細説明（必要に応じて）

Refs #issue_number

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

例：
```
将棋盤コンポーネントを実装

9x9グリッドの盤面表示を実装。
Tailwind CSSでレスポンシブ対応。

Refs #3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 自律開発フロー

1. `auto-dev.sh` がGitHub Projectsから次のTodoタスクを取得
2. 新しいClaude Codeセッションで実装開始
3. Issue本文のDoDを確認
4. feature branchを作成
5. 実装 + テスト
6. commit & PR作成
7. 完了報告（"TASK_COMPLETE"）
8. 人間がPRレビュー・マージ
9. 次のタスクへ（新セッション）

## 参考リンク

- [GitHub Repository](https://github.com/kawaka0001/shogi-online)
- [GitHub Projects](https://github.com/users/kawaka0001/projects/1)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
