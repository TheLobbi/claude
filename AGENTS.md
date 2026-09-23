# Repository contracts

This is a Claude Code plugin marketplace with a static catalog, not the former
React/Vite workflow-builder application.

- `.claude-plugin/marketplace.json` defines installable plugins. Each source
  directory owns its manifests, commands, agents, skills, hooks, and tests.
  Markdown in `plugins/` and `.claude/{plugins,agents,skills,commands}/` is
  product content; check manifests, registries, and callers before removing it.
- Root TypeScript checks cover `scripts/` and `types/` only. Plugins need their
  own validation; a green root check does not validate their runtime.
- Keep manifest paths and MCP entry points deployable from tracked files.
  Commands, agents, and skills need YAML frontmatter. Run the marketplace
  validator for the exact rules instead of maintaining duplicate file catalogs.
- Plugins and hooks execute with the user's permissions, not in a sandbox.
  Preserve input/path validation, safe JSON construction, secret handling,
  concurrent-write protection, and non-destructive install/uninstall behavior.
- Preserve plugin-specific licenses, compatibility names, and public procedures.
  Keep independently versioned plugin metadata aligned when shipping behavior changes.
- Catalog data in `site/data/plugins.json` is generated from manifests by
  `scripts/build-site.mjs`; edit its sources.
- Keep the catalog keyboard-accessible with visible focus, semantic labels,
  WCAG AA contrast, and reduced-motion support.

Use Node.js 20+ and pnpm (the committed lockfile is required by CI):

```sh
pnpm install --frozen-lockfile
pnpm check:marketplace
pnpm check:site
pnpm exec tsc --noEmit
pnpm validate-archetype examples/archetypes/<name>/archetype.json
```

Run focused plugin tests for changed behavior; `pnpm test:delivery-plugin`
covers the delivery orchestrator. See `package.json` and
`.github/workflows/marketplace-ci.yml` for other checks and their scope.

Keep repository instructions here. Claude loads them through
`.claude/CLAUDE.md`. The setup/update commands and templating plugin generate
guidance for other projects; they are product interfaces, not a requirement to
regenerate their starter set in this repository. Document durable decisions,
customer procedures, and cross-component constraints; source, tests, and Git
history carry implementation inventories and completed work.
