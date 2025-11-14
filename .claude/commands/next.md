次のタスクを表示:

$(gh issue list --state open --json number,title,labels --limit 3 | \
  jq -r '.[] | "- Issue #\(.number): \(.title) [\(.labels | map(.name) | join(", "))]"')
