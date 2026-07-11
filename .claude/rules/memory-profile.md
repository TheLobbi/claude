# Project Identity — Memory Profile

## Project

- **Name**: Neural Orchestration Platform (Golden Armada)
- **Frontend Package**: @accos/frontend v1.0.0
- **Architecture**: Plugin-based AI agent orchestration platform
- **Owner**: Markus Ahling

## Scale

- 36 domain plugins in `plugins/`
- 54 platform skills in `.claude/skills/` (plugins ship their own — jira-orchestrator alone adds 14)
- 9 platform agents in `.claude/agents/` (plugins ship their own — jira-orchestrator alone adds 82)
- 7 MCP servers (5 custom + 2 external)

## Tech Stack

- **Runtime**: Node.js with TypeScript (strict mode)
- **Frontend**: React 18, Vite 5, Tailwind CSS
- **State**: Zustand with immer middleware
- **Data Fetching**: TanStack Query (React Query)
- **Visualization**: ReactFlow (agent/workflow canvas), Framer Motion (animations)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Package Manager**: pnpm

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | Frontend application source |
| `plugins/` | Installed domain plugins |
| `.claude/` | Orchestration configuration root |
| `.claude/rules/` | Behavioral rules (always loaded) |
| `.claude/skills/` | Platform-level reusable skills |
| `.claude/agents/` | Platform-level specialized agents |
| `.claude/hooks/` | Lifecycle hook scripts |
| `.claude/plugins/` | Available (uninstalled) plugins |
| `.claude/registry/` | Plugin registry metadata |

## MCP Servers

- **Custom (stdio)**: code-quality-gate, deploy-intelligence, lessons-learned, project-metrics, workflow-bridge
- **External**: Perplexity (knowledge queries), Firecrawl (web scraping), Context7 (library docs)
- **Config**: `.mcp.json` at project root
