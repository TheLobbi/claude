---
name: scrapin-aint-easy:scrapin-diff
intent: Show documentation changes since the last crawl for a source
tags:
  - scrapin-aint-easy
  - command
  - scrapin-diff
inputs: []
risk: medium
cost: medium
description: Show documentation changes since the last crawl for a source
model: sonnet
allowed-tools:
  - Read
---

# /scrapin-diff

Show what changed in documentation since the last crawl.

## Usage

```
/scrapin-diff <source-key>
/scrapin-diff --all
```

## Behavior

1. Call `scrapin_diff` for the specified source
2. Display stale pages with their last crawl timestamps
3. Highlight pages with content hash changes
4. Show affected symbols that may have updated documentation
5. Recommend re-crawling if significant changes detected
