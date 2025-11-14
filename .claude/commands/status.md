プロジェクトの現状:

**ブランチ**: $(git branch --show-current)

**最近のコミット**:
$(git log -3 --oneline --decorate)

**未完了のissue**:
$(gh issue list --state open --json number,title | jq -r '.[] | "- #\(.number): \(.title)"')

**最近のPR**:
$(gh pr list --state all --limit 3 --json number,title,state | jq -r '.[] | "- #\(.number): \(.title) [\(.state)]"')
