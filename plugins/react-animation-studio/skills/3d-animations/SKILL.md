---
name: 3d-animations
description: "Expert knowledge for CSS/JS-based 3D animations - perspective transforms, depth effects, card flips, cube rotations, and parallax depth without WebGL."
---

# 3D Animations Skill

Expert knowledge for CSS/JS-based 3D animations - perspective transforms, depth effects, card flips, cube rotations, and parallax depth without WebGL.

## When to Use

Activate this skill when:
- User wants 3D flip cards
- Creating perspective-based animations
- Building parallax depth effects
- Need rotating cubes or 3D objects
- Creating tilt-on-hover effects
- Building 3D carousels

## File Patterns

- `**/*.tsx` with 3D transform components
- `**/components/*3D*.tsx`
- `**/components/*Flip*.tsx`
- `**/components/*Tilt*.tsx`

## Core Concepts

### Perspective
```css
/* Parent container needs perspective */
.perspective-container {
  perspective: 1000px;
  perspective-origin: center;
}

/* Child can now use 3D transforms */
.card-3d {
  transform-style: preserve-3d;
  transform: rotateY(45deg);
}
```

## 3D Animation Types

### 1. 3D Flip Cards

#### Basic Flip Card
```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
}

export function FlipCard({ front, back }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-64 h-80 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}
```

#### Flip Card on Hover
```tsx
export function HoverFlipCard({ front, back }: FlipCardProps) {
  return (
    <motion.div
      className="relative w-64 h-80 cursor-pointer group"
      style={{ perspective: '1000px' }}
      whileHover="flipped"
      initial="initial"
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        variants={{
          initial: { rotateY: 0 },
          flipped: { rotateY: 180 },
        }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute inset-0 bg-white rounded-xl shadow-xl p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 bg-slate-900 text-white rounded-xl shadow-xl p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

### 2. Tilt Effects

#### Tilt on Hover
```tsx
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function TiltCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="relative bg-white rounded-xl shadow-xl p-6"
      style={{
        perspective: '1000px',
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ transform: 'translateZ(50px)' }}>{children}</div>
    </motion.div>
  );
}
```

#### Tilt with Shine Effect
```tsx
export function ShinyTiltCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]));
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]));
  const shineX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const shineY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-8"
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {/* Shine overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.3) 0%, transparent 50%)`,
        }}
      />
      <div style={{ transform: 'translateZ(30px)' }}>{children}</div>
    </motion.div>
  );
}
```

### 3. 3D Rotating Cube

#### CSS Cube
```tsx
export function RotatingCube({ faces }: { faces: React.ReactNode[] }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => ({
        x: prev.x + 0.5,
        y: prev.y + 0.5,
      }));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const size = 150;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: '600px',
      }}
    >
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Front */}
        <div
          className="absolute bg-purple-500/90 border border-purple-300"
          style={{
            width: size,
            height: size,
            transform: `translateZ(${size / 2}px)`,
          }}
        >
          {faces[0]}
        </div>

        {/* Back */}
        <div
          className="absolute bg-blue-500/90 border border-blue-300"
          style={{
            width: size,
            height: size,
            transform: `rotateY(180deg) translateZ(${size / 2}px)`,
          }}
        >
          {faces[1]}
        </div>

        {/* Left */}
        <div
          className="absolute bg-green-500/90 border border-green-300"
          style={{
            width: size,
            height: size,
            transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
          }}
        >
          {faces[2]}
        </div>

        {/* Right */}
        <div
          className="absolute bg-yellow-500/90 border border-yellow-300"
          style={{
            width: size,
            height: size,
            transform: `rotateY(90deg) translateZ(${size / 2}px)`,
          }}
        >
          {faces[3]}
        </div>

        {/* Top */}
        <div
          className="absolute bg-pink-500/90 border border-pink-300"
          style={{
            width: size,
            height: size,
            transform: `rotateX(90deg) translateZ(${size / 2}px)`,
          }}
        >
          {faces[4]}
        </div>

        {/* Bottom */}
        <div
          className="absolute bg-cyan-500/90 border border-cyan-300"
          style={{
            width: size,
            height: size,
            transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
          }}
        >
          {faces[5]}
        </div>
      </div>
    </div>
  );
}
```

### 4. Parallax Depth Layers

#### Layered Parallax
```tsx
export function ParallaxLayers({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Different depth multipliers for each layer
  const layer1X = useTransform(x, (v) => v * 0.1);
  const layer1Y = useTransform(y, (v) => v * 0.1);
  const layer2X = useTransform(x, (v) => v * 0.3);
  const layer2Y = useTransform(y, (v) => v * 0.3);
  const layer3X = useTransform(x, (v) => v * 0.5);
  const layer3Y = useTransform(y, (v) => v * 0.5);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    x.set(e.clientX - rect.left - centerX);
    y.set(e.clientY - rect.top - centerY);
  };

  return (
    <div
      className="relative h-96 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {/* Background layer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-900 to-slate-900"
        style={{ x: layer1X, y: layer1Y }}
      />

      {/* Middle layer */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: layer2X, y: layer2Y }}
      >
        <div className="w-32 h-32 bg-purple-500/30 rounded-full blur-xl" />
      </motion.div>

      {/* Foreground layer */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: layer3X, y: layer3Y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

### 5. 3D Carousel

#### Simple 3D Carousel
```tsx
export function Carousel3D({ items }: { items: React.ReactNode[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const angleStep = 360 / items.length;
  const radius = 300;

  return (
    <div className="relative h-80" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: -currentIndex * angleStep }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48"
            style={{
              transform: `rotateY(${i * angleStep}deg) translateZ(${radius}px)`,
            }}
          >
            {item}
          </div>
        ))}
      </motion.div>

      {/* Controls */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2"
        onClick={() => setCurrentIndex((i) => i - 1)}
      >
        Prev
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2"
        onClick={() => setCurrentIndex((i) => i + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

### 6. Door/Reveal Animation

#### 3D Door Opening
```tsx
export function Door3D({
  children,
  isOpen,
}: {
  children: React.ReactNode;
  isOpen: boolean;
}) {
  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      {/* Content behind door */}
      <div className="absolute inset-0">{children}</div>

      {/* Door */}
      <motion.div
        className="absolute inset-0 bg-slate-800 origin-left"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isOpen ? -105 : 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-8 bg-slate-600 rounded" />
      </motion.div>
    </div>
  );
}
```

## Examples

<example>
Context: User wants a flip card for pricing
user: "Create a pricing card that flips to show features on hover"
assistant: Using HoverFlipCard:
```tsx
<HoverFlipCard
  front={
    <div className="text-center">
      <h3>Pro Plan</h3>
      <p className="text-3xl">$29/mo</p>
    </div>
  }
  back={
    <ul>
      <li>Unlimited projects</li>
      <li>Priority support</li>
      <li>Advanced analytics</li>
    </ul>
  }
/>
```
</example>

<example>
Context: User wants a tilt effect on cards
user: "Make the card tilt when I move my mouse over it"
assistant: Using TiltCard:
```tsx
<TiltCard>
  <h3>Interactive Card</h3>
  <p>Move your mouse to see the 3D tilt effect!</p>
</TiltCard>
```
</example>

## Related Skills

- **creative-effects** - More artistic effects
- **framer-motion** - Animation engine
- **css-animations** - CSS-based 3D

## Author

Created by Brookside BI as part of React Animation Studio
