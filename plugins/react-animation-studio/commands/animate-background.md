---
name: react-animation-studio:animate-background
intent: /animate-background Command
tags:
  - react-animation-studio
  - command
  - animate-background
inputs: []
risk: medium
cost: medium
description: Generate stunning animated backgrounds for React applications using CSS gradients, particles, aurora effects, and more.
---

# /animate-background Command

Generate stunning animated backgrounds for React applications using CSS gradients, particles, aurora effects, and more.

## Usage

```
/animate-background <type> [options]
```

## Background Types

| Type | Description |
|------|-------------|
| `gradient` | Flowing gradient animations with customizable colors |
| `particles` | Floating particle systems with physics |
| `aurora` | Northern lights / aurora borealis effects |
| `waves` | Animated wave patterns (SVG or CSS) |
| `mesh` | Animated mesh gradients |
| `stars` | Starfield / space backgrounds |
| `blobs` | Morphing blob backgrounds |
| `grid` | Animated grid patterns |
| `noise` | Grain / noise texture overlays |

## Options

- `--colors <colors>` - Comma-separated color values
- `--speed <slow|medium|fast>` - Animation speed
- `--intensity <low|medium|high>` - Effect intensity
- `--interactive` - Enable mouse interaction
- `--fullscreen` - Cover entire viewport
- `--overlay` - Add as overlay to existing content

## Examples

### Flowing Gradient Background
```
/animate-background gradient --colors "#667eea,#764ba2,#f093fb" --speed medium
```

Generates:
```tsx
export function GradientBackground() {
  return (
    <motion.div
      className="fixed inset-0 -z-10"
      style={{
        background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #667eea)',
        backgroundSize: '400% 400%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}
```

### Interactive Aurora Background
```
/animate-background aurora --interactive --colors "#00ff87,#60efff,#0061ff"
```

### Particle Starfield
```
/animate-background stars --intensity high --speed slow
```

### Morphing Blob Background
```
/animate-background blobs --colors "#667eea,#764ba2" --speed medium
```

## Output

The command generates:
1. **React Component** - Self-contained background component
2. **TypeScript Types** - Full type definitions
3. **Performance Notes** - GPU acceleration tips
4. **Usage Instructions** - How to integrate

## Best Practices

- Use `will-change: transform` for GPU acceleration
- Add `pointer-events: none` to prevent interaction blocking
- Use `-z-10` or similar to keep behind content
- Consider `prefers-reduced-motion` for accessibility
- Limit particle counts on mobile devices

## Related Commands

- `/animate-effects` - Creative visual effects
- `/animate` - General animation generation
- `/animate-audit` - Performance analysis
