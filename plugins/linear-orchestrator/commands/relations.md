---
name: linear:relations
intent: Manage issue relations — blocks, blocked-by, duplicate, related, and parent/child
tags:
  - linear-orchestrator
  - command
  - relations
inputs:
  - action
risk: low
cost: low
description: Issue relations (linear.app/docs/issue-relations)
---

# /linear:relations

Wraps `issueRelationCreate`, `issueRelationDelete` mutations.

## Relation types
- `blocks` / `blocked_by` — bidirectional
- `duplicate` / `duplicate_of`
- `related`

(Parent/sub use `parentId` on the issue itself, not relations — see `/linear:issue`.)

## Usage
```
/linear:relations add ENG-1 blocks ENG-2
/linear:relations add ENG-3 related ENG-4
/linear:relations add ENG-5 duplicate_of ENG-6   # marks ENG-5 as dup of ENG-6
/linear:relations list ENG-1
/linear:relations remove <relationId>
```

## Resolution
- `add` validates both issues exist and are in teams the user can access
- `remove` requires the relation ID (returned by `list`)

## Bridge behaviour
- `blocks` relations are mirrored to Harness Code as PR-blocking checks (PR cannot merge until blocking issue is Done) when harness-sync is enabled
- Planner has no native relations; the bridge appends a "Blocks: ENG-X" line to the task description as a fallback
