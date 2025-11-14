プロジェクトの現状:

**ブランチ**: $(git branch --show-current)

**最近のコミット**:
$(git log -3 --oneline --decorate)

**GitHub Projects ステータス**:
$(gh project item-list 1 --owner kawaka0001 --format json --limit 100 | \
  jq -r 'group_by(.status) | .[] | "\(.[] | .status | select(. != null)): \(length)件"' | sort -u)

**Todoタスク**:
$(gh project item-list 1 --owner kawaka0001 --format json --limit 100 | \
  jq -r '.items[] | select(.status == "Todo") | "- #\(.content.number): \(.content.title)"')

**最近のPR**:
$(gh pr list --state all --limit 3 --json number,title,state | jq -r '.[] | "- #\(.number): \(.title) [\(.state)]"')
