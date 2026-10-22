#!/bin/bash

# Design Token Updater Hook
# Detects design token changes and suggests regenerating CSS variables

set -e

# Claude Code sends hook input as JSON on stdin. Keep the positional argument
# fallback so the updater remains easy to run by hand.
FILE_PATH=""
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat)
  if command -v jq >/dev/null 2>&1; then
    FILE_PATH=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || true)
  elif [[ "$HOOK_INPUT" =~ \"file_path\"[[:space:]]*:[[:space:]]*\"([^\"]*)\" ]]; then
    FILE_PATH="${BASH_REMATCH[1]}"
  elif [[ "$HOOK_INPUT" =~ \"path\"[[:space:]]*:[[:space:]]*\"([^\"]*)\" ]]; then
    FILE_PATH="${BASH_REMATCH[1]}"
  fi
fi
FILE_PATH="${FILE_PATH:-${1:-}}"

if [ -z "$FILE_PATH" ]; then
  echo "⚠️  No file path provided to token updater"
  exit 0
fi

# Only check design token files
if [[ ! "$FILE_PATH" =~ design-tokens\.(json|ts)$ ]]; then
  exit 0
fi

# Only check if file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

echo "🎨 Design tokens modified: $FILE_PATH"

# Try to detect what changed
CHANGED_SECTIONS=()

if grep -E "color|palette" "$FILE_PATH" > /dev/null 2>&1; then
  CHANGED_SECTIONS+=("colors")
fi

if grep -E "spacing|space|margin|padding" "$FILE_PATH" > /dev/null 2>&1; then
  CHANGED_SECTIONS+=("spacing")
fi

if grep -E "typography|font|text" "$FILE_PATH" > /dev/null 2>&1; then
  CHANGED_SECTIONS+=("typography")
fi

if grep -E "shadow|elevation" "$FILE_PATH" > /dev/null 2>&1; then
  CHANGED_SECTIONS+=("shadows")
fi

if grep -E "border|radius" "$FILE_PATH" > /dev/null 2>&1; then
  CHANGED_SECTIONS+=("borders")
fi

if grep -E "breakpoint|screen|media" "$FILE_PATH" > /dev/null 2>&1; then
  CHANGED_SECTIONS+=("breakpoints")
fi

echo ""
echo "📋 Token Update Impact:"
echo ""

if [ ${#CHANGED_SECTIONS[@]} -gt 0 ]; then
  echo "   Detected changes in: ${CHANGED_SECTIONS[*]}"
  echo ""
fi

# Find files that might use these tokens
echo "🔍 Files That May Be Affected:"
echo ""

# Common locations for token usage
TOKEN_USAGE_PATTERNS=(
  "src/styles/**/*.css"
  "src/components/**/*.tsx"
  "src/themes/**/*.ts"
  "src/styles/variables.css"
)

for pattern in "${TOKEN_USAGE_PATTERNS[@]}"; do
  if [ -d "src" ]; then
    echo "   • Files matching: $pattern"
  fi
done

echo ""
echo "💡 Recommended Actions:"
echo ""

# Check if token generator exists
TOKEN_GENERATOR="./scripts/generate-css-variables.sh"
if [ -f "$TOKEN_GENERATOR" ]; then
  echo "   1. Regenerate CSS variables:"
  echo "      ./scripts/generate-css-variables.sh"
  echo ""
fi

echo "   2. Update theme files:"
echo "      • Review src/themes/*.ts"
echo "      • Update tenant-specific theme overrides"
echo ""

echo "   3. Rebuild design system:"
echo "      npm run build"
echo ""

echo "   4. Test components:"
echo "      npm run storybook"
echo "      # Or"
echo "      npm run test:visual"
echo ""

# Check for CSS variable files
CSS_VARS_FILE="./src/styles/variables.css"
if [ -f "$CSS_VARS_FILE" ]; then
  echo "   5. Verify CSS variables file:"
  echo "      • Check: $CSS_VARS_FILE"
  echo "      • Ensure all tokens are exported as CSS custom properties"
  echo ""
fi

# Check for TypeScript types
TYPES_FILE="./src/types/design-tokens.ts"
if [ -f "$TYPES_FILE" ]; then
  echo "   6. Update TypeScript types:"
  echo "      • Check: $TYPES_FILE"
  echo "      • Ensure types match new token structure"
  echo ""
fi

# Suggest documentation updates
echo "   7. Update documentation:"
echo "      • Update Storybook docs for affected components"
echo "      • Update design system documentation"
echo "      • Add migration notes if breaking changes"
echo ""

# Check if this is a breaking change
if [[ "$FILE_PATH" =~ design-tokens\.json$ ]]; then
  echo "⚠️  Token Structure Changes:"
  echo "   If you renamed or removed tokens, this may be a BREAKING CHANGE"
  echo "   Consider:"
  echo "      • Creating a migration guide"
  echo "      • Deprecation warnings for old tokens"
  echo "      • Updating CHANGELOG.md"
  echo ""
fi

# Provide example commands for common workflows
echo "🔧 Common Workflows:"
echo ""
echo "   # Full rebuild with token update"
echo "   npm run tokens:generate && npm run build"
echo ""
echo "   # Test changes locally"
echo "   npm run dev"
echo ""
echo "   # Visual regression testing"
echo "   npm run test:visual"
echo ""

echo "✅ Token update reminder complete"
exit 0
