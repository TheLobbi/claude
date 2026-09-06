---
name: react-animation-studio:animate-3d
intent: /animate-3d Command
tags:
  - react-animation-studio
  - command
  - animate-3d
inputs: []
risk: medium
cost: medium
description: Create CSS/JS-based 3D animations including flip cards, tilt effects, rotating cubes, parallax depth layers, and 3D carousels without WebGL.
---

# /animate-3d Command

Create CSS/JS-based 3D animations including flip cards, tilt effects, rotating cubes, parallax depth layers, and 3D carousels without WebGL.

## Usage

```
/animate-3d <type> [options]
```

## 3D Animation Types

| Type | Description |
|------|-------------|
| `flip-card` | Card that flips to reveal back content |
| `flip-hover` | Card that flips on hover |
| `tilt` | Interactive tilt effect on mouse move |
| `tilt-shine` | Tilt with shiny light reflection |
| `cube` | 3D rotating cube with 6 faces |
| `carousel` | 3D rotating carousel |
| `parallax` | Multi-layer parallax depth effect |
| `door` | 3D door opening reveal |
| `book` | Page turning book effect |

## Options

- `--perspective <number>` - CSS perspective value (default: 1000px)
- `--duration <number>` - Animation duration in seconds
- `--trigger <click|hover|auto>` - How to trigger the animation
- `--direction <x|y|both>` - Rotation axis
- `--intensity <low|medium|high>` - Effect strength
- `--interactive` - Enable mouse tracking

## Examples

### Click-to-Flip Card
```
/animate-3d flip-card --trigger click --duration 0.6
```

Generates:
```tsx
<FlipCard
  front={<div>Front Content</div>}
  back={<div>Back Content</div>}
/>
```

### Hover Flip Card
```
/animate-3d flip-hover --duration 0.6
```

### Interactive Tilt Card
```
/animate-3d tilt --intensity medium --interactive
```

Generates:
```tsx
<TiltCard>
  <h3>Interactive Card</h3>
  <p>Move your mouse to see the 3D tilt effect!</p>
</TiltCard>
```

### Tilt with Shine Effect
```
/animate-3d tilt-shine --intensity high
```

### Rotating 3D Cube
```
/animate-3d cube --trigger auto --direction both
```

### 3D Carousel
```
/animate-3d carousel --perspective 1200
```

### Parallax Depth Layers
```
/animate-3d parallax --interactive --intensity high
```

### 3D Door Reveal
```
/animate-3d door --trigger click --duration 0.8
```

## CSS 3D Concepts

### Perspective Container
```css
.perspective-container {
  perspective: 1000px;
  perspective-origin: center;
}
```

### 3D Transform Style
```css
.card-3d {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}
```

## Output

The command generates:
1. **React Component** - Complete 3D animation component
2. **TypeScript Types** - Full prop definitions
3. **CSS Utilities** - Required CSS for 3D transforms
4. **Usage Examples** - Integration patterns

## Best Practices

- Always set `perspective` on parent container
- Use `transform-style: preserve-3d` for nested 3D
- Set `backface-visibility: hidden` for flip effects
- Use `will-change: transform` for performance
- Test on mobile devices (touch interactions differ)

## Browser Support Notes

- CSS 3D transforms supported in all modern browsers
- Safari may need `-webkit-` prefixes for some properties
- `transform-style: preserve-3d` has some edge cases in Safari

## Related Commands

- `/animate-effects` - Creative visual effects
- `/animate-component` - Add animation to existing components
- `/animate-scroll` - Scroll-triggered 3D reveals
