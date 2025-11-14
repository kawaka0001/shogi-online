次のタスクを実装してください（GitHub Projectsより）：

$(gh project item-list 1 --owner kawaka0001 --format json --limit 100 | \
  jq -r '.items[] | select(.status == "Todo") | .content | "## Issue #\(.number): \(.title)\n\n\(.body)\n\n**ラベル**: " + (.labels // [] | join(", "))' | head -n 30)

## 実装手順

1. feature branchを作成 (`feature/issue-{number}`)
2. 機能を実装
3. テストを書いて実行
4. commitしてPR作成
5. 完了したら "TASK_COMPLETE" と報告

**GitLab Flow に従って開発してください。**
**Issue完了時、GitHub Projectsのステータスは自動更新されます。**
