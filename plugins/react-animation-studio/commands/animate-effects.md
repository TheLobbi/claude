---
name: react-animation-studio:animate-effects
intent: /animate-effects Command
tags:
  - react-animation-studio
  - command
  - animate-effects
inputs: []
risk: medium
cost: medium
description: Create artistic and experimental visual effects including morphing shapes, glitch effects, liquid animations, magnetic interactions, and creative loaders.
---

# /animate-effects Command

Create artistic and experimental visual effects including morphing shapes, glitch effects, liquid animations, magnetic interactions, and creative loaders.

## Usage

```
/animate-effects <type> [options]
```

## Effect Types

| Type | Description |
|------|-------------|
| `morph` | Morphing blob/shape animations |
| `glitch` | Retro glitch/distortion effects |
| `liquid` | Liquid/fluid button fills |
| `magnetic` | Magnetic cursor attraction |
| `elastic` | Elastic/bouncy containers |
| `reveal` | Creative reveal animations |
| `loader` | Artistic loading animations |
| `sparkle` | Sparkle/shimmer decorations |
| `glow` | Pulsing glow effects |
| `border` | Animated gradient borders |

## Options

- `--intensity <low|medium|high>` - Effect strength
- `--colors <colors>` - Comma-separated color values
- `--duration <number>` - Animation duration in seconds
- `--trigger <hover|click|auto|scroll>` - Activation trigger
- `--interactive` - Enable mouse/cursor interaction

## Examples

### Morphing Blob
```
/animate-effects morph --colors "#667eea,#764ba2" --duration 8
```

Generates:
```tsx
<MorphingBlob
  colors={['#667eea', '#764ba2']}
  duration={8}
/>
```

### Glitch Text Effect
```
/animate-effects glitch --intensity medium --trigger hover
```

Generates:
```tsx
<GlitchText trigger="hover">
  GLITCH
</GlitchText>
```

### Liquid Fill Button
```
/animate-effects liquid --colors "#667eea" --trigger hover
```

Generates:
```tsx
<LiquidButton color="#667eea">
  Click Me
</LiquidButton>
```

### Magnetic Button
```
/animate-effects magnetic --intensity high
```

Generates:
```tsx
<MagneticButton intensity={0.5}>
  Hover Me
</MagneticButton>
```

### Sparkle Wrapper
```
/animate-effects sparkle --colors "#FFC700,#FF6B6B,#4ECDC4"
```

Generates:
```tsx
<SparkleWrapper sparkleCount={5}>
  <span>Magical Text</span>
</SparkleWrapper>
```

### Rainbow Glow Border
```
/animate-effects border --type rainbow
```

Generates:
```tsx
<RainbowGlowBorder>
  <Card>Content</Card>
</RainbowGlowBorder>
```

### Creative Loader - DNA Helix
```
/animate-effects loader --type dna --colors "#667eea,#764ba2"
```

### Creative Loader - Orbiting Dots
```
/animate-effects loader --type orbit --duration 2
```

### Mask Reveal
```
/animate-effects reveal --type mask --trigger scroll
```

### Split Reveal
```
/animate-effects reveal --type split --direction horizontal
```

## Effect Categories

### Decorative Accents
- `sparkle` - Random sparkle animations
- `glow` - Pulsing glow effects
- `shimmer` - Shimmer highlight sweep
- `border` - Animated gradient borders

### Interactive Effects
- `magnetic` - Cursor attraction
- `elastic` - Bouncy containers
- `liquid` - Fluid fills

### Artistic Effects
- `morph` - Shape morphing
- `glitch` - Digital distortion
- `reveal` - Creative reveals

### Loading States
- `loader` - Creative loading animations (dna, orbit, pulse, bounce)

## Output

The command generates:
1. **React Component** - Complete effect component
2. **TypeScript Types** - Full prop definitions
3. **Animation Logic** - Framer Motion or CSS animations
4. **Performance Notes** - Optimization tips

## Best Practices

- Use sparingly - too many effects can overwhelm users
- Respect `prefers-reduced-motion` for accessibility
- Test performance on lower-end devices
- Ensure effects don't interfere with usability
- Provide fallbacks for browsers without support

## Related Commands

- `/animate-background` - Full-page background animations
- `/animate-text` - Text-specific animations
- `/animate-3d` - 3D transform effects
- `/animate-audit` - Performance analysis
