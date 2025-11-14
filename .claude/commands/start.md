次のissueを実装してください：

$(gh issue list --state open --json number,title,body,labels --limit 1 | \
  jq -r '.[0] | "## Issue #\(.number): \(.title)\n\n\(.body)\n\n**ラベル**: \(.labels | map(.name) | join(", "))"')

## 実装手順

1. feature branchを作成 (`feature/issue-{number}`)
2. 機能を実装
3. テストを書いて実行
4. commitしてPR作成
5. 完了したら "TASK_COMPLETE" と報告

**GitLab Flow に従って開発してください。**
