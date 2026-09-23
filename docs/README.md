# Documentation

Start with the [repository README](../README.md) for current setup and checks.
Plugin-specific commands and procedures live alongside their
[plugin sources](../plugins/).

- [Routing strategy](plugins/ROUTING_STRATEGY.md) explains metadata-first
  selection; [the router](../scripts/plugin-router.mjs) implements it.
- [Delivery orchestrator decision](context/decisions/adr-001-orchestrator-unification.md)
  records why runtime consolidation does not justify merging commands with
  different mutation contracts.
- [Hook prompt guidance](hooks/prompt-guidance.md) describes the
  team-accelerator prompts.
- [CLI reference](cli/COMMANDS.md) accompanies [command metadata](cli/commands.json).

The planning, architecture-review, integration, security-review, and testing
collections include historical proposals and reports. They are not evidence of
current implementation or test coverage; check the relevant plugin, scripts,
and CI before using their commands or status claims.
