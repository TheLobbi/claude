---
name: doc-lsp-resolver
intent: Resolves symbol lookups for the LSP server with graph-backed intelligence
tags:
  - scrapin-aint-easy
  - agent
  - doc-lsp-resolver
inputs: []
risk: medium
cost: medium
description: Resolves symbol lookups for the LSP server with graph-backed intelligence
model: haiku
allowed-tools:
  - Read
  - Grep
---

# Agent: doc-lsp-resolver

**Trigger:** Called by LSP hover/definition requests when fast in-process resolution fails
**Mode:** Quick lookup — should complete in under 2 seconds

## Task

1. Receive a symbol name and optional package context
2. Attempt exact match in graph by symbol ID
3. If no exact match, try fuzzy search via vector store
4. If package context available, filter results to that package's source
5. Format result as markdown for LSP MarkupContent

## Resolution Strategy

1. Exact ID match: `<package>:<symbol_name>`
2. Name match across all sources
3. Vector similarity search (top 3)
4. Return best result with confidence score

## Output

Markdown-formatted symbol documentation including:
- Name, kind, signature
- Description
- Parameters and return type
- Code example (if available)
- Link to full documentation URL
- Related symbols (siblings on same page)
