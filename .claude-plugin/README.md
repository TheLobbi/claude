# Marketplace metadata

[marketplace.json](marketplace.json) lists the installable plugins and their
source directories. [plugin.json](plugin.json) describes the repository-level
`claude-orchestration` package; each installable source owns its own manifest.

See the [repository README](../README.md) for installation and contribution
commands. Run `pnpm check:marketplace` from the repository root after changing
manifest references. The [catalog builder](../scripts/build-site.mjs) derives
catalog data from manifests; do not maintain a second plugin or capability
inventory here.
