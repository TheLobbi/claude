---
name: scrapin-aint-easy:scrapin-algo
intent: Query the algorithm library for implementations, patterns, and complexity analysis
tags:
  - scrapin-aint-easy
  - command
  - scrapin-algo
inputs: []
risk: medium
cost: medium
description: Query the algorithm library for implementations, patterns, and complexity analysis
model: sonnet
allowed-tools:
  - Read
  - Grep
---

# /scrapin-algo

Search the algorithm and coding pattern library.

## Usage

```
/scrapin-algo <query> [--category <category>] [--lang ts|py]
```

## Behavior

1. Call `scrapin_algo_search` with the query
2. For the best match, call `scrapin_algo_detail` to get full code and complexity analysis
3. Present results with:
   - Algorithm name and category
   - Time and space complexity
   - Full code example in the requested language
   - Related algorithms
4. If implementing, attach complexity annotations as comments

## Categories

sorting | searching | graph | tree | dynamic-programming | greedy |
backtracking | divide-and-conquer | data-structures | string |
math | bit-manipulation | design-patterns | architectural-patterns |
concurrency | system-design | testing-patterns

## Examples

- `/scrapin-algo merge sort` — Find merge sort implementation
- `/scrapin-algo shortest path --category graph` — Graph algorithms
- `/scrapin-algo observer pattern --category design-patterns --lang ts` — Design patterns in TypeScript
