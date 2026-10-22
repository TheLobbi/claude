#!/bin/bash

# Accessibility Validator Hook
# Checks React components for basic accessibility issues

set -e

# Configuration
HOOK_STRICTNESS="${HOOK_STRICTNESS:-advisory}"
CHECK_ARIA_LABELS="${CHECK_ARIA_LABELS:-true}"
CHECK_COLOR_CONTRAST="${CHECK_COLOR_CONTRAST:-true}"
CONTRAST_RATIO_THRESHOLD="${CONTRAST_RATIO_THRESHOLD:-4.5}"

# Claude Code sends hook input as JSON on stdin. Keep the positional argument
# fallback so the validator remains easy to run by hand.
FILE_PATH=""
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat)
  if command -v jq >/dev/null 2>&1; then
    FILE_PATH=$(printf '%s' "$HOOK_INPUT" | jq -r '(.tool_input.file_path // .tool_input.path) | if type == "string" then . else empty end' 2>/dev/null || true)
  elif command -v node >/dev/null 2>&1; then
    FILE_PATH=$(printf '%s' "$HOOK_INPUT" | node -e '
      const fs = require("node:fs");
      const input = JSON.parse(fs.readFileSync(0, "utf8"));
      const filePath = input?.tool_input?.file_path ?? input?.tool_input?.path;
      if (typeof filePath === "string") process.stdout.write(filePath);
    ' 2>/dev/null || true)
  fi
fi
FILE_PATH="${FILE_PATH:-${1:-}}"

if [ -z "$FILE_PATH" ]; then
  echo "⚠️  No file path provided to accessibility validator"
  exit 0
fi

# Only check TSX/JSX files
if [[ ! "$FILE_PATH" =~ \.(tsx|jsx)$ ]]; then
  exit 0
fi

# Only check if file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

echo "♿ Checking accessibility for: $FILE_PATH"

WARNINGS=()

# Check for images without alt text
if grep -E "<img[^>]*>" "$FILE_PATH" > /dev/null 2>&1; then
  IMAGES_WITHOUT_ALT=$(grep -E "<img[^>]*>" "$FILE_PATH" | grep -v "alt=" | wc -l)
  if [ "$IMAGES_WITHOUT_ALT" -gt 0 ]; then
    WARNINGS+=("⚠️  Found $IMAGES_WITHOUT_ALT image(s) without alt text. Add alt attribute for screen readers.")
  fi
fi

# Check for buttons without accessible labels
if [ "$CHECK_ARIA_LABELS" = "true" ]; then
  # Look for icon-only buttons that might need aria-label
  if grep -E "<button[^>]*><(Icon|Svg|img)" "$FILE_PATH" > /dev/null 2>&1; then
    ICON_BUTTONS=$(grep -E "<button[^>]*><(Icon|Svg|img)" "$FILE_PATH" | grep -v "aria-label" | wc -l)
    if [ "$ICON_BUTTONS" -gt 0 ]; then
      WARNINGS+=("⚠️  Found $ICON_BUTTONS potential icon-only button(s). Add aria-label for accessibility.")
    fi
  fi
fi

# Check for form inputs without labels
if grep -E "<input[^>]*type=\"(text|email|password|search|tel|url)\"" "$FILE_PATH" > /dev/null 2>&1; then
  # This is a simplified check - in practice, labels might be associated via id/for
  INPUTS=$(grep -E "<input[^>]*type=\"(text|email|password|search|tel|url)\"" "$FILE_PATH" | wc -l)
  if [ "$INPUTS" -gt 0 ]; then
    WARNINGS+=("ℹ️  Found $INPUTS input field(s). Verify each has an associated <label> or aria-label.")
  fi
fi

# Check for interactive elements without keyboard support
if grep -E "<div[^>]*onClick" "$FILE_PATH" > /dev/null 2>&1; then
  DIV_CLICKS=$(grep -E "<div[^>]*onClick" "$FILE_PATH" | grep -v "onKeyPress\|onKeyDown\|role=\"button\"" | wc -l)
  if [ "$DIV_CLICKS" -gt 0 ]; then
    WARNINGS+=("⚠️  Found $DIV_CLICKS clickable <div>(s). Add keyboard event handlers or use <button>.")
  fi
fi

# Check for missing role attributes on custom interactive elements
if grep -E "<div[^>]*onClick" "$FILE_PATH" > /dev/null 2>&1; then
  DIVS_WITHOUT_ROLE=$(grep -E "<div[^>]*onClick" "$FILE_PATH" | grep -v "role=" | wc -l)
  if [ "$DIVS_WITHOUT_ROLE" -gt 0 ]; then
    WARNINGS+=("⚠️  Found $DIVS_WITHOUT_ROLE clickable element(s) without role attribute.")
  fi
fi

# Check for tables without proper structure
if grep -E "<table" "$FILE_PATH" > /dev/null 2>&1; then
  TABLES_WITHOUT_HEADERS=$(grep -E "<table" "$FILE_PATH" | wc -l)
  if ! grep -E "<th" "$FILE_PATH" > /dev/null 2>&1; then
    WARNINGS+=("⚠️  Found table(s) without <th> headers. Use proper table structure for screen readers.")
  fi
fi

# Check for color contrast issues (basic heuristic)
if [ "$CHECK_COLOR_CONTRAST" = "true" ]; then
  # Look for light colors on light backgrounds or dark on dark
  if grep -E "color.*#(f|e|d)[0-9a-fA-F]{5}.*background.*#(f|e|d)[0-9a-fA-F]{5}" "$FILE_PATH" > /dev/null 2>&1; then
    WARNINGS+=("⚠️  Potential color contrast issue detected. Verify WCAG AA compliance (4.5:1 ratio).")
  fi
fi

# Display warnings
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "📋 Accessibility Warnings:"
  for warning in "${WARNINGS[@]}"; do
    echo "   $warning"
  done
  echo ""
  echo "💡 Accessibility Resources:"
  echo "   - WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/"
  echo "   - ARIA Practices: https://www.w3.org/WAI/ARIA/apg/"
  echo "   - Color Contrast Checker: https://webaim.org/resources/contrastchecker/"
  echo "   - Consider using eslint-plugin-jsx-a11y for automated checks"
  echo ""
fi

# Exit based on strictness level
if [ "$HOOK_STRICTNESS" = "strict" ] && [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "❌ Accessibility validation failed (strict mode)"
  exit 1
fi

echo "✅ Accessibility check complete"
exit 0
