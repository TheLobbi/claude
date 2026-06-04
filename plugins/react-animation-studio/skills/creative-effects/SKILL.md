---
name: creative-effects
description: "Expert knowledge for artistic and creative animation effects - morphing shapes, liquid animations, glitch effects, distortion, and experimental visual techniques that push creative boundaries."
---

# Creative Effects Skill

Expert knowledge for artistic and creative animation effects - morphing shapes, liquid animations, glitch effects, distortion, and experimental visual techniques that push creative boundaries.

## When to Use

Activate this skill when:
- User wants liquid/fluid animations
- Creating morphing shape transitions
- Building glitch or distortion effects
- Need experimental/artistic visuals
- Creating loading animations with personality
- Building creative reveals and transitions

## File Patterns

- `**/*.tsx` with creative components
- `**/components/Creative*.tsx`
- `**/components/Effect*.tsx`
- `**/components/Liquid*.tsx`

## Creative Effect Types

### 1. Morphing Shapes

#### Liquid Button
```tsx
import { motion, useAnimation } from 'framer-motion';

export function LiquidButton({ children }: { children: React.ReactNode }) {
  const controls = useAnimation();

  const liquidVariants = {
    rest: {
      d: "M0,20 Q25,0 50,20 T100,20 L100,80 Q75,100 50,80 T0,80 Z",
    },
    hover: {
      d: "M0,30 Q25,10 50,30 T100,30 L100,70 Q75,90 50,70 T0,70 Z",
    },
    tap: {
      d: "M0,25 Q25,15 50,25 T100,25 L100,75 Q75,85 50,75 T0,75 Z",
    },
  };

  return (
    <motion.button
      className="relative px-8 py-4 text-white font-medium"
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.path
          fill="url(#liquid-gradient)"
          variants={liquidVariants}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
        <defs>
          <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
```

#### Morphing Blob
```tsx
export function MorphingBlob() {
  const paths = [
    "M45.3,-51.2C58.3,-40.8,68.4,-25.6,71.8,-8.4C75.2,8.8,71.9,28,61.6,41.8C51.3,55.6,34,64,15.6,68.9C-2.8,73.8,-22.3,75.2,-38.1,67.6C-53.9,60,-66,43.4,-71.4,24.9C-76.8,6.4,-75.5,-14,-67.4,-30.7C-59.3,-47.4,-44.4,-60.4,-28.6,-69.7C-12.8,-79,-0.1,-84.6,8.9,-78.5C17.9,-72.4,32.3,-54.6,45.3,-51.2Z",
    "M39.9,-47.1C53.3,-36.9,66.7,-26.3,72.2,-11.9C77.7,2.5,75.4,20.7,66.4,35.1C57.4,49.5,41.7,60.1,24.6,66.2C7.5,72.3,-11,73.9,-27.8,68.4C-44.6,62.9,-59.7,50.3,-67.8,34.3C-75.9,18.3,-77,-1.1,-72.1,-18.7C-67.2,-36.3,-56.3,-52.1,-42.4,-62.1C-28.5,-72.1,-11.6,-76.3,1.8,-78.5C15.2,-80.7,26.5,-57.3,39.9,-47.1Z",
    "M42.7,-49.7C55.5,-38.8,66.1,-25.3,69.7,-9.8C73.3,5.7,69.9,23.2,60.6,37.4C51.3,51.6,36.1,62.5,19.3,68.3C2.5,74.1,-15.9,74.8,-32.8,68.7C-49.7,62.6,-65.1,49.7,-72.6,33.4C-80.1,17.1,-79.7,-2.6,-73.3,-20C-66.9,-37.4,-54.5,-52.5,-40.1,-63C-25.7,-73.5,-9.3,-79.4,3.6,-83.7C16.5,-88,29.9,-60.6,42.7,-49.7Z",
  ];

  return (
    <motion.svg viewBox="-100 -100 200 200" className="w-64 h-64">
      <motion.path
        fill="url(#blob-gradient)"
        animate={{
          d: paths,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <defs>
        <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="50%" stopColor="#764ba2" />
          <stop offset="100%" stopColor="#f093fb" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
```

### 2. Glitch Effects

#### Glitch Text
```tsx
export function GlitchText({ children }: { children: string }) {
  return (
    <div className="relative inline-block">
      {/* Main text */}
      <span className="relative z-10">{children}</span>

      {/* Glitch layer 1 - Red */}
      <motion.span
        className="absolute inset-0 text-red-500 opacity-80"
        style={{ clipPath: 'inset(0 0 0 0)' }}
        animate={{
          x: [-2, 2, -2],
          clipPath: [
            'inset(40% 0 61% 0)',
            'inset(92% 0 1% 0)',
            'inset(43% 0 1% 0)',
            'inset(25% 0 58% 0)',
          ],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        {children}
      </motion.span>

      {/* Glitch layer 2 - Cyan */}
      <motion.span
        className="absolute inset-0 text-cyan-500 opacity-80"
        style={{ clipPath: 'inset(0 0 0 0)' }}
        animate={{
          x: [2, -2, 2],
          clipPath: [
            'inset(85% 0 7% 0)',
            'inset(15% 0 80% 0)',
            'inset(45% 0 50% 0)',
            'inset(70% 0 25% 0)',
          ],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        {children}
      </motion.span>
    </div>
  );
}
```

#### Glitch Image
```tsx
export function GlitchImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden">
      <img src={src} alt={alt} className="relative z-10" />

      <motion.img
        src={src}
        alt=""
        className="absolute inset-0 opacity-50"
        style={{ mixBlendMode: 'multiply' }}
        animate={{
          x: [-5, 5, -5],
          filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)'],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-cyan-500/20"
        animate={{
          opacity: [0, 0.3, 0],
          scaleY: [1, 1.02, 1],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />
    </div>
  );
}
```

### 3. Liquid/Fluid Effects

#### Liquid Fill
```tsx
export function LiquidFill({ progress = 0.7 }: { progress?: number }) {
  const fillHeight = progress * 100;

  return (
    <div className="relative w-32 h-48 bg-slate-800 rounded-2xl overflow-hidden">
      {/* Liquid */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400"
        initial={{ height: 0 }}
        animate={{ height: `${fillHeight}%` }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        {/* Wave effect */}
        <svg
          className="absolute top-0 left-0 w-full"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          style={{ transform: 'translateY(-50%)' }}
        >
          <motion.path
            fill="currentColor"
            className="text-blue-400"
            d="M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z"
            animate={{
              d: [
                "M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z",
                "M0,10 Q25,20 50,10 T100,10 L100,20 L0,20 Z",
                "M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>

      {/* Bubbles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            bottom: 0,
          }}
          animate={{
            y: [0, -fillHeight * 2],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: i * 0.3,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}
```

### 4. Distortion Effects

#### Magnetic Button
```tsx
export function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    setPosition({
      x: distanceX * 0.3,
      y: distanceY * 0.3,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium"
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.button>
  );
}
```

#### Elastic Container
```tsx
export function ElasticContainer({ children }: { children: React.ReactNode }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      className="cursor-pointer"
      animate={{
        scaleX: isPressed ? 1.1 : 1,
        scaleY: isPressed ? 0.9 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 10,
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </motion.div>
  );
}
```

### 5. Creative Loaders

#### DNA Helix Loader
```tsx
export function DNALoader() {
  const dots = Array.from({ length: 10 });

  return (
    <div className="flex items-center justify-center h-20">
      {dots.map((_, i) => (
        <div key={i} className="relative w-4 mx-0.5">
          <motion.div
            className="absolute w-3 h-3 bg-blue-500 rounded-full"
            animate={{
              y: [-15, 15, -15],
              scale: [1, 0.8, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute w-3 h-3 bg-purple-500 rounded-full"
            animate={{
              y: [15, -15, 15],
              scale: [0.8, 1, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

#### Orbiting Loader
```tsx
export function OrbitingLoader() {
  const orbits = [
    { radius: 20, duration: 1.5, color: '#667eea' },
    { radius: 35, duration: 2, color: '#764ba2' },
    { radius: 50, duration: 2.5, color: '#f093fb' },
  ];

  return (
    <div className="relative w-32 h-32">
      {/* Center dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 bg-white rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Orbiting dots */}
      {orbits.map((orbit, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full"
          style={{ backgroundColor: orbit.color }}
          animate={{
            x: [orbit.radius, 0, -orbit.radius, 0, orbit.radius],
            y: [0, orbit.radius, 0, -orbit.radius, 0],
          }}
          transition={{
            duration: orbit.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
```

### 6. Reveal Effects

#### Mask Reveal
```tsx
export function MaskReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"
        initial={{ x: '0%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 0.6,
          delay: delay + 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      />
    </div>
  );
}
```

#### Split Reveal
```tsx
export function SplitReveal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10">{children}</div>

      {/* Top curtain */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-slate-900 origin-top"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Bottom curtain */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-slate-900 origin-bottom"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
}
```

## Examples

<example>
Context: User wants a liquid morphing button
user: "Create a button that feels liquid when hovered"
assistant: Using the LiquidButton component:
```tsx
<LiquidButton>Get Started</LiquidButton>
```
The button's background morphs like liquid on hover and tap.
</example>

<example>
Context: User wants glitch text effect
user: "Add a glitch effect to my heading"
assistant: Using GlitchText:
```tsx
<h1 className="text-4xl font-bold">
  <GlitchText>CYBERPUNK 2077</GlitchText>
</h1>
```
</example>

## Related Skills

- **background-animations** - Full-page creative backgrounds
- **accent-animations** - Decorative elements
- **svg-animations** - Path morphing

## Author

Created by Brookside BI as part of React Animation Studio
