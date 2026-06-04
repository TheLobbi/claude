---
name: scroll-animations
description: "Expert knowledge for scroll-triggered animations, parallax effects, and scroll-linked interactions that create immersive storytelling experiences."
---

# Scroll Animations Skill

Expert knowledge for scroll-triggered animations, parallax effects, and scroll-linked interactions that create immersive storytelling experiences.

## When to Use

Activate this skill when:
- User wants animations triggered by scrolling
- Building parallax scrolling effects
- Creating scroll-linked progress indicators
- Implementing reveal-on-scroll patterns
- Building horizontal scroll sections
- Need scroll-based storytelling

## File Patterns

- `**/*.tsx` with scroll-related hooks
- `**/hooks/useScroll*.ts`
- Files with `ScrollTrigger` imports
- Files with `useScroll`, `useInView` from framer-motion
- Intersection Observer usage

## Scroll Animation Libraries

### Framer Motion Scroll
```typescript
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
```

### GSAP ScrollTrigger
```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

### Intersection Observer (Native)
```typescript
const observer = new IntersectionObserver(callback, options);
```

## Framer Motion Patterns

### Basic Scroll Progress
```typescript
import { motion, useScroll, useTransform } from 'framer-motion';

function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-blue-500 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
```

### Parallax Effect
```typescript
function Parallax() {
  const { scrollY } = useScroll();

  // Background moves slower than foreground
  const backgroundY = useTransform(scrollY, [0, 1000], [0, -200]);
  const foregroundY = useTransform(scrollY, [0, 1000], [0, -400]);

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ y: backgroundY, backgroundImage: 'url(bg.jpg)' }}
      />
      <motion.div
        className="relative z-10"
        style={{ y: foregroundY }}
      >
        <h1>Foreground Content</h1>
      </motion.div>
    </div>
  );
}
```

### Element-Linked Scroll
```typescript
function ElementParallax() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], // When to start/end tracking
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className="h-screen flex items-center justify-center"
    >
      Content that fades and moves with scroll
    </motion.div>
  );
}
```

### useInView for Reveal
```typescript
import { motion, useInView } from 'framer-motion';

function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,         // Only trigger once
    margin: '-100px',   // Trigger 100px before entering viewport
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

## GSAP ScrollTrigger Patterns

### Basic Scroll-Triggered Animation
```typescript
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Component() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from('.reveal-item', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      scrollTrigger: {
        trigger: '.reveal-container',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
        // markers: true, // Debug
      },
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <div className="reveal-container">
        <div className="reveal-item">Item 1</div>
        <div className="reveal-item">Item 2</div>
        <div className="reveal-item">Item 3</div>
      </div>
    </div>
  );
}
```

### Scrub Animation (Linked to Scroll Position)
```typescript
useGSAP(() => {
  gsap.to('.progress-bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '.content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true, // Links animation to scroll position
    },
  });
});
```

### Pin Section (Sticky Animation)
```typescript
useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.pin-section',
      start: 'top top',
      end: '+=300%', // 3x viewport height of scrolling
      pin: true,
      scrub: 1,
    },
  });

  tl.to('.step-1', { opacity: 0 })
    .to('.step-2', { opacity: 1 })
    .to('.step-2', { opacity: 0 })
    .to('.step-3', { opacity: 1 });
});
```

### Horizontal Scroll Section
```typescript
useGSAP(() => {
  const panels = gsap.utils.toArray('.panel');

  gsap.to(panels, {
    xPercent: -100 * (panels.length - 1),
    ease: 'none',
    scrollTrigger: {
      trigger: '.horizontal-container',
      pin: true,
      scrub: 1,
      snap: 1 / (panels.length - 1),
      end: () => '+=' + document.querySelector('.horizontal-container')!.offsetWidth,
    },
  });
});
```

## Intersection Observer (Native)

### Custom useInView Hook
```typescript
import { useState, useEffect, useRef, RefObject } from 'react';

interface InViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView<T extends HTMLElement>(
  options: InViewOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, inView];
}

// Usage
function Component() {
  const [ref, inView] = useInView<HTMLDivElement>({ triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      Content reveals when scrolled into view
    </div>
  );
}
```

## Advanced Patterns

### Scroll-Linked Text Reveal
```typescript
function TextReveal() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const words = 'This text reveals word by word'.split(' ');

  return (
    <p ref={ref} className="text-4xl font-bold">
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        const opacity = useTransform(
          scrollYProgress,
          [start, end],
          [0.2, 1]
        );

        return (
          <motion.span
            key={i}
            style={{ opacity }}
            className="inline-block mr-2"
          >
            {word}
          </motion.span>
        );
      })}
    </p>
  );
}
```

### Scroll-Based 3D Card
```typescript
function Scroll3DCard() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [45, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        transformPerspective: 1000,
      }}
      className="bg-white rounded-xl shadow-xl p-8"
    >
      Card content
    </motion.div>
  );
}
```

### Progress-Based Section Navigator
```typescript
function SectionNavigator() {
  const sections = ['intro', 'features', 'pricing', 'contact'];
  const { scrollYProgress } = useScroll();

  const activeIndex = useTransform(
    scrollYProgress,
    sections.map((_, i) => i / sections.length),
    sections.map((_, i) => i)
  );

  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2">
      {sections.map((section, i) => (
        <motion.button
          key={section}
          className="block w-3 h-3 rounded-full my-2"
          style={{
            backgroundColor: useTransform(
              activeIndex,
              [i - 0.5, i, i + 0.5],
              ['#ccc', '#3b82f6', '#ccc']
            ),
          }}
          onClick={() => {
            document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      ))}
    </nav>
  );
}
```

## Examples

<example>
Context: User wants elements to fade in as they scroll
user: "Animate these cards to fade in when scrolling down"
assistant: Using Framer Motion's useInView for reveal:
```tsx
import { motion, useInView } from 'framer-motion';

function FadeInCard({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Usage
<div className="grid grid-cols-3 gap-4">
  {cards.map((card, i) => (
    <FadeInCard key={card.id} delay={i * 0.1}>
      <Card>{card.content}</Card>
    </FadeInCard>
  ))}
</div>
```
</example>

<example>
Context: User needs a parallax hero section
user: "Create a parallax scrolling effect for the hero"
assistant: Using scroll-linked transforms for parallax:
```tsx
function ParallaxHero() {
  const { scrollY } = useScroll();

  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const textY = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.img
        src="/hero-bg.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ y: backgroundY }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center h-full"
        style={{ y: textY, opacity }}
      >
        <h1 className="text-6xl font-bold text-white">Welcome</h1>
      </motion.div>
    </div>
  );
}
```
</example>

## Related Skills

- **framer-motion** - Core animation library
- **gsap** - Advanced scroll triggers
- **transition-engineer** - Page transitions

## Author

Created by Brookside BI as part of React Animation Studio
