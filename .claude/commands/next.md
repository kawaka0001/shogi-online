次のタスクを表示（GitHub Projects - Todoステータス）:

$(gh project item-list 1 --owner kawaka0001 --format json --limit 100 | \
  jq -r '.items[] | select(.status == "Todo") | "- Issue #\(.content.number): \(.content.title) [\(.labels | join(", "))]"' | head -5)
