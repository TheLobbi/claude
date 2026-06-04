---
name: gsap
description: "Expert knowledge for GSAP (GreenSock Animation Platform) - the industry-standard JavaScript animation library for professional-grade animations with precise timeline control."
---

# GSAP Skill

Expert knowledge for GSAP (GreenSock Animation Platform) - the industry-standard JavaScript animation library for professional-grade animations with precise timeline control.

## When to Use

Activate this skill when:
- User mentions "GSAP", "GreenSock", or "timeline animations"
- Need frame-perfect, complex animation sequences
- Building scroll-triggered animations with ScrollTrigger
- Animating SVG paths or morphing shapes
- Require fine-grained control over animation timing
- Working with canvas or WebGL animations

## File Patterns

- `**/*.tsx` containing `gsap` imports
- `**/*.ts` with timeline animations
- `**/animations/*.ts` with gsap configurations
- Files with ScrollTrigger, MorphSVG, or other GSAP plugins

## Installation

```bash
# Core library
npm install gsap

# With React integration
npm install gsap @gsap/react

# Specific plugins (if needed)
npm install gsap/ScrollTrigger
```

## Core Concepts

### Basic Tweens
```typescript
import gsap from 'gsap';

// To animation (animate TO these values)
gsap.to('.element', {
  x: 100,
  opacity: 1,
  duration: 1,
  ease: 'power2.out',
});

// From animation (animate FROM these values)
gsap.from('.element', {
  x: -100,
  opacity: 0,
  duration: 1,
});

// FromTo animation (both start and end)
gsap.fromTo('.element',
  { x: -100, opacity: 0 },
  { x: 0, opacity: 1, duration: 1 }
);

// Set (instant, no animation)
gsap.set('.element', { x: 0, opacity: 1 });
```

### Timelines
```typescript
const tl = gsap.timeline({
  defaults: { duration: 0.5, ease: 'power2.out' },
});

tl.to('.header', { y: 0, opacity: 1 })
  .to('.nav-item', { y: 0, opacity: 1, stagger: 0.1 }, '-=0.3')
  .to('.content', { y: 0, opacity: 1 }, '<0.2') // 0.2s after previous starts
  .to('.footer', { y: 0, opacity: 1 }, '>-0.1'); // 0.1s before previous ends
```

### Position Parameters
```typescript
tl.to(el, { x: 100 })           // End of timeline
  .to(el, { y: 100 }, '+=0.5')  // 0.5s gap after previous
  .to(el, { z: 100 }, '-=0.25') // 0.25s overlap
  .to(el, { rotation: 90 }, '<') // Same time as previous
  .to(el, { scale: 2 }, '<0.5') // 0.5s after previous starts
  .to(el, { opacity: 0 }, 2)    // Absolute time: 2s from start
  .to(el, { color: 'red' }, 'myLabel') // At label
  .to(el, { width: 200 }, 'myLabel+=1'); // 1s after label
```

## React Integration

### useGSAP Hook
```typescript
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

function Component() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // GSAP animations here - auto-cleanup on unmount
    gsap.to('.box', {
      x: 200,
      rotation: 360,
      duration: 2,
      ease: 'elastic.out(1, 0.3)',
    });
  }, { scope: containerRef }); // Scope selector queries to container

  return (
    <div ref={containerRef}>
      <div className="box">Animated</div>
    </div>
  );
}
```

### Manual Cleanup Pattern
```typescript
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

function Component() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(elementRef.current, {
        x: 100,
        duration: 1,
      });
    });

    return () => ctx.revert(); // Cleanup
  }, []);

  return <div ref={elementRef}>Animated</div>;
}
```

## ScrollTrigger

```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Basic scroll-triggered animation
gsap.to('.element', {
  x: 500,
  scrollTrigger: {
    trigger: '.element',
    start: 'top 80%',    // When top of element hits 80% of viewport
    end: 'bottom 20%',   // When bottom of element hits 20% of viewport
    scrub: true,         // Link to scroll position
    markers: true,       // Debug markers (dev only)
  },
});

// Timeline with ScrollTrigger
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.section',
    start: 'top top',
    end: '+=300%',
    scrub: 1,           // Smooth scrubbing (1 second lag)
    pin: true,          // Pin the element
    anticipatePin: 1,   // Prevent jank on pin
  },
});

tl.to('.panel-1', { xPercent: -100 })
  .to('.panel-2', { xPercent: -100 })
  .to('.panel-3', { xPercent: -100 });
```

## Easing Functions

```typescript
// Built-in eases
ease: 'none'           // Linear
ease: 'power1.out'     // Subtle ease out
ease: 'power2.inOut'   // Moderate ease in-out
ease: 'power3.out'     // Strong ease out
ease: 'power4.in'      // Very strong ease in
ease: 'back.out(1.7)'  // Overshoot
ease: 'elastic.out(1, 0.3)' // Bouncy spring
ease: 'bounce.out'     // Bounce
ease: 'circ.out'       // Circular
ease: 'expo.out'       // Exponential
ease: 'sine.inOut'     // Sine wave

// Custom ease
ease: 'M0,0 C0.126,0.382 0.282,0.674 0.44,0.822 0.632,1.002 0.818,1.001 1,1'
```

## Stagger Animations

```typescript
// Simple stagger
gsap.to('.item', {
  y: 0,
  opacity: 1,
  stagger: 0.1, // 0.1s between each
});

// Advanced stagger
gsap.to('.grid-item', {
  scale: 1,
  opacity: 1,
  stagger: {
    amount: 1,      // Total stagger time
    from: 'center', // 'start', 'end', 'center', 'edges', 'random', or index
    grid: [5, 5],   // For grid layouts
    ease: 'power2.out',
    axis: 'x',      // Stagger along x-axis only
  },
});

// Function-based stagger
gsap.to('.item', {
  y: 0,
  stagger: (index, target, list) => {
    return index * 0.1 + Math.random() * 0.1;
  },
});
```

## Animation Properties

### Transform Properties
```typescript
{
  x: 100,              // translateX (px or %)
  y: 100,              // translateY
  xPercent: -50,       // translateX as percentage of element width
  yPercent: -50,       // translateY as percentage of element height
  rotation: 360,       // rotate (degrees)
  rotationX: 45,       // 3D rotation
  rotationY: 45,       // 3D rotation
  scale: 1.5,          // uniform scale
  scaleX: 2,           // scale X
  scaleY: 2,           // scale Y
  skewX: 45,           // skew X
  skewY: 45,           // skew Y
  transformOrigin: '50% 50%',
  transformPerspective: 1000,
}
```

### Special Properties
```typescript
{
  autoAlpha: 1,        // opacity + visibility
  immediateRender: false,
  overwrite: 'auto',   // Handle conflicting tweens
  repeat: -1,          // Infinite repeat
  repeatDelay: 0.5,
  yoyo: true,          // Alternate direction on repeat
  reversed: true,      // Start reversed
  paused: true,        // Start paused
}
```

## Common Patterns

### Reveal on Scroll
```typescript
gsap.utils.toArray('.reveal').forEach((element) => {
  gsap.from(element as Element, {
    y: 60,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: element as Element,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
  });
});
```

### Horizontal Scroll Section
```typescript
const sections = gsap.utils.toArray('.panel');
const totalWidth = sections.length * window.innerWidth;

gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: 'none',
  scrollTrigger: {
    trigger: '.container',
    pin: true,
    scrub: 1,
    snap: 1 / (sections.length - 1),
    end: () => '+=' + totalWidth,
  },
});
```

### Text Split Animation
```typescript
// With SplitText plugin or manual split
const chars = text.split('');
element.innerHTML = chars.map(c => `<span class="char">${c}</span>`).join('');

gsap.from('.char', {
  opacity: 0,
  y: 50,
  rotateX: -90,
  stagger: 0.02,
  duration: 0.5,
  ease: 'back.out(1.7)',
});
```

## Examples

<example>
Context: User wants to animate elements as they scroll into view
user: "Make these cards animate in when scrolling"
assistant: Using GSAP with ScrollTrigger for scroll-reveal:
```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function CardSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from('.card', {
      y: 80,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: '.cards-container',
        start: 'top 75%',
      },
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <div className="cards-container">
        {cards.map(card => <div className="card" key={card.id}>{card.content}</div>)}
      </div>
    </div>
  );
}
```
</example>

<example>
Context: User needs a complex loading animation sequence
user: "Create a logo animation where parts reveal sequentially"
assistant: Using GSAP timeline for orchestrated sequence:
```typescript
const logoAnimation = gsap.timeline({ paused: true });

logoAnimation
  .from('.logo-icon', {
    scale: 0,
    rotation: -180,
    duration: 0.6,
    ease: 'back.out(1.7)',
  })
  .from('.logo-text span', {
    opacity: 0,
    y: 30,
    stagger: 0.05,
    duration: 0.4,
    ease: 'power2.out',
  }, '-=0.2')
  .from('.tagline', {
    opacity: 0,
    y: 20,
    duration: 0.4,
  }, '-=0.1');

// Play when ready
logoAnimation.play();
```
</example>

## Related Skills

- **framer-motion** - Simpler declarative approach for React
- **scroll-animations** - More scroll-trigger patterns
- **svg-animations** - SVG-specific animations

## Resources

- [GSAP Documentation](https://greensock.com/docs/)
- [GSAP Cheatsheet](https://greensock.com/cheatsheet/)
- Use `mcp__plugin_context7_context7__query-docs` with `gsap` for latest API

## Author

Created by Brookside BI as part of React Animation Studio
