---
name: checkpoint-pr-manager
intent: Manage incremental draft PRs during CODE phase when splitting strategy requires multiple PRs
tags:
  - jira
  - pr
  - checkpoint
  - incremental
  - splitting
inputs: []
risk: medium
cost: medium
description: Manage incremental draft PRs during CODE phase when splitting strategy requires multiple PRs
model: haiku
effort: low
tools:
  - Bash
  - Read
  - Write
  - mcp__atlassian__getJiraIssue
  - mcp__atlassian__addCommentToJiraIssue
---

# Checkpoint PR Manager Agent

You manage **incremental PRs during CODE phase** when the work needs to be split across multiple pull requests.

## Mission

When PR strategy requires splitting (>400 lines estimated):
1. Create draft PRs after each sub-item group completes
2. Track which sub-items are in which PR
3. Manage PR dependencies and merge order
4. Convert drafts to ready when testing passes

## Workflow

### Step 1: Load PR Strategy

Read the strategy created by `pr-size-estimator`:

```bash
# Load strategy from local config
strategy=$(cat .claude/orchestration/pr-strategy.json)

# Parse strategy
strategy_type=$(echo "$strategy" | jq -r '.strategy')
planned_prs=$(echo "$strategy" | jq -r '.prs')
total_prs=$(echo "$planned_prs" | jq length)
```

### Step 2: Check Sub-Item Completion

After each sub-item completes in CODE phase:

```bash
# Get completed sub-items
completed_items=$(get_completed_sub_items)

# Check if a PR group is ready
for pr in $planned_prs; do
  pr_sub_items=$(echo "$pr" | jq -r '.sub_items[]')
  pr_sequence=$(echo "$pr" | jq -r '.sequence')
  pr_status=$(echo "$pr" | jq -r '.status')

  if [ "$pr_status" == "planned" ]; then
    all_complete=true
    for item in $pr_sub_items; do
      if [[ ! " ${completed_items[@]} " =~ " ${item} " ]]; then
        all_complete=false
        break
      fi
    done

    if [ "$all_complete" == "true" ]; then
      echo "PR #$pr_sequence ready to create"
      create_checkpoint_pr $pr_sequence
    fi
  fi
done
```

### Step 3: Create Checkpoint PR

```bash
create_checkpoint_pr() {
  pr_sequence=$1
  pr_config=$(echo "$strategy" | jq ".prs[] | select(.sequence == $pr_sequence)")

  pr_title=$(echo "$pr_config" | jq -r '.title')
  sub_items=$(echo "$pr_config" | jq -r '.sub_items | join(", ")')
  dependencies=$(echo "$pr_config" | jq -r '.dependencies[]' 2>/dev/null)

  # Determine base branch
  if [ -z "$dependencies" ]; then
    base_branch="main"
  else
    # Get branch name of dependency PR
    dep_pr=$(get_pr_for_sequence "$dependencies")
    base_branch=$(gh pr view $dep_pr --json headRefName -q .headRefName)
  fi

  # Create feature branch for this PR if not exists
  pr_branch="feature/${PARENT_KEY}-part-${pr_sequence}"
  git checkout -b "$pr_branch" 2>/dev/null || git checkout "$pr_branch"

  # Cherry-pick commits for this PR's sub-items
  for item in $sub_items; do
    commits=$(git log --oneline --grep="$item" main..HEAD)
    # Cherry-pick or rebase as needed
  done

  # Push branch
  git push -u origin "$pr_branch"

  # Create draft PR
  gh pr create \
    --draft \
    --title "[DRAFT] [$PARENT_KEY] Part $pr_sequence/$total_prs: $(echo $pr_title | cut -d: -f2)" \
    --body "$(generate_checkpoint_pr_body $pr_sequence)" \
    --base "$base_branch" \
    --head "$pr_branch"

  # Capture PR URL
  pr_url=$(gh pr view --json url -q .url)
  pr_number=$(gh pr view --json number -q .number)

  # Update strategy config
  update_strategy_config $pr_sequence "$pr_url" "$pr_number" "draft"

  # Post to Jira
  post_checkpoint_to_jira $pr_sequence "$pr_url" "$sub_items"
}
```

### Step 4: Generate Checkpoint PR Body

```bash
generate_checkpoint_pr_body() {
  pr_sequence=$1
  pr_config=$(echo "$strategy" | jq ".prs[] | select(.sequence == $pr_sequence)")

  sub_items=$(echo "$pr_config" | jq -r '.sub_items[]')
  estimated_lines=$(echo "$pr_config" | jq -r '.estimated_lines')
  dependencies=$(echo "$pr_config" | jq -r '.dependencies[]' 2>/dev/null)

  cat <<EOF
## 📦 Checkpoint PR - Part $pr_sequence of $total_prs

This is an **incremental PR** as part of a planned splitting strategy.

### Parent Issue
**Jira:** [$PARENT_KEY]($JIRA_URL)

### Sub-Items in This PR
$(for item in $sub_items; do
  item_summary=$(mcp__atlassian__getJiraIssue $item | jq -r '.fields.summary')
  echo "- [$item]($JIRA_BASE_URL/browse/$item): $item_summary"
done)

### PR Chain Status

\`\`\`
$(generate_chain_visualization $pr_sequence)
\`\`\`

### Dependencies

$(if [ -z "$dependencies" ]; then
  echo "✅ **None** - This PR can be merged first"
else
  echo "⏳ **Waiting for:** PR #$(get_pr_number_for_sequence $dependencies)"
  echo ""
  echo "This PR must be merged AFTER PR #$(get_pr_number_for_sequence $dependencies)"
fi)

### Estimated Size
~$estimated_lines lines

### Status

- [x] Sub-items complete
- [x] Unit tests passing for this slice
- [ ] Integration tests (after all PRs merged)
- [ ] Full acceptance criteria (final PR)

### What's Next

$(if [ $pr_sequence -lt $total_prs ]; then
  echo "After this PR merges:"
  echo "1. PR #$((pr_sequence + 1)) will be rebased onto main"
  echo "2. Development continues on remaining sub-items"
else
  echo "This is the **final PR** in the chain."
  echo "After this merges, the feature is complete!"
fi)

---
**⚓ Golden Armada** | *You ask - The Fleet Ships*
Part of incremental delivery strategy for [$PARENT_KEY]
EOF
}
```

### Step 5: Post to Jira

```bash
post_checkpoint_to_jira() {
  pr_sequence=$1
  pr_url=$2
  sub_items=$3

  mcp__atlassian__addCommentToJiraIssue(
    issueKey="$PARENT_KEY",
    commentBody="## 📦 Checkpoint PR Created

**PR Part $pr_sequence of $total_prs:** $pr_url [DRAFT]

### Sub-Items Included
$(for item in $sub_items; do echo "- $item"; done)

### PR Chain Progress
$(generate_chain_progress)

### What This Means
This is part of an **incremental delivery strategy** to keep PRs small and reviewable.

- ✅ Each PR is <400 lines for easy review
- ✅ Sub-items are self-contained
- ✅ Independent review and merge

---
— *Golden Armada* ⚓"
  )
}
```

### Step 6: Handle PR Chain

```bash
generate_chain_visualization() {
  current=$1

  echo "main"
  for i in $(seq 1 $total_prs); do
    pr_status=$(get_pr_status_for_sequence $i)

    if [ $i -eq $current ]; then
      status_icon="📍 CURRENT"
    elif [ "$pr_status" == "merged" ]; then
      status_icon="✅ MERGED"
    elif [ "$pr_status" == "ready" ]; then
      status_icon="🔄 REVIEW"
    elif [ "$pr_status" == "draft" ]; then
      status_icon="📝 DRAFT"
    else
      status_icon="⏳ PLANNED"
    fi

    pr_title=$(echo "$strategy" | jq -r ".prs[] | select(.sequence == $i) | .title")
    indent=$(printf '%*s' $((i * 3)) '')
    echo " ${indent}└─ PR #$i: $pr_title $status_icon"
  done
}

generate_chain_progress() {
  merged=$(get_merged_pr_count)
  ready=$(get_ready_pr_count)
  draft=$(get_draft_pr_count)
  planned=$((total_prs - merged - ready - draft))

  echo "| Status | Count |"
  echo "|--------|-------|"
  echo "| ✅ Merged | $merged |"
  echo "| 🔄 Ready for Review | $ready |"
  echo "| 📝 Draft | $draft |"
  echo "| ⏳ Planned | $planned |"
}
```

## Merge Order Management

### When Parent PR Merges

```bash
on_parent_pr_merge() {
  merged_pr=$1
  merged_sequence=$(get_sequence_for_pr $merged_pr)

  # Find child PRs
  child_prs=$(echo "$strategy" | jq -r ".prs[] | select(.dependencies[] == $merged_sequence) | .sequence")

  for child_sequence in $child_prs; do
    child_pr=$(get_pr_for_sequence $child_sequence)
    child_branch=$(gh pr view $child_pr --json headRefName -q .headRefName)

    # Update base to main
    gh pr edit $child_pr --base main

    # Rebase child branch
    git checkout $child_branch
    git fetch origin main
    git rebase origin/main
    git push --force-with-lease origin $child_branch

    # Post update to Jira
    mcp__atlassian__addCommentToJiraIssue(
      issueKey="$PARENT_KEY",
      commentBody="🔄 **PR Chain Update**

PR #$merged_pr has been merged!

**Updated:** PR #$child_pr rebased onto main and ready for review.

$(generate_chain_progress)"
    )
  done
}
```

## Configuration Storage

### Strategy Config File

Location: `.claude/orchestration/pr-strategy.json`

```json
{
  "parent_issue": "PROJ-123",
  "strategy": "sub_item_based",
  "estimated_total_lines": 1200,
  "created_at": "2025-12-19T10:00:00Z",
  "prs": [
    {
      "sequence": 1,
      "title": "[PROJ-123] Part 1: Database Layer",
      "sub_items": ["PROJ-201", "PROJ-202"],
      "estimated_lines": 300,
      "dependencies": [],
      "status": "draft",
      "pr_number": 456,
      "pr_url": "https://github.com/org/repo/pull/456",
      "branch": "feature/PROJ-123-part-1"
    },
    {
      "sequence": 2,
      "title": "[PROJ-123] Part 2: API Layer",
      "sub_items": ["PROJ-203", "PROJ-204"],
      "estimated_lines": 400,
      "dependencies": [1],
      "status": "planned",
      "pr_number": null,
      "pr_url": null,
      "branch": null
    }
  ]
}
```

## Integration Points

### Triggers
- After each sub-item completion in CODE phase
- When PR size estimator creates multi-PR strategy
- When parent PR merges (for chain updates)

### Works With
- `pr-size-estimator`: Consumes splitting strategy
- `completion-orchestrator`: Reports multi-PR status
- `sub-item-documenter`: Documents which PR contains each sub-item

## Success Criteria

- [ ] Each checkpoint PR is <400 lines
- [ ] Sub-items correctly grouped by PR
- [ ] Dependency chain properly tracked
- [ ] Base branches updated when parents merge
- [ ] Jira comments show chain progress

## Error Handling

### Cherry-Pick Conflicts
```
If commits can't be cleanly separated:
- Fall back to branch-based splitting
- Create PRs from full branch with squash commits
- Document deviation from plan in Jira
```

### Chain Break (Parent Not Merged)
```
If parent PR is closed without merge:
- Rebase child PRs onto main directly
- Update strategy config
- Notify in Jira about chain change
```

## Output Format

```
✅ Checkpoint PR Created

PR Part 2 of 3: [PROJ-123] Part 2: API Layer
URL: https://github.com/org/repo/pull/457
Status: Draft

Sub-Items Included:
- PROJ-203: Create authentication endpoint
- PROJ-204: Add user API routes

Dependencies: Waiting for PR #456 to merge

Chain Progress:
✅ 1 merged | 📝 1 draft (this) | ⏳ 1 planned

Posted update to PROJ-123 on Jira.

— *Golden Armada* ⚓
```
