#!/bin/bash

# 並列開発環境クリーンアップスクリプト
# Usage: ./cleanup-parallel-dev.sh

set -e

echo "🧹 並列開発環境をクリーンアップします"
echo "============================================================"

# worktree一覧表示
echo "📋 現在のworktree:"
git worktree list

echo ""
echo "⚠️  以下のworktreeを削除します:"

# 削除対象のworktree
WORKTREES=(
  "../shogi-issue-6"
  "../shogi-issue-8"
  "../shogi-issue-9"
  "../shogi-issue-10"
)

for worktree in "${WORKTREES[@]}"; do
  if [ -d "$worktree" ]; then
    echo "  - $worktree"
  fi
done

echo ""
read -p "続行しますか？ (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "キャンセルしました"
  exit 0
fi

echo ""
echo "🗑️  worktreeを削除中..."

for worktree in "${WORKTREES[@]}"; do
  if [ -d "$worktree" ]; then
    echo "  ✓ Removing $worktree"
    git worktree remove "$worktree"
  else
    echo "  ⚠️  $worktree は存在しません（スキップ）"
  fi
done

# 不要なworktree参照をクリーンアップ
echo ""
echo "🧹 不要なworktree参照をクリーンアップ中..."
git worktree prune

echo ""
echo "✅ クリーンアップ完了！"
echo ""
echo "📁 残っているworktree:"
git worktree list
