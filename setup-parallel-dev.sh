#!/bin/bash

# 並列開発環境セットアップスクリプト
# Usage: ./setup-parallel-dev.sh

set -e

echo "🚀 並列開発環境をセットアップします"
echo "============================================================"

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
  echo "⚠️  developmentブランチに切り替えてください（現在: $CURRENT_BRANCH）"
  exit 1
fi

# 最新の状態に更新
echo "📥 最新の状態に更新中..."
git pull origin development

# 並列開発するIssue番号
ISSUES=(6 8 9 10)

echo ""
echo "📋 以下のIssueで並列開発環境を作成します:"
for issue in "${ISSUES[@]}"; do
  echo "  - Issue #$issue"
done

echo ""
read -p "続行しますか？ (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "キャンセルしました"
  exit 0
fi

echo ""
echo "🔨 worktreeを作成中..."

for issue in "${ISSUES[@]}"; do
  WORKTREE_PATH="../shogi-issue-$issue"
  BRANCH_NAME="feature/issue-$issue"

  # 既存のworktreeがある場合はスキップ
  if [ -d "$WORKTREE_PATH" ]; then
    echo "⚠️  $WORKTREE_PATH は既に存在します（スキップ）"
    continue
  fi

  # worktree作成
  echo "  ✓ Creating $BRANCH_NAME at $WORKTREE_PATH"
  git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" origin/development
done

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "📁 作成されたworktree:"
git worktree list

echo ""
echo "🎯 次のステップ:"
echo ""
echo "各ディレクトリで別々のターミナルセッションを開いてください:"
echo ""
for issue in "${ISSUES[@]}"; do
  echo "  # Terminal $issue"
  echo "  cd ../shogi-issue-$issue && claude"
  echo ""
done

echo "詳細: CLAUDE.md の「並列開発フロー」セクションを参照"
