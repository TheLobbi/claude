---
name: react-animation-studio:animate-preset
intent: /animate-preset
tags:
  - react-animation-studio
  - command
  - animate-preset
inputs: []
risk: medium
cost: medium
description: Apply pre-built animation presets from a curated library of beautiful, tested animations.
---

# /animate-preset

Apply pre-built animation presets from a curated library of beautiful, tested animations.

## Usage

```
/animate-preset <preset-name> [target]
```

## Description

The `/animate-preset` command provides instant access to a library of production-tested animation presets. Each preset is optimized for performance, accessibility, and visual appeal.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--list` | Show all available presets | - |
| `--category <cat>` | Filter presets by category | all |
| `--preview` | Show preset animation details | false |
| `--as-hook` | Generate as a custom hook | false |
| `--as-variants` | Generate as Framer Motion variants | true |

## Available Presets

### Entrance Animations

| Preset | Description |
|--------|-------------|
| `fade-in` | Simple opacity fade |
| `fade-in-up` | Fade with upward slide |
| `fade-in-down` | Fade with downward slide |
| `fade-in-left` | Fade with left slide |
| `fade-in-right` | Fade with right slide |
| `scale-in` | Grow from center |
| `scale-in-center` | Pop from center with overshoot |
| `slide-in-up` | Slide from below |
| `slide-in-down` | Slide from above |
| `slide-in-left` | Slide from left |
| `slide-in-right` | Slide from right |
| `flip-in-x` | 3D flip on X axis |
| `flip-in-y` | 3D flip on Y axis |
| `rotate-in` | Rotate while entering |
| `bounce-in` | Bouncy entrance |
| `zoom-in` | Zoom from small to full |

### Exit Animations

| Preset | Description |
|--------|-------------|
| `fade-out` | Simple opacity fade out |
| `fade-out-up` | Fade while sliding up |
| `fade-out-down` | Fade while sliding down |
| `scale-out` | Shrink to nothing |
| `slide-out-up` | Slide out upward |
| `slide-out-down` | Slide out downward |

### Attention Seekers

| Preset | Description |
|--------|-------------|
| `pulse` | Gentle scale pulse |
| `bounce` | Vertical bounce |
| `shake` | Horizontal shake |
| `wobble` | Playful wobble |
| `swing` | Pendulum swing |
| `rubber-band` | Elastic stretch |
| `flash` | Flash opacity |
| `heartbeat` | Double pulse like heartbeat |
| `jello` | Jelly-like wobble |

### Hover Effects

| Preset | Description |
|--------|-------------|
| `hover-lift` | Lift with shadow |
| `hover-scale` | Subtle grow |
| `hover-glow` | Add glow effect |
| `hover-tilt` | 3D tilt on hover |
| `hover-underline` | Animated underline |
| `hover-fill` | Background fill sweep |

### Scroll Animations

| Preset | Description |
|--------|-------------|
| `reveal-up` | Reveal from bottom on scroll |
| `reveal-left` | Reveal from right on scroll |
| `reveal-scale` | Scale up on scroll |
| `parallax-slow` | Slow parallax movement |
| `parallax-fast` | Fast parallax movement |

### Micro-interactions

| Preset | Description |
|--------|-------------|
| `button-press` | Button tap feedback |
| `toggle-switch` | Toggle animation |
| `checkbox-check` | Checkbox check animation |
| `notification-pop` | Notification entrance |
| `success-check` | Success checkmark draw |
| `loading-dots` | Three dots loading |
| `loading-spinner` | Circular spinner |

## Examples

```bash
# List all presets
/animate-preset --list

# Preview a preset
/animate-preset fade-in-up --preview

# Apply preset to component
/animate-preset hover-lift src/components/Card.tsx

# Generate as hook
/animate-preset bounce-in --as-hook

# Filter by category
/animate-preset --list --category hover
```

## Preset Code Examples

### fade-in-up
```tsx
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
```

### hover-lift
```tsx
export const hoverLift = {
  initial: { y: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  hover: {
    y: -4,
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};
```

### bounce-in
```tsx
export const bounceIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 15,
    },
  },
};
```

### button-press
```tsx
export const buttonPress = {
  tap: { scale: 0.95, transition: { duration: 0.1 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

// Usage: <motion.button whileTap="tap" whileHover="hover" variants={buttonPress} />
```

## Creating Custom Presets

Save custom presets to `animations/presets/custom.ts`:

```typescript
export const myCustomPreset = {
  initial: { /* initial state */ },
  animate: { /* animated state */ },
  exit: { /* exit state */ },
  transition: { /* default transition */ },
};
```

Then use: `/animate-preset my-custom-preset`

## Author

Created by Brookside BI as part of React Animation Studio
