---
name: doc-graph-builder
intent: Builds and maintains the documentation knowledge graph structure
tags:
  - scrapin-aint-easy
  - agent
  - doc-graph-builder
inputs: []
risk: medium
cost: medium
description: Builds and maintains the documentation knowledge graph structure
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Agent: doc-graph-builder

**Trigger:** Called after crawl completion to refine graph structure
**Mode:** Runs in separate context window

## Task

1. Load the graph schema from `@config/graph-schema.yaml`
2. For newly crawled symbols, identify relationships:
   a. CALLS: Parse function bodies for references to other known symbols
   b. INHERITS: Detect class/interface inheritance patterns
   c. SEE_ALSO: Extract "See also" links from documentation
   d. SUPERSEDES: Detect deprecation notices pointing to replacement symbols
3. Resolve cross-source references (e.g., a Stripe SDK symbol that references a Node.js built-in)
4. Compute Module groupings from package/namespace structure
5. Update vector embeddings for modified nodes

## Graph Integrity Rules

- Every Symbol must have exactly one DEFINED_IN edge to a Page
- Every Page must have exactly one PART_OF edge to a Source
- Deprecated symbols must have a SUPERSEDES edge if a replacement is mentioned
- No orphan nodes (nodes with zero edges) except Source nodes

## Output

Summary of graph modifications made.
