---
name: react-animation-studio:animate-scroll
intent: /animate-scroll
tags:
  - react-animation-studio
  - command
  - animate-scroll
inputs: []
risk: medium
cost: medium
description: Add scroll-triggered animations to elements and sections with intelligent viewport detection.
---

# /animate-scroll

Add scroll-triggered animations to elements and sections with intelligent viewport detection.

## Usage

```
/animate-scroll <target> [animation-type]
```

## Description

The `/animate-scroll` command adds scroll-triggered animations to elements. It automatically sets up intersection observers or scroll progress tracking to trigger animations when elements enter the viewport.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--library <lib>` | Animation library | framer-motion |
| `--trigger <point>` | When to trigger (top, center, bottom, percentage) | 80% |
| `--once` | Only animate once | true |
| `--scrub` | Link animation to scroll position | false |
| `--pin` | Pin element during scroll | false |
| `--parallax <speed>` | Parallax factor (0.1-2) | - |

## Workflow

1. **Identify Target** - Locate the element or section
2. **Configure Trigger** - Set scroll trigger point
3. **Apply Animation** - Add reveal, parallax, or scrub animation
4. **Handle Accessibility** - Respect reduced motion preferences

## Examples

```bash
# Basic reveal animation
/animate-scroll .card-section reveal

# Parallax effect
/animate-scroll .hero-image --parallax 0.5

# Scrub animation linked to scroll
/animate-scroll .progress-bar --scrub

# Pinned section with animation
/animate-scroll .feature-section --pin --scrub

# Custom trigger point
/animate-scroll .cta-section --trigger 50% fade-in-up

# Multiple elements with stagger
/animate-scroll ".grid-item" stagger-reveal
```

## Animation Types

| Type | Description |
|------|-------------|
| `reveal` | Fade in with slight movement |
| `reveal-up` | Slide up while fading in |
| `reveal-left` | Slide from right while fading |
| `reveal-scale` | Scale up while fading in |
| `stagger-reveal` | Staggered reveal for multiple items |
| `parallax` | Move at different scroll speed |
| `progress` | Animate based on scroll progress |
| `pin-scroll` | Pin and animate during scroll |

## Generated Code Examples

### Basic Reveal
```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function RevealSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-20% 0px',
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

### Staggered Grid Reveal
```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function StaggeredGrid({ items }: { items: Item[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="grid grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          {item.content}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Parallax Effect
```tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

function ParallaxImage({ src, speed = 0.5 }: { src: string; speed?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [100 * speed, -100 * speed]
  );

  return (
    <div ref={ref} className="overflow-hidden h-96">
      <motion.img
        src={src}
        style={{ y }}
        className="w-full h-[120%] object-cover"
      />
    </div>
  );
}
```

### Scroll Progress Animation
```tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-500 origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

function ScrollLinkedSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <motion.section
      ref={ref}
      style={{ opacity, scale }}
      className="h-screen flex items-center justify-center"
    >
      Content that scales and fades based on scroll position
    </motion.section>
  );
}
```

### GSAP ScrollTrigger
```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function GSAPScrollReveal() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from('.reveal-item', {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.reveal-container',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="reveal-container">
      <div className="reveal-item">Item 1</div>
      <div className="reveal-item">Item 2</div>
      <div className="reveal-item">Item 3</div>
    </div>
  );
}
```

## Scroll Trigger Options

| Option | Values | Description |
|--------|--------|-------------|
| `start` | `top 80%`, `center`, `bottom` | When animation starts |
| `end` | `bottom 20%`, `center` | When animation ends (for scrub) |
| `scrub` | `true`, `1`, `0.5` | Link to scroll (number = smoothing) |
| `pin` | `true` | Pin element during animation |
| `markers` | `true` | Show debug markers |

## Author

Created by Brookside BI as part of React Animation Studio
