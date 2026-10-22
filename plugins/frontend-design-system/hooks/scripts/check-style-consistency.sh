#!/bin/bash

# Style Consistency Checker Hook
# Checks CSS/SCSS/TSX/JSX files for design system consistency

set -e

# Configuration
HOOK_STRICTNESS="${HOOK_STRICTNESS:-advisory}"
DESIGN_STYLE_BASELINE="${DESIGN_STYLE_BASELINE:-minimalist}"
CHECK_COLOR_CONSISTENCY="${CHECK_COLOR_CONSISTENCY:-true}"
CHECK_SPACING_CONSISTENCY="${CHECK_SPACING_CONSISTENCY:-true}"
CHECK_TYPOGRAPHY_CONSISTENCY="${CHECK_TYPOGRAPHY_CONSISTENCY:-true}"

# Claude Code sends hook input as JSON on stdin. Keep the positional argument
# fallback so the checker remains easy to run by hand.
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
  echo "⚠️  No file path provided to style consistency checker"
  exit 0
fi

# Only check if file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

echo "🎨 Checking style consistency for: $FILE_PATH"

WARNINGS=()

# Check for hardcoded color values (not using CSS variables)
if [ "$CHECK_COLOR_CONSISTENCY" = "true" ]; then
  if grep -E "#[0-9a-fA-F]{3,6}|rgb\(|rgba\(" "$FILE_PATH" > /dev/null 2>&1; then
    HARDCODED_COLORS=$(grep -E "#[0-9a-fA-F]{3,6}|rgb\(|rgba\(" "$FILE_PATH" | wc -l)
    if [ "$HARDCODED_COLORS" -gt 0 ]; then
      WARNINGS+=("⚠️  Found $HARDCODED_COLORS hardcoded color value(s). Consider design tokens (CSS variables or Chakra semantic tokens such as brand.solid, ink.strong).")
    fi
  fi
fi

# Check for non-standard spacing values
if [ "$CHECK_SPACING_CONSISTENCY" = "true" ]; then
  # Look for spacing that doesn't use standard increments (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
  if grep -E "(margin|padding).*:[^;]*(1px|2px|3px|5px|6px|7px|9px|10px|11px|13px|14px|15px|17px|18px|19px|20px)" "$FILE_PATH" > /dev/null 2>&1; then
    NON_STANDARD_SPACING=$(grep -E "(margin|padding).*:[^;]*(1px|2px|3px|5px|6px|7px|9px|10px|11px|13px|14px|15px|17px|18px|19px|20px)" "$FILE_PATH" | wc -l)
    if [ "$NON_STANDARD_SPACING" -gt 0 ]; then
      WARNINGS+=("⚠️  Found $NON_STANDARD_SPACING non-standard spacing value(s). Use design system spacing scale (4, 8, 12, 16, 24, 32, 48, 64).")
    fi
  fi
fi

# Check for inline styles in React components
if [[ "$FILE_PATH" =~ \.(tsx|jsx)$ ]]; then
  if grep -E "style=\{\{" "$FILE_PATH" > /dev/null 2>&1; then
    INLINE_STYLES=$(grep -E "style=\{\{" "$FILE_PATH" | wc -l)
    if [ "$INLINE_STYLES" -gt 0 ]; then
      WARNINGS+=("⚠️  Found $INLINE_STYLES inline style(s). Consider CSS classes, styled-components, or Chakra UI v3 style props / recipes.")
    fi
  fi
fi

# Check for typography not using design system classes
if [ "$CHECK_TYPOGRAPHY_CONSISTENCY" = "true" ]; then
  if grep -E "font-size|font-family|font-weight|line-height" "$FILE_PATH" > /dev/null 2>&1; then
    CUSTOM_TYPOGRAPHY=$(grep -E "font-size|font-family|font-weight|line-height" "$FILE_PATH" | wc -l)
    if [ "$CUSTOM_TYPOGRAPHY" -gt 0 ]; then
      WARNINGS+=("⚠️  Found $CUSTOM_TYPOGRAPHY custom typography declaration(s). Use design system typography tokens.")
    fi
  fi
fi

# Display warnings
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "📋 Style Consistency Warnings:"
  for warning in "${WARNINGS[@]}"; do
    echo "   $warning"
  done
  echo ""
  echo "💡 Design System Resources:"
  echo "   - CSS Variables: Check design-tokens.ts, theme.ts (Chakra system) or theme files"
  echo "   - Spacing Scale: 4px increments (4, 8, 12, 16, 24, 32, 48, 64)"
  echo "   - Typography: Use predefined text classes"
  echo ""
fi

# Exit based on strictness level
if [ "$HOOK_STRICTNESS" = "strict" ] && [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "❌ Style consistency check failed (strict mode)"
  exit 1
fi

echo "✅ Style consistency check complete"
exit 0
