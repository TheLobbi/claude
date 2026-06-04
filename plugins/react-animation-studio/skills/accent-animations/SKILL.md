---
name: accent-animations
description: "Expert knowledge for decorative accent animations - floating shapes, glowing orbs, animated borders, sparkle effects, and embellishments that add visual polish and delight to interfaces."
---

# Accent Animations Skill

Expert knowledge for decorative accent animations - floating shapes, glowing orbs, animated borders, sparkle effects, and embellishments that add visual polish and delight to interfaces.

## When to Use

Activate this skill when:
- User wants decorative floating elements
- Adding glowing or shimmer effects
- Creating animated borders or outlines
- Building sparkle or confetti effects
- Need subtle ambient animations
- Adding visual polish to sections

## File Patterns

- `**/*.tsx` with decorative components
- `**/components/Accent*.tsx`
- `**/components/Decoration*.tsx`
- `**/components/*Sparkle*.tsx`

## Accent Animation Types

### 1. Floating Shapes

#### Floating Orbs
```tsx
import { motion } from 'framer-motion';

interface OrbProps {
  color?: string;
  size?: number;
  blur?: number;
  duration?: number;
}

export function FloatingOrb({
  color = '#667eea',
  size = 300,
  blur = 80,
  duration = 20,
}: OrbProps) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={{
        x: [0, 100, -50, 0],
        y: [0, -80, 40, 0],
        scale: [1, 1.2, 0.9, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <FloatingOrb color="#667eea" size={400} className="top-20 left-20" />
      <FloatingOrb color="#764ba2" size={300} duration={25} className="bottom-40 right-20" />
      <FloatingOrb color="#f093fb" size={250} duration={18} className="top-1/2 left-1/3" />
    </div>
  );
}
```

#### Floating Geometric Shapes
```tsx
const shapes = ['circle', 'square', 'triangle'] as const;

interface FloatingShapeProps {
  shape: typeof shapes[number];
  size?: number;
  color?: string;
  duration?: number;
  delay?: number;
}

export function FloatingShape({
  shape,
  size = 20,
  color = 'rgba(99, 102, 241, 0.3)',
  duration = 15,
  delay = 0,
}: FloatingShapeProps) {
  const shapeStyles = {
    circle: { borderRadius: '50%' },
    square: { borderRadius: '4px' },
    triangle: {
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      borderRadius: '0',
    },
  };

  return (
    <motion.div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        ...shapeStyles[shape],
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, -15, 0],
        rotate: [0, 180, 360],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function FloatingShapes({ count = 15 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    shape: shapes[i % shapes.length],
    size: Math.random() * 30 + 10,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          <FloatingShape
            shape={item.shape}
            size={item.size}
            duration={item.duration}
            delay={item.delay}
          />
        </div>
      ))}
    </div>
  );
}
```

### 2. Glow Effects

#### Pulsing Glow
```tsx
export function PulsingGlow({
  color = '#667eea',
  size = 200,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
```

#### Glow Border
```tsx
export function GlowBorder({
  children,
  color = '#667eea',
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="relative">
      <motion.div
        className="absolute -inset-0.5 rounded-xl opacity-75 blur-sm"
        style={{ background: color }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="relative bg-slate-900 rounded-xl">{children}</div>
    </div>
  );
}
```

#### Rainbow Glow Border
```tsx
export function RainbowGlowBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <motion.div
        className="absolute -inset-1 rounded-xl opacity-75 blur"
        style={{
          background: 'linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)',
          backgroundSize: '400%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative bg-slate-900 rounded-xl">{children}</div>
    </div>
  );
}
```

### 3. Sparkle Effects

#### Sparkle Component
```tsx
interface SparkleProps {
  size?: number;
  color?: string;
}

export function Sparkle({ size = 20, color = '#FFC700' }: SparkleProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      initial={{ scale: 0, rotate: 0 }}
      animate={{
        scale: [0, 1, 0],
        rotate: [0, 180],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 0.8,
        ease: 'easeOut',
      }}
    >
      <path
        d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
        fill={color}
      />
    </motion.svg>
  );
}
```

#### Sparkle Wrapper
```tsx
export function SparkleWrapper({
  children,
  sparkleCount = 3,
}: {
  children: React.ReactNode;
  sparkleCount?: number;
}) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sparkle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 15 + 10,
        color: ['#FFC700', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 4)],
      };
      setSparkles((prev) => [...prev.slice(-sparkleCount + 1), sparkle]);
    }, 500);

    return () => clearInterval(interval);
  }, [sparkleCount]);

  return (
    <span className="relative inline-block">
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Sparkle size={sparkle.size} color={sparkle.color} />
        </span>
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}
```

### 4. Animated Borders

#### Gradient Border Animation
```tsx
export function AnimatedGradientBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-[2px] rounded-xl overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #ff0080)',
          backgroundSize: '300% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative bg-slate-900 rounded-xl">{children}</div>
    </div>
  );
}
```

#### Rotating Border
```tsx
export function RotatingBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-[2px] rounded-xl overflow-hidden">
      <motion.div
        className="absolute inset-[-50%] w-[200%] h-[200%]"
        style={{
          background: 'conic-gradient(from 0deg, #ff0080, #ff8c00, #40e0d0, #7928ca, #ff0080)',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative bg-slate-900 rounded-xl">{children}</div>
    </div>
  );
}
```

### 5. Shimmer Effects

#### Shimmer Highlight
```tsx
export function ShimmerHighlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block overflow-hidden">
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      />
    </span>
  );
}
```

#### Button Shimmer
```tsx
export function ShimmerButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      className="relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
        initial={{ x: '-100%' }}
        whileHover={{
          x: '100%',
          transition: { duration: 0.5 },
        }}
      />
    </motion.button>
  );
}
```

### 6. Cursor Effects

#### Cursor Glow
```tsx
export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed w-64 h-64 rounded-full pointer-events-none z-50"
      style={{
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
      }}
      animate={{
        x: position.x - 128,
        y: position.y - 128,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
    />
  );
}
```

### 7. Decorative Lines

#### Animated Underline
```tsx
export function AnimatedUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block group">
      {children}
      <motion.span
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
        initial={{ width: '0%' }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </span>
  );
}
```

#### Connecting Lines
```tsx
export function ConnectingLine({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  const length = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

  return (
    <motion.div
      className="absolute h-0.5 bg-gradient-to-r from-purple-500 to-transparent origin-left"
      style={{
        left: from.x,
        top: from.y,
        width: 0,
        transform: `rotate(${angle}deg)`,
      }}
      animate={{ width: length }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}
```

## Examples

<example>
Context: User wants decorative floating elements around content
user: "Add floating shapes around my hero section"
assistant: Using FloatingShapes for ambient decoration:
```tsx
<div className="relative">
  <FloatingShapes count={20} />
  <HeroContent />
</div>
```
</example>

<example>
Context: User wants a glowing effect on a card
user: "Make this card have a pulsing glow effect"
assistant: Wrapping with GlowBorder:
```tsx
<GlowBorder color="#667eea">
  <Card>Content</Card>
</GlowBorder>
```
</example>

## Related Skills

- **background-animations** - Full-page backgrounds
- **creative-effects** - Morphing and liquid effects
- **css-animations** - Keyframe-based decorations

## Author

Created by Brookside BI as part of React Animation Studio
