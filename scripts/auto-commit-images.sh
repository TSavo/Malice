#!/bin/bash
# Auto-commit and push image generation progress periodically
# Usage: nohup ./scripts/auto-commit-images.sh > auto-commit.log 2>&1 &

INTERVAL=${1:-1800}  # Default: 30 minutes

echo "Starting auto-commit loop (interval: ${INTERVAL}s)"

while true; do
    sleep $INTERVAL

    # Count new images
    NEW_COUNT=$(git status --short assets/images/*.png 2>/dev/null | wc -l)
    TOTAL_COUNT=$(ls -1 assets/images/*.png 2>/dev/null | wc -l)

    if [ "$NEW_COUNT" -gt 0 ]; then
        echo "$(date): Found $NEW_COUNT new/modified images ($TOTAL_COUNT total)"

        # Stage all changes
        git add -A

        # Commit with progress
        git commit -m "**Progress:** $TOTAL_COUNT images generated (~$((TOTAL_COUNT * 100 / 2700))% of ~2700 rooms)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

        # Push
        git push

        echo "$(date): Committed and pushed $NEW_COUNT changes"
    else
        echo "$(date): No new images to commit ($TOTAL_COUNT total)"
    fi
done
