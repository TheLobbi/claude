#!/bin/bash
# ha-context-guard.sh - Emit Home Assistant context ONLY inside an HA project.
#
# Previously hooks.json echoed "only handle HA-specific commands..." on every
# UserPromptSubmit, and a backup reminder on every Stop. Because plugin hooks
# run in every session regardless of the working directory, that text was
# injected into unrelated projects and actively steered Claude away from the
# user's actual task. This guard makes both messages conditional.
#
# Usage: ha-context-guard.sh <prompt|stop>

set -uo pipefail

MODE="${1:-prompt}"
DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

is_ha_project() {
  # Explicit opt-in / opt-out always wins.
  case "${HA_ARCHITECT_FORCE:-}" in
    1|true|TRUE|yes) return 0 ;;
    0|false|FALSE|no) return 1 ;;
  esac

  # A Home Assistant config dir has a configuration.yaml alongside at least one
  # of HA's own directories. configuration.yaml alone is too weak a signal --
  # plenty of unrelated projects have one.
  if [ -f "$DIR/configuration.yaml" ] && {
       [ -d "$DIR/.storage" ] || [ -d "$DIR/custom_components" ] ||
       [ -d "$DIR/blueprints" ] || [ -f "$DIR/automations.yaml" ] ||
       [ -f "$DIR/scenes.yaml" ] || [ -f "$DIR/scripts.yaml" ]; }; then
    return 0
  fi

  # A repo that talks to HA over the API rather than holding its config.
  [ -n "${HASS_URL:-}${HASS_TOKEN:-}${HOMEASSISTANT_URL:-}" ] && return 0

  return 1
}

is_ha_project || exit 0

case "$MODE" in
  stop)
    echo "Home Assistant: if configuration.yaml, automations, or secrets changed, back them up before restarting HA."
    ;;
  *)
    echo "Home Assistant project detected: prefer HA domains/entities, HA config files, and the Home Assistant MCP tools when they apply."
    ;;
esac

exit 0
