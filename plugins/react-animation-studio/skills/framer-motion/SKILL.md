---
name: framer-motion
description: "Expert knowledge for Framer Motion - the production-ready motion library for React. This skill enables declarative animations, gesture recognition, and layout animations with optimal performance."
---

# Framer Motion Skill

Expert knowledge for Framer Motion - the production-ready motion library for React. This skill enables declarative animations, gesture recognition, and layout animations with optimal performance.

## When to Use

Activate this skill when:
- User mentions "framer motion" or "framer"
- Working with `.tsx` or `.jsx` files containing `motion` components
- Need declarative React animations with variants
- Implementing gesture-driven animations (drag, hover, tap)
- Building layout animations with `layoutId`
- Creating enter/exit animations with `AnimatePresence`

## File Patterns

- `**/*.tsx` containing `framer-motion` imports
- `**/*.jsx` containing `motion` components
- `**/animations/*.ts` with variants/transitions
- `**/components/**/use*Animation*.ts`

## Installation

```bash
npm install framer-motion
# or
yarn add framer-motion
# or
pnpm add framer-motion
```

## Core Concepts

### Motion Components
Replace HTML elements with `motion.` prefixed components:
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
```

### Variants
Define reusable animation states:
```tsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div variants={variants} initial="hidden" animate="visible" />
```

### Gestures
Built-in gesture support:
```tsx
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ outline: '2px solid blue' }}
  whileDrag={{ cursor: 'grabbing' }}
/>
```

### Layout Animations
Automatic layout transitions:
```tsx
<motion.div layout>
  {/* Content that changes size/position */}
</motion.div>

// Shared element transitions
<motion.div layoutId="shared-element">...</motion.div>
```

### AnimatePresence
Animate components when they mount/unmount:
```tsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

## Animation Properties

### Transform Properties
```tsx
{
  x: 100,           // translateX (pixels)
  y: 100,           // translateY (pixels)
  z: 100,           // translateZ (pixels)
  rotate: 90,       // rotation (degrees)
  rotateX: 90,      // X-axis rotation
  rotateY: 90,      // Y-axis rotation
  scale: 1.5,       // uniform scale
  scaleX: 1.5,      // X-axis scale
  scaleY: 1.5,      // Y-axis scale
  skew: 10,         // skew (degrees)
  originX: 0.5,     // transform origin X (0-1)
  originY: 0.5,     // transform origin Y (0-1)
}
```

### Style Properties
```tsx
{
  opacity: 0.5,
  backgroundColor: '#ff0000',
  color: '#ffffff',
  borderRadius: 10,
  boxShadow: '0px 10px 30px rgba(0,0,0,0.2)',
  width: 200,
  height: 200,
}
```

## Transition Types

### Tween (Default)
```tsx
transition: {
  type: 'tween',
  duration: 0.3,
  ease: 'easeInOut',
  // Or custom cubic-bezier
  ease: [0.25, 0.1, 0.25, 1],
}
```

### Spring
```tsx
transition: {
  type: 'spring',
  stiffness: 400,   // Higher = faster
  damping: 30,      // Higher = less bounce
  mass: 1,          // Higher = more momentum
  velocity: 0,      // Initial velocity
}
```

### Inertia (for drag)
```tsx
transition: {
  type: 'inertia',
  velocity: 50,
  power: 0.8,
  timeConstant: 700,
  bounceStiffness: 500,
  bounceDamping: 10,
}
```

## Common Patterns

### Stagger Children
```tsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="visible">
  {items.map(i => (
    <motion.li key={i} variants={item}>{i}</motion.li>
  ))}
</motion.ul>
```

### Orchestrated Animations
```tsx
const sequence = useAnimation();

async function playSequence() {
  await sequence.start({ x: 100 });
  await sequence.start({ y: 100 });
  await sequence.start({ rotate: 180 });
}

<motion.div animate={sequence} />
```

### Scroll-Linked Animation
```tsx
import { useScroll, useTransform, motion } from 'framer-motion';

function ParallaxImage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return <motion.img style={{ y }} />;
}
```

### Drag Constraints
```tsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
  dragElastic={0.2}
  dragMomentum={false}
  onDragEnd={(e, info) => console.log(info.offset, info.velocity)}
/>
```

## Reduced Motion Support

```tsx
import { useReducedMotion } from 'framer-motion';

function Component() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
    />
  );
}
```

## Examples

<example>
Context: User wants to add a fade-in animation to a card
user: "Add a fade-in animation when this card appears"
assistant: Wrapping the card with `motion.div` and adding initial/animate props:
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <Card>{content}</Card>
</motion.div>
```
</example>

<example>
Context: User needs a modal with enter/exit animations
user: "Make the modal animate when opening and closing"
assistant: Using AnimatePresence for mount/unmount animations:
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50"
    >
      <motion.div
        key="modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```
</example>

## Related Skills

- **spring-physics** - Deep dive into spring animation tuning
- **gsap** - Alternative for complex timelines
- **scroll-animations** - Advanced scroll-triggered patterns

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Framer Motion Examples](https://www.framer.com/motion/examples/)
- Use `mcp__plugin_context7_context7__query-docs` with `framer-motion` for latest API

## Author

Created by Brookside BI as part of React Animation Studio
