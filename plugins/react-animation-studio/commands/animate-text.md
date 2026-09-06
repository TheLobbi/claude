---
name: react-animation-studio:animate-text
intent: /animate-text Command
tags:
  - react-animation-studio
  - command
  - animate-text
inputs: []
risk: medium
cost: medium
description: Create expressive text animations including typewriter effects, character reveals, kinetic typography, and gradient text animations.
---

# /animate-text Command

Create expressive text animations including typewriter effects, character reveals, kinetic typography, and gradient text animations.

## Usage

```
/animate-text <type> [options]
```

## Text Animation Types

| Type | Description |
|------|-------------|
| `typewriter` | Classic typing animation with cursor |
| `typewriter-loop` | Typing with delete and loop through texts |
| `stagger` | Character-by-character staggered reveal |
| `wave` | Wavy bouncing text animation |
| `scramble` | Matrix-style text scramble reveal |
| `gradient` | Animated flowing gradient text |
| `highlight` | Words with animated highlight backgrounds |
| `split` | Split lines with reveal animation |
| `counter` | Animated counting numbers |
| `stroke` | SVG stroke drawing text |
| `bounce` | Interactive bouncy characters on hover |

## Options

- `--text <text>` - The text to animate
- `--texts <texts>` - Comma-separated texts for loop animations
- `--speed <number>` - Animation speed in ms
- `--delay <number>` - Start delay in ms
- `--colors <colors>` - Colors for gradient/highlight effects
- `--loop` - Enable looping
- `--hover` - Trigger on hover instead of on mount

## Examples

### Typewriter with Cursor
```
/animate-text typewriter --text "Welcome to the future" --speed 80
```

Generates:
```tsx
<h1 className="text-5xl font-bold">
  <Typewriter text="Welcome to the future" speed={80} />
</h1>
```

### Looping Typewriter
```
/animate-text typewriter-loop --texts "Developer,Designer,Creator" --speed 50
```

Generates:
```tsx
<TypewriterLoop
  texts={['Developer', 'Designer', 'Creator']}
  typingSpeed={50}
  deletingSpeed={30}
  pauseDuration={2000}
/>
```

### Staggered Character Reveal
```
/animate-text stagger --text "Hello World" --delay 30
```

### Wave Text Animation
```
/animate-text wave --text "Bouncy Text"
```

### Text Scramble Effect
```
/animate-text scramble --text "CLASSIFIED" --speed 1000
```

### Animated Gradient Text
```
/animate-text gradient --text "Innovation" --colors "#667eea,#764ba2,#f093fb"
```

### Animated Counter
```
/animate-text counter --text "1000" --speed 2000
```

### Highlighted Words
```
/animate-text highlight --text "Build amazing products" --highlight "amazing" --colors "#667eea"
```

## Output

The command generates:
1. **React Component** - Reusable text animation component
2. **TypeScript Props** - Full type definitions
3. **Accessibility Notes** - Screen reader considerations
4. **Usage Examples** - Integration patterns

## Accessibility Considerations

- Add `aria-label` with full text for screen readers
- Respect `prefers-reduced-motion` media query
- Ensure text remains readable during animation
- Provide static fallback for assistive technologies

## Related Commands

- `/animate-effects` - Creative visual effects
- `/animate` - General animation generation
- `/animate-component` - Add animation to existing components
