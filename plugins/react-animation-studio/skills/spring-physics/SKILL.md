---
name: spring-physics
description: "Expert knowledge for physics-based spring animations - natural, organic motion that follows real-world physics principles for delightful user experiences."
---

# Spring Physics Skill

Expert knowledge for physics-based spring animations - natural, organic motion that follows real-world physics principles for delightful user experiences.

## When to Use

Activate this skill when:
- User wants "natural", "bouncy", or "organic" motion
- Animations need to feel responsive and alive
- Working with drag and drop interactions
- Need interruptible animations that feel natural
- Building gesture-driven interfaces
- Tuning animation "feel" for specific brand personality

## File Patterns

- `**/*.tsx` with spring configurations
- `**/hooks/use*Spring*.ts`
- `**/animations/springs.ts`
- Files with `@react-spring/web` imports
- Framer Motion files with `type: "spring"`

## Core Concept: Spring Dynamics

Springs simulate real-world physics where motion is determined by:
- **Stiffness** - How tight/fast the spring (higher = snappier)
- **Damping** - How much resistance (higher = less bounce)
- **Mass** - How heavy the object (higher = more momentum)

```
                        High Stiffness + Low Damping = Bouncy
                        High Stiffness + High Damping = Snappy
                        Low Stiffness + High Damping = Sluggish
                        Low Stiffness + Low Damping = Wobbly
```

## Spring Libraries

### Framer Motion Springs
```typescript
import { motion } from 'framer-motion';

// Basic spring
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 30,
  }}
/>

// Spring presets
const springPresets = {
  // Snappy - immediate response
  snappy: { type: 'spring', stiffness: 400, damping: 30 },

  // Bouncy - playful feel
  bouncy: { type: 'spring', stiffness: 300, damping: 10 },

  // Gentle - soft transitions
  gentle: { type: 'spring', stiffness: 100, damping: 20 },

  // Stiff - no bounce
  stiff: { type: 'spring', stiffness: 500, damping: 50 },

  // Wobbly - jelly-like
  wobbly: { type: 'spring', stiffness: 150, damping: 8 },
};

// Duration-based spring (auto-calculates physics)
transition: {
  type: 'spring',
  duration: 0.5,
  bounce: 0.25, // 0 = no bounce, 1 = very bouncy
}
```

### React Spring
```typescript
import { useSpring, animated } from '@react-spring/web';

function Component() {
  const springs = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: {
      mass: 1,
      tension: 280,    // Similar to stiffness
      friction: 20,    // Similar to damping
      // Or use preset
      // ...config.gentle
    },
  });

  return <animated.div style={springs}>Content</animated.div>;
}

// React Spring presets
import { config } from '@react-spring/web';

config.default    // { mass: 1, tension: 170, friction: 26 }
config.gentle     // { mass: 1, tension: 120, friction: 14 }
config.wobbly     // { mass: 1, tension: 180, friction: 12 }
config.stiff      // { mass: 1, tension: 210, friction: 20 }
config.slow       // { mass: 1, tension: 280, friction: 60 }
config.molasses   // { mass: 1, tension: 280, friction: 120 }
```

## Tuning Springs

### Visual Guide to Parameters

```
Stiffness (tension):
100  |▓░░░░░░░░░| Slow, gentle
200  |▓▓░░░░░░░░| Moderate
400  |▓▓▓▓░░░░░░| Quick, responsive (recommended default)
600  |▓▓▓▓▓▓░░░░| Fast, snappy
1000 |▓▓▓▓▓▓▓▓▓▓| Very fast, almost instant

Damping (friction):
5    |▓░░░░░░░░░| Very bouncy, oscillates many times
15   |▓▓░░░░░░░░| Bouncy, 2-3 oscillations
30   |▓▓▓▓░░░░░░| Slight overshoot, settles quickly (recommended)
50   |▓▓▓▓▓▓░░░░| No bounce, smooth stop
100  |▓▓▓▓▓▓▓▓▓▓| Very damped, sluggish feel

Mass:
0.5  |▓░░░░░░░░░| Light, quick response
1    |▓▓▓▓▓░░░░░| Normal (default)
2    |▓▓▓▓▓▓▓▓░░| Heavy, more momentum
```

### Recommended Defaults by Use Case

```typescript
const springConfigs = {
  // UI Micro-interactions (buttons, toggles)
  micro: { stiffness: 500, damping: 35 },

  // Page transitions, modals
  page: { stiffness: 300, damping: 30 },

  // Drag and drop
  drag: { stiffness: 400, damping: 40 },

  // Tooltips, popovers
  tooltip: { stiffness: 600, damping: 40 },

  // Loading indicators
  loading: { stiffness: 200, damping: 20 },

  // Playful/fun interfaces
  playful: { stiffness: 300, damping: 15 },

  // Professional/corporate
  corporate: { stiffness: 400, damping: 45 },

  // Mobile/touch interfaces
  mobile: { stiffness: 350, damping: 30 },
};
```

## Common Patterns

### Interruptible Spring
```typescript
import { motion, useSpring } from 'framer-motion';

function InterruptibleBox() {
  const x = useSpring(0, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      style={{ x }}
      onTap={() => {
        // Spring handles interruption naturally
        x.set(x.get() === 0 ? 200 : 0);
      }}
    />
  );
}
```

### Spring Chain (Staggered Springs)
```typescript
import { useTrail, animated } from '@react-spring/web';

function StaggeredList({ items }: { items: string[] }) {
  const trail = useTrail(items.length, {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: { mass: 1, tension: 280, friction: 20 },
  });

  return (
    <div>
      {trail.map((props, index) => (
        <animated.div key={index} style={props}>
          {items[index]}
        </animated.div>
      ))}
    </div>
  );
}
```

### Gesture-Driven Spring
```typescript
import { motion, useMotionValue, useSpring } from 'framer-motion';

function DraggableCard() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth following with spring
  const springX = useSpring(x, { stiffness: 400, damping: 30 });
  const springY = useSpring(y, { stiffness: 400, damping: 30 });

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      onDrag={(_, info) => {
        x.set(info.point.x);
        y.set(info.point.y);
      }}
    />
  );
}
```

### Velocity-Aware Spring
```typescript
import { motion, useMotionValue, useVelocity, useSpring } from 'framer-motion';

function VelocityAwareElement() {
  const x = useMotionValue(0);
  const velocity = useVelocity(x);

  // Tilt based on velocity
  const rotation = useSpring(
    useTransform(velocity, [-500, 0, 500], [-15, 0, 15]),
    { stiffness: 300, damping: 30 }
  );

  return (
    <motion.div
      style={{ x, rotate: rotation }}
      drag="x"
    />
  );
}
```

## Brand Personality Through Springs

### Professional/Enterprise
```typescript
// Conservative, precise movement
const enterprise = {
  stiffness: 400,
  damping: 45,
  mass: 1,
};
// Feels: Reliable, trustworthy, efficient
```

### Playful/Consumer
```typescript
// Bouncy, energetic movement
const playful = {
  stiffness: 300,
  damping: 15,
  mass: 0.8,
};
// Feels: Fun, engaging, delightful
```

### Luxury/Premium
```typescript
// Slow, graceful movement
const luxury = {
  stiffness: 150,
  damping: 25,
  mass: 1.2,
};
// Feels: Elegant, sophisticated, refined
```

### Fintech/Precision
```typescript
// Quick, no-nonsense movement
const fintech = {
  stiffness: 500,
  damping: 40,
  mass: 1,
};
// Feels: Accurate, responsive, trustworthy
```

## Examples

<example>
Context: User wants a bouncy button click effect
user: "Make the button feel bouncy when clicked"
assistant: Using spring physics for satisfying tap feedback:
```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 15,
  }}
>
  Click me
</motion.button>
```
</example>

<example>
Context: User needs smooth following effect for cursor
user: "Create a smooth cursor follower"
assistant: Using spring to smooth mouse position:
```tsx
function CursorFollower() {
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const springX = useSpring(cursor.x, { stiffness: 150, damping: 20 });
  const springY = useSpring(cursor.y, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <motion.div
      className="fixed w-8 h-8 rounded-full bg-blue-500 pointer-events-none"
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
    />
  );
}
```
</example>

## Related Skills

- **framer-motion** - Full library documentation
- **interaction-specialist** - Gesture patterns
- **gsap** - Alternative physics with inertia

## Author

Created by Brookside BI as part of React Animation Studio
