---
name: css-animations
description: "Expert knowledge for pure CSS animations - lightweight, performant animations using CSS keyframes, transitions, and modern CSS features without JavaScript dependencies."
---

# CSS Animations Skill

Expert knowledge for pure CSS animations - lightweight, performant animations using CSS keyframes, transitions, and modern CSS features without JavaScript dependencies.

## When to Use

Activate this skill when:
- User wants lightweight animations without libraries
- Need simple hover/focus state transitions
- Building loading spinners or skeleton screens
- Performance is critical and animation is simple
- Animating pseudo-elements (::before, ::after)
- Using Tailwind CSS animation utilities

## File Patterns

- `**/*.css` with `@keyframes` definitions
- `**/*.scss` or `**/*.sass` with animations
- `**/*.tsx` with Tailwind animation classes
- `**/styles/*.css` with animation utilities
- `tailwind.config.js` with custom animations

## Core Concepts

### CSS Transitions
```css
.element {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.element:hover {
  transform: translateY(-4px);
  opacity: 0.9;
}

/* Shorthand */
.element {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### CSS Keyframe Animations
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeIn 0.5s ease-out forwards;
}
```

### Animation Properties
```css
.element {
  animation-name: slideIn;
  animation-duration: 0.5s;
  animation-timing-function: ease-out;
  animation-delay: 0.2s;
  animation-iteration-count: 1; /* or infinite */
  animation-direction: normal; /* or reverse, alternate, alternate-reverse */
  animation-fill-mode: forwards; /* none, forwards, backwards, both */
  animation-play-state: running; /* or paused */

  /* Shorthand */
  animation: slideIn 0.5s ease-out 0.2s 1 normal forwards;
}
```

## Timing Functions

```css
/* Built-in */
transition-timing-function: linear;
transition-timing-function: ease;
transition-timing-function: ease-in;
transition-timing-function: ease-out;
transition-timing-function: ease-in-out;

/* Cubic bezier */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* Material ease */
transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1); /* Default ease */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Back ease */

/* Steps (for sprite animations) */
transition-timing-function: steps(4, end);
```

## Common Keyframes Library

### Fade Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
```

### Scale Animations
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

### Loading Animations
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
```

## Tailwind CSS Animations

### Built-in Animations
```html
<div class="animate-spin">Loading...</div>
<div class="animate-ping">Notification</div>
<div class="animate-pulse">Skeleton</div>
<div class="animate-bounce">Scroll down</div>
```

### Custom Tailwind Animations
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
};
```

### Stagger with CSS Custom Properties
```css
.stagger-item {
  animation: fadeInUp 0.5s ease-out forwards;
  animation-delay: calc(var(--index) * 0.1s);
  opacity: 0;
}
```

```tsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="stagger-item"
    style={{ '--index': index } as React.CSSProperties}
  >
    {item.content}
  </div>
))}
```

## Component Patterns

### Loading Spinner
```tsx
// components/Spinner.tsx
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full border-blue-500 border-t-transparent animate-spin`}
    />
  );
}
```

### Skeleton Loading
```tsx
// components/Skeleton.tsx
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      {...props}
    />
  );
}

// Usage
<div className="space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

### Shimmer Effect
```css
.shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Performance Tips

### GPU-Accelerated Properties (Animate These)
```css
/* Good - GPU accelerated */
transform: translateX(100px);
transform: scale(1.1);
transform: rotate(45deg);
opacity: 0.5;

/* Avoid - trigger layout/paint */
width: 100px;
height: 100px;
top: 10px;
left: 10px;
margin: 10px;
padding: 10px;
```

### Will-Change Hint
```css
.animated-element {
  will-change: transform, opacity;
}

/* Remove after animation */
.animated-element.done {
  will-change: auto;
}
```

### Prefer Transform Over Position
```css
/* Bad - triggers layout */
.slide {
  left: 0;
  transition: left 0.3s;
}
.slide.active {
  left: 100px;
}

/* Good - GPU accelerated */
.slide {
  transform: translateX(0);
  transition: transform 0.3s;
}
.slide.active {
  transform: translateX(100px);
}
```

## Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Or provide alternatives */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    opacity: 1;
  }
}
```

## Examples

<example>
Context: User wants a hover effect on cards
user: "Add a subtle lift effect when hovering over cards"
assistant: Using CSS transitions for smooth hover:
```css
.card {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```
Or with Tailwind:
```tsx
<div className="transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
  Card content
</div>
```
</example>

<example>
Context: User needs a loading skeleton
user: "Create a skeleton loading state for this content"
assistant: Using CSS shimmer animation:
```tsx
function ContentSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
```
</example>

## Related Skills

- **framer-motion** - When animations need JavaScript control
- **spring-physics** - For more natural motion
- **scroll-animations** - For scroll-triggered CSS animations

## Author

Created by Brookside BI as part of React Animation Studio
