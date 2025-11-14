#!/bin/bash

# 完全自動開発スクリプト（GitHub Projects対応）
# Usage: ./auto-dev.sh [--dry-run]

set -e

# GitHub Project設定
PROJECT_NUMBER=1
PROJECT_OWNER="kawaka0001"

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🧪 DRY RUN モード"
fi

echo "🚀 将棋オンライン対戦 - 完全自動開発システム (GitHub Projects)"
echo "============================================================"

# mainブランチにいることを確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  mainブランチに切り替えてください（現在: $CURRENT_BRANCH）"
  exit 1
fi

# 最新の状態に更新
git pull origin main

while true; do
  echo ""
  echo "📋 次のタスクを確認中（GitHub Projects）..."

  # GitHub Projectsから"Todo"ステータスのタスクを取得
  PROJECT_ITEMS=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --limit 100)

  # "Todo"ステータスの最初のアイテムを取得
  TASK_JSON=$(echo "$PROJECT_ITEMS" | jq '.items[] | select(.status == "Todo") | .content' | jq -s '.[0]')

  # タスクが存在するかチェック
  if [ "$TASK_JSON" = "null" ] || [ -z "$TASK_JSON" ]; then
    echo "✅ すべてのタスクが完了しました！"
    break
  fi

  ISSUE_NUMBER=$(echo "$TASK_JSON" | jq -r '.number')
  ISSUE_TITLE=$(echo "$TASK_JSON" | jq -r '.title')
  ISSUE_BODY=$(echo "$TASK_JSON" | jq -r '.body')

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📌 Issue #$ISSUE_NUMBER: $ISSUE_TITLE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Claude Codeに渡すプロンプトを生成
  PROMPT="Issue #$ISSUE_NUMBER: $ISSUE_TITLE

$ISSUE_BODY

## 実装手順

1. feature/issue-$ISSUE_NUMBER ブランチを作成
2. 上記の要件を実装
3. テストを書いて実行
4. コードをcommit
5. PRを作成（タイトル: \"$ISSUE_TITLE\"）
6. 完了したら \"TASK_COMPLETE\" と出力

GitLab Flowに従って開発してください。
PR作成後、このスクリプトに制御を戻してください。"

  if [ "$DRY_RUN" = true ]; then
    echo "🧪 [DRY RUN] 以下のプロンプトでClaude Codeを起動:"
    echo "---"
    echo "$PROMPT"
    echo "---"
    echo ""
    echo "Enterキーで次のissueへ..."
    read
    continue
  fi

  # Claude Codeを起動（新しいセッション = クリーンなコンテキスト）
  echo "🤖 Claude Code起動中..."
  echo ""

  echo "$PROMPT" | claude

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Issue #$ISSUE_NUMBER の実装完了"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # PRのURLを取得
  PR_URL=$(gh pr list --head "feature/issue-$ISSUE_NUMBER" --json url --jq '.[0].url' 2>/dev/null || echo "")

  if [ -n "$PR_URL" ]; then
    echo "📝 PR: $PR_URL"
    echo ""
    echo "👀 PRをレビューしてください"
    echo ""
    echo "オプション:"
    echo "  1. PRを確認してマージ → Enterキー（次のissueへ）"
    echo "  2. 自動マージ → 'a' + Enter"
    echo "  3. スキップ → 's' + Enter"
    echo "  4. 終了 → 'q' + Enter"
    echo ""
    read -p "選択: " choice

    case $choice in
      a|A)
        echo "🔄 自動マージ中..."
        gh pr merge "$PR_URL" --merge --delete-branch
        git pull origin main
        gh issue close "$ISSUE_NUMBER" --comment "PR #$(gh pr view $PR_URL --json number --jq '.number') でマージ完了"
        echo "✅ マージ完了"
        echo "📊 GitHub Projectsのステータスは自動的に更新されます"
        ;;
      s|S)
        echo "⏭️  スキップ"
        ;;
      q|Q)
        echo "👋 終了"
        exit 0
        ;;
      *)
        echo "⏸️  手動確認モード。マージ完了後、Enterキーで続行..."
        read
        git pull origin main
        echo "📊 GitHub Projectsのステータスは自動的に更新されます"
        ;;
    esac
  else
    echo "⚠️  PRが見つかりません。手動で確認してください。"
    echo "Enterキーで続行..."
    read
  fi

  echo ""
  echo "🔄 次のタスクへ..."
  sleep 2
done

echo ""
echo "🎉 すべてのタスクが完了しました！"
