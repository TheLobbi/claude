---
name: svg-animations
description: "Expert knowledge for SVG path animations, morphing shapes, and vector graphics effects that create stunning visual experiences with resolution-independent graphics."
---

# SVG Animations Skill

Expert knowledge for SVG path animations, morphing shapes, and vector graphics effects that create stunning visual experiences with resolution-independent graphics.

## When to Use

Activate this skill when:
- User wants to animate SVG icons or illustrations
- Need path drawing/tracing animations
- Building morphing shape transitions
- Creating animated logos or icons
- Working with SVG line art animations
- Building data visualization animations

## File Patterns

- `**/*.svg` files
- `**/*.tsx` containing SVG elements
- `**/icons/*.tsx` with animated icons
- `**/components/**/Animated*.tsx` with SVG
- Files with `pathLength`, `stroke-dasharray`

## Core Techniques

### Path Drawing Animation (Framer Motion)
```typescript
import { motion } from 'framer-motion';

function DrawPath() {
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <motion.path
        d="M10 50 Q 50 10, 90 50 T 90 90"
        fill="transparent"
        stroke="#3B82F6"
        strokeWidth="4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
    </svg>
  );
}
```

### Path Drawing with CSS
```css
.svg-path {
  stroke-dasharray: 1000; /* Total path length */
  stroke-dashoffset: 1000; /* Start hidden */
  animation: draw 2s ease-in-out forwards;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

### Calculate Path Length
```typescript
// Get actual path length for accurate animation
useEffect(() => {
  const path = document.querySelector('.animated-path') as SVGPathElement;
  if (path) {
    const length = path.getTotalLength();
    console.log('Path length:', length);
  }
}, []);
```

## Animated Icon Components

### Checkmark Animation
```typescript
import { motion } from 'framer-motion';

function AnimatedCheck({ isVisible }: { isVisible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      {/* Circle background */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="#22C55E"
        initial={{ scale: 0 }}
        animate={{ scale: isVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Checkmark path */}
      <motion.path
        d="M6 12l4 4 8-8"
        fill="transparent"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  );
}
```

### Hamburger to X Animation
```typescript
import { motion } from 'framer-motion';

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  const variant = isOpen ? 'open' : 'closed';

  const topLineVariants = {
    closed: { rotate: 0, y: 0 },
    open: { rotate: 45, y: 8 },
  };

  const middleLineVariants = {
    closed: { opacity: 1 },
    open: { opacity: 0 },
  };

  const bottomLineVariants = {
    closed: { rotate: 0, y: 0 },
    open: { rotate: -45, y: -8 },
  };

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <motion.line
        x1="4" y1="6" x2="20" y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={topLineVariants}
        animate={variant}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: 'center' }}
      />
      <motion.line
        x1="4" y1="12" x2="20" y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={middleLineVariants}
        animate={variant}
        transition={{ duration: 0.2 }}
      />
      <motion.line
        x1="4" y1="18" x2="20" y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={bottomLineVariants}
        animate={variant}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}
```

### Loading Spinner
```typescript
import { motion } from 'framer-motion';

function Spinner() {
  return (
    <svg viewBox="0 0 50 50" className="w-12 h-12">
      {/* Background circle */}
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="4"
      />

      {/* Animated arc */}
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, rotate: 0 }}
        animate={{
          pathLength: [0, 0.5, 0],
          rotate: 360,
        }}
        transition={{
          pathLength: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          rotate: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}
```

## Shape Morphing

### Framer Motion Morphing
```typescript
import { motion, useAnimation } from 'framer-motion';

const shapes = {
  circle: 'M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10',
  square: 'M10,10 L90,10 L90,90 L10,90 Z',
  triangle: 'M50,10 L90,90 L10,90 Z',
};

function MorphingShape() {
  const [currentShape, setCurrentShape] = useState<keyof typeof shapes>('circle');

  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32">
      <motion.path
        fill="#3B82F6"
        animate={{ d: shapes[currentShape] }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </svg>
  );
}
```

### GSAP MorphSVG
```typescript
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

function GSAPMorph() {
  useEffect(() => {
    gsap.to('#shape', {
      duration: 1,
      morphSVG: '#targetShape',
      ease: 'power2.inOut',
    });
  }, []);

  return (
    <svg>
      <path id="shape" d="M10,10 L90,10 L90,90 L10,90 Z" />
      <path id="targetShape" d="M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10" style={{ visibility: 'hidden' }} />
    </svg>
  );
}
```

## Complex SVG Animations

### Animated Logo
```typescript
function AnimatedLogo() {
  const controls = useAnimation();

  const logoVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1, ease: 'easeInOut' },
    },
  };

  const fillVariants = {
    hidden: { fillOpacity: 0 },
    visible: {
      fillOpacity: 1,
      transition: { delay: 0.5, duration: 0.5 },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 200 60"
      className="w-48"
      variants={logoVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Letter outlines */}
      <motion.path
        d="M10,50 L10,10 L40,10 L40,30 L20,30 L20,50"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        variants={pathVariants}
      />
      {/* Fill after stroke */}
      <motion.path
        d="M10,50 L10,10 L40,10 L40,30 L20,30 L20,50"
        fill="#3B82F6"
        variants={fillVariants}
      />
    </motion.svg>
  );
}
```

### Data Visualization Animation
```typescript
function AnimatedBarChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data);

  return (
    <svg viewBox="0 0 300 200" className="w-full h-48">
      {data.map((value, index) => {
        const barHeight = (value / maxValue) * 160;
        const barWidth = 40;
        const gap = 20;
        const x = index * (barWidth + gap) + 20;
        const y = 180 - barHeight;

        return (
          <motion.rect
            key={index}
            x={x}
            y={180}
            width={barWidth}
            height={0}
            fill="#3B82F6"
            rx="4"
            initial={{ height: 0, y: 180 }}
            animate={{ height: barHeight, y }}
            transition={{
              duration: 0.8,
              delay: index * 0.1,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          />
        );
      })}
    </svg>
  );
}
```

### Animated Circle Progress
```typescript
function CircleProgress({ progress }: { progress: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="8"
      />

      {/* Progress circle */}
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Percentage text */}
      <motion.text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold fill-current rotate-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {Math.round(progress * 100)}%
      </motion.text>
    </svg>
  );
}
```

## Performance Tips

1. **Use `will-change: transform`** for GPU acceleration
2. **Optimize SVG paths** - simplify complex paths
3. **Use `pathLength` property** for easy animations
4. **Avoid animating fill/stroke on complex shapes** - use opacity instead
5. **Group related elements** with `<g>` for batch transforms

## Examples

<example>
Context: User wants an animated checkmark icon
user: "Create an animated checkmark that draws itself"
assistant: Using path animation with Framer Motion:
```tsx
function AnimatedCheckmark() {
  return (
    <motion.svg viewBox="0 0 24 24" className="w-8 h-8">
      <motion.path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}
```
</example>

<example>
Context: User needs an animated loading indicator
user: "Build a circular loading spinner with SVG"
assistant: Using stroke animation for smooth loading:
```tsx
function LoadingSpinner() {
  return (
    <motion.svg viewBox="0 0 50 50" className="w-10 h-10 animate-spin">
      <circle
        cx="25" cy="25" r="20"
        fill="none" stroke="#E5E7EB" strokeWidth="4"
      />
      <motion.circle
        cx="25" cy="25" r="20"
        fill="none" stroke="#3B82F6" strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="125.6" // 2 * PI * 20
        initial={{ strokeDashoffset: 125.6 }}
        animate={{ strokeDashoffset: 31.4 }} // 75% of circumference
      />
    </motion.svg>
  );
}
```
</example>

## Related Skills

- **framer-motion** - Animation engine
- **motion-designer** - Creative effects
- **gsap** - Advanced morphing with MorphSVG

## Author

Created by Brookside BI as part of React Animation Studio
