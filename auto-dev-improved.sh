#!/bin/bash

# 完全自動開発スクリプト（改善版 - コミット履歴とDoD自動チェック対応）
# Usage: ./auto-dev-improved.sh [--dry-run]

set -e

# GitHub Project設定
PROJECT_NUMBER=1
PROJECT_OWNER="kawaka0001"

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🧪 DRY RUN モード"
fi

echo "🚀 将棋オンライン対戦 - 完全自動開発システム v2.0"
echo "============================================================"

# developmentブランチにいることを確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
  echo "⚠️  developmentブランチに切り替えてください（現在: $CURRENT_BRANCH）"
  exit 1
fi

# 最新の状態に更新
git pull origin development

# ========================================
# 新機能: コミット履歴からマージ済みIssueを検出
# ========================================
get_merged_issues() {
  # 過去100件のコミットから "Merge pull request #X from .../feature/issue-Y" を抽出
  git log --oneline --grep="Merge pull request" --all -100 | \
    grep -oE "feature/issue-[0-9]+" | \
    sed 's/feature\/issue-//' | \
    sort -u
}

# ========================================
# 新機能: Issue完了の自動検証（DoD Check）
# ========================================
check_issue_completion() {
  local issue_number=$1

  echo "🔍 Issue #$issue_number の完了状態を確認中..."

  # 1. ビルドチェック
  if ! npm run build > /dev/null 2>&1; then
    echo "   ❌ ビルド失敗"
    return 1
  fi
  echo "   ✅ ビルド成功"

  # 2. 型チェック
  if ! npx tsc --noEmit > /dev/null 2>&1; then
    echo "   ❌ 型エラーあり"
    return 1
  fi
  echo "   ✅ 型エラーなし"

  # 3. コミット履歴チェック
  if git log --oneline --all -50 | grep -q "issue-$issue_number"; then
    echo "   ✅ コミット履歴に実装あり"
  else
    echo "   ⚠️  コミット履歴に該当なし（新規タスクの可能性）"
  fi

  return 0
}

# ========================================
# 新機能: Issue自動Close（PRがマージ済みの場合）
# ========================================
auto_close_merged_issues() {
  echo ""
  echo "📊 マージ済みIssueの自動Close処理..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local merged_issues=$(get_merged_issues)

  for issue_num in $merged_issues; do
    # Issueの状態を確認
    local issue_state=$(gh issue view "$issue_num" --json state --jq '.state' 2>/dev/null || echo "NOT_FOUND")

    if [ "$issue_state" = "OPEN" ]; then
      echo ""
      echo "🔄 Issue #$issue_num: マージ済みだが未Close → 自動Close実行"

      if [ "$DRY_RUN" = false ]; then
        gh issue close "$issue_num" --comment "✅ PR がマージ済みのため自動的にCloseしました。

実装完了を確認:
- コミット履歴にマージ記録あり
- ビルド成功
- 型エラーなし

🤖 Auto-closed by auto-dev-improved.sh"

        echo "   ✅ Issue #$issue_num をClose"
      else
        echo "   🧪 [DRY RUN] Issue #$issue_num をCloseするはずです"
      fi
    elif [ "$issue_state" = "CLOSED" ]; then
      echo "✓ Issue #$issue_num: 既にClose済み"
    fi
  done

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# マージ済みIssueの自動Close処理を実行
auto_close_merged_issues

# ========================================
# メインループ
# ========================================
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

  # ========================================
  # 新機能: 既存実装チェック
  # ========================================
  if get_merged_issues | grep -q "^$ISSUE_NUMBER$"; then
    echo "⚠️  このIssueは既にマージ済みです！"
    echo "   スキップして次のタスクへ進みます。"
    echo ""
    echo "   オプション:"
    echo "     1. 自動Close → 'c' + Enter"
    echo "     2. スキップ → Enter"
    echo "     3. 強制実行 → 'f' + Enter"
    read -p "選択: " choice

    case $choice in
      c|C)
        if [ "$DRY_RUN" = false ]; then
          gh issue close "$ISSUE_NUMBER" --comment "✅ 既にマージ済みのため手動でCloseしました。"
          echo "✅ Issue #$ISSUE_NUMBER をClose"
        fi
        continue
        ;;
      f|F)
        echo "⚡ 強制実行モード"
        ;;
      *)
        echo "⏭️  スキップ"
        continue
        ;;
    esac
  fi

  # Claude Codeに渡すプロンプトを生成
  PROMPT="Issue #$ISSUE_NUMBER: $ISSUE_TITLE

$ISSUE_BODY

## 実装手順

1. feature/issue-$ISSUE_NUMBER ブランチを作成
2. 上記の要件を実装
3. テストを書いて実行
4. コードをcommit
5. PRを作成（タイトル: \"$ISSUE_TITLE\"）
6. **PR本文に必ず「Closes #$ISSUE_NUMBER」を含める**（重要！）
7. 完了したら \"TASK_COMPLETE\" と出力

## 重要
- PRには必ず「Closes #$ISSUE_NUMBER」を含める
- GitLab Flowに従って development ブランチに向けてPRを作成
- ビルド成功・型エラーなしを確認してからPR作成

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

  # Claude Codeを起動
  echo "🤖 Claude Code起動中..."
  echo ""

  echo "$PROMPT" | claude

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Issue #$ISSUE_NUMBER の実装完了"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # ========================================
  # 新機能: DoD自動チェック
  # ========================================
  if check_issue_completion "$ISSUE_NUMBER"; then
    echo ""
    echo "✅ DoD（受け入れ条件）チェック: 合格"
  else
    echo ""
    echo "⚠️  DoD（受け入れ条件）チェック: 不合格"
    echo "   継続しますか？ (y/N)"
    read -p "選択: " continue_choice
    if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
      echo "中断しました"
      exit 1
    fi
  fi

  # PRのURLを取得
  PR_URL=$(gh pr list --head "feature/issue-$ISSUE_NUMBER" --json url,number --jq '.[0]' 2>/dev/null || echo "")

  if [ -n "$PR_URL" ]; then
    PR_NUMBER=$(echo "$PR_URL" | jq -r '.number')
    PR_LINK=$(echo "$PR_URL" | jq -r '.url')

    echo "📝 PR: $PR_LINK"
    echo ""

    # ========================================
    # 新機能: PR本文に "Closes #X" があるか確認
    # ========================================
    PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body')
    if echo "$PR_BODY" | grep -qi "closes #$ISSUE_NUMBER"; then
      echo "✅ PR本文に「Closes #$ISSUE_NUMBER」を確認"
    else
      echo "⚠️  警告: PR本文に「Closes #$ISSUE_NUMBER」が見つかりません"
      echo "   developmentブランチへのマージではIssueが自動Closeされません"
      echo "   後で手動でCloseする必要があります"
    fi

    echo ""
    echo "オプション:"
    echo "  1. 自動マージを待つ → Enterキー（推奨）"
    echo "  2. 今すぐマージ → 'm' + Enter"
    echo "  3. Issue手動Close → 'c' + Enter（マージ後推奨）"
    echo "  4. スキップ → 's' + Enter"
    echo "  5. 終了 → 'q' + Enter"
    echo ""
    read -p "選択: " choice

    case $choice in
      m|M)
        echo "🔄 即座にマージ中..."
        gh pr merge "$PR_NUMBER" --merge --delete-branch
        git pull origin development
        echo "✅ マージ完了"

        # マージ後にIssueを手動Close
        echo "🔄 Issue #$ISSUE_NUMBER を手動でClose中..."
        gh issue close "$ISSUE_NUMBER" --comment "✅ PR #$PR_NUMBER がマージされました。

🤖 Auto-closed by auto-dev-improved.sh"
        echo "✅ Issue #$ISSUE_NUMBER をClose"
        ;;
      c|C)
        echo "🔄 Issue #$ISSUE_NUMBER を手動でClose中..."
        gh issue close "$ISSUE_NUMBER" --comment "✅ PR #$PR_NUMBER の実装完了により手動でCloseしました。"
        echo "✅ Issue #$ISSUE_NUMBER をClose"
        ;;
      s|S)
        echo "⏭️  スキップ"
        ;;
      q|Q)
        echo "👋 終了"
        exit 0
        ;;
      *)
        echo "⏳ 自動マージを待機中..."
        echo "   ⚠️  developmentブランチへのマージではIssueが自動Closeされません"
        echo "   マージ完了後、手動でIssueをCloseしてください"
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
