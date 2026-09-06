---
name: react-animation-studio:animate-audit
intent: /animate-audit
tags:
  - react-animation-studio
  - command
  - animate-audit
inputs: []
risk: medium
cost: medium
description: Audit animations for performance, accessibility, and best practices compliance.
---

# /animate-audit

Audit animations for performance, accessibility, and best practices compliance.

## Usage

```
/animate-audit [path]
```

## Description

The `/animate-audit` command performs comprehensive analysis of animation implementations in your React codebase. It identifies performance issues, accessibility concerns, and opportunities for improvement.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Directory or file to audit | ./src |
| `--fix` | Auto-fix simple issues | false |
| `--report <format>` | Output format (console, json, html) | console |
| `--strict` | Enable strict mode checks | false |
| `--focus <area>` | Focus on specific area (performance, a11y, best-practices) | all |

## Audit Categories

### Performance Checks

| Check | Description | Severity |
|-------|-------------|----------|
| `layout-thrashing` | Animations that trigger layout recalculation | High |
| `non-gpu-properties` | Animating width/height/top/left instead of transform | High |
| `missing-will-change` | Missing will-change hints for complex animations | Medium |
| `excessive-repaints` | Animations causing excessive paint operations | Medium |
| `memory-leaks` | Animation cleanup missing in useEffect | High |
| `large-dom-animations` | Animating too many DOM elements simultaneously | Medium |
| `heavy-spring-config` | Overly complex spring configurations | Low |

### Accessibility Checks

| Check | Description | Severity |
|-------|-------------|----------|
| `missing-reduced-motion` | No prefers-reduced-motion support | High |
| `vestibular-triggers` | Animations that may trigger vestibular disorders | High |
| `auto-playing-indefinite` | Indefinitely looping animations without user control | Medium |
| `flash-rate` | Animations flashing more than 3 times per second | Critical |
| `motion-without-purpose` | Decorative animations lacking user benefit | Low |
| `focus-indicator-animated` | Focus indicators should not animate excessively | Medium |

### Best Practices

| Check | Description | Severity |
|-------|-------------|----------|
| `inconsistent-timing` | Inconsistent duration/easing across similar elements | Medium |
| `magic-numbers` | Hard-coded animation values instead of tokens | Low |
| `missing-exit-animation` | Enter animations without matching exits | Medium |
| `gesture-without-fallback` | Gesture animations without keyboard alternatives | High |
| `missing-loading-states` | Async operations without loading animations | Medium |
| `excessive-dependencies` | Multiple animation libraries in use | Low |

## Examples

```bash
# Audit entire src directory
/animate-audit

# Audit specific component
/animate-audit src/components/Modal.tsx

# Performance-focused audit
/animate-audit --focus performance

# Generate JSON report
/animate-audit --report json > animation-audit.json

# Auto-fix simple issues
/animate-audit --fix

# Strict mode for production readiness
/animate-audit --strict
```

## Audit Report Example

```
Animation Audit Report
======================
Scanned: 47 files
Animations found: 128
Issues found: 12

CRITICAL (1)
------------
[FLASH-RATE] src/components/Alert.tsx:45
  Animation flashes at 4Hz, exceeding safe 3Hz limit
  > Fix: Reduce animation frequency or add user control

HIGH (3)
--------
[LAYOUT-THRASHING] src/components/Sidebar.tsx:78
  Animating 'width' triggers layout recalculation
  > Fix: Use 'transform: scaleX()' instead

[MISSING-REDUCED-MOTION] src/components/Hero.tsx:23
  No reduced motion alternative provided
  > Fix: Add useReducedMotion() hook check

[MEMORY-LEAK] src/components/Particles.tsx:56
  Animation not cleaned up on unmount
  > Fix: Return cleanup function from useEffect

MEDIUM (5)
----------
[INCONSISTENT-TIMING] Multiple files
  Duration varies: 200ms, 300ms, 350ms for similar transitions
  > Fix: Use animation tokens for consistency

[NON-GPU-PROPERTIES] src/components/Card.tsx:34
  Animating 'box-shadow' causes repaints
  > Fix: Use pseudo-element with opacity for shadow animation

...

Recommendations
---------------
1. Create animation tokens file for consistent timing
2. Add global reduced motion provider
3. Consider consolidating to single animation library
4. Add animation performance monitoring

Score: 72/100 (Good)
```

## Auto-Fix Capabilities

The `--fix` flag can automatically fix:

- Add `useReducedMotion` imports
- Replace `width`/`height` with `scale` transforms
- Add cleanup functions to animation effects
- Insert `will-change` hints
- Convert magic numbers to token references

## Integration

### Pre-commit Hook
```bash
# In .husky/pre-commit
/animate-audit --strict --focus performance
```

### CI/CD Check
```yaml
# In GitHub Actions
- name: Animation Audit
  run: |
    npx @react-animation-studio/cli audit --report json
    if [ $? -ne 0 ]; then
      echo "Animation audit failed"
      exit 1
    fi
```

## Custom Rules

Add custom rules in `animation-audit.config.js`:

```javascript
module.exports = {
  rules: {
    'max-animation-duration': ['warn', { max: 1000 }],
    'required-easing': ['error', { easing: 'ease-out' }],
    'ban-libraries': ['warn', { banned: ['anime.js'] }],
  },
  ignore: [
    '**/tests/**',
    '**/*.stories.tsx',
  ],
};
```

## Author

Created by Brookside BI as part of React Animation Studio
