# Workflow Preferences — Memory

## Package Management

- Use `pnpm` for all package operations (`pnpm install`, `pnpm add`, `pnpm test`)
- Never use `npm` or `yarn` in this project

## Agent Usage

- Use subagents for research tasks to preserve main conversation context
- Subagents are disposable — their context does not persist after completion
- Prefer dedicated agents from `.claude/agents/` when one matches the task

## Model Selection

| Model | Use Case |
|-------|----------|
| Fable | Long-horizon autonomous runs, overnight builds, hardest reasoning (tier above Opus — reserve for work above Opus's ceiling) |
| Opus | Architecture decisions, complex refactoring, multi-file analysis |
| Sonnet | Feature implementation, bug fixes, code generation |
| Haiku | Research lookups, documentation queries, fast searches |

## Context Management

- Use `/compact` every 20-30 exchanges to keep context window efficient
- Use `/clear` between unrelated tasks
- Read `lessons-learned.md` at the start of each session to avoid known pitfalls

## Plugin Development

- Every plugin follows the `.claude-plugin/plugin.json` manifest schema
- Plugin manifests declare: name, version, description, commands, skills, agents, hooks
- New plugins go in `plugins/` after installation, `.claude/plugins/` before
- Plugin development workflow: scaffold, implement, test, register, install

## Research

- Check lessons-learned.md before starting any task
- Use Context7 MCP for library/framework documentation
- Use Perplexity MCP for general knowledge queries
- Use Firecrawl MCP for scraping specific URLs
- Document findings in relevant project files, not just conversation

## Git

- Follow `type(scope): description` commit format
- Stage specific files, never `git add -A` or `git add .`
- Run tests before committing
