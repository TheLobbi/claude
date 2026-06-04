---
name: background-animations
description: "Expert knowledge for creating stunning animated backgrounds - gradient flows, particle systems, mesh gradients, aurora effects, wave patterns, and dynamic textures that bring depth and life to your interfaces."
---

# Background Animations Skill

Expert knowledge for creating stunning animated backgrounds - gradient flows, particle systems, mesh gradients, aurora effects, wave patterns, and dynamic textures that bring depth and life to your interfaces.

## When to Use

Activate this skill when:
- User wants animated backgrounds or hero sections
- Building landing pages with dynamic visuals
- Creating gradient animations or color flows
- Implementing particle systems or starfields
- Need mesh gradient or aurora-style effects
- Building wave patterns or liquid backgrounds

## File Patterns

- `**/*.tsx` with background components
- `**/components/Background*.tsx`
- `**/components/Hero*.tsx`
- Files with canvas or WebGL usage

## Background Animation Types

### 1. Animated Gradients

#### Flowing Gradient Background
```tsx
import { motion } from 'framer-motion';

export function FlowingGradient() {
  return (
    <motion.div
      className="absolute inset-0 -z-10"
      style={{
        background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
        backgroundSize: '400% 400%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}
```

#### Radial Gradient Pulse
```tsx
export function RadialPulse() {
  return (
    <motion.div
      className="absolute inset-0 -z-10"
      animate={{
        background: [
          'radial-gradient(circle at 50% 50%, #667eea 0%, transparent 50%)',
          'radial-gradient(circle at 50% 50%, #764ba2 0%, transparent 70%)',
          'radial-gradient(circle at 50% 50%, #667eea 0%, transparent 50%)',
        ],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
```

#### Mesh Gradient (CSS)
```tsx
export function MeshGradient() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%]"
        style={{
          background: `
            radial-gradient(at 40% 20%, #ff6b6b 0px, transparent 50%),
            radial-gradient(at 80% 0%, #feca57 0px, transparent 50%),
            radial-gradient(at 0% 50%, #48dbfb 0px, transparent 50%),
            radial-gradient(at 80% 50%, #ff9ff3 0px, transparent 50%),
            radial-gradient(at 0% 100%, #54a0ff 0px, transparent 50%),
            radial-gradient(at 80% 100%, #5f27cd 0px, transparent 50%)
          `,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 60, repeat: Infinity, ease: 'linear' },
          scale: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
    </div>
  );
}
```

### 2. Particle Systems

#### Floating Particles
```tsx
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function FloatingParticles({ count = 50 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
```

#### Starfield
```tsx
export function Starfield({ count = 200 }: { count?: number }) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      twinkleDuration: Math.random() * 3 + 2,
      delay: Math.random() * 3,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 -z-10 bg-slate-950 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.twinkleDuration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
```

### 3. Wave Patterns

#### Animated Waves
```tsx
export function AnimatedWaves() {
  return (
    <div className="absolute bottom-0 left-0 right-0 -z-10 h-64 overflow-hidden">
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 w-full"
        preserveAspectRatio="none"
      >
        {/* Wave 1 - Back */}
        <motion.path
          fill="rgba(99, 102, 241, 0.3)"
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          animate={{
            d: [
              "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,128L48,154.7C96,181,192,235,288,234.7C384,235,480,181,576,181.3C672,181,768,235,864,250.7C960,267,1056,245,1152,229.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />

        {/* Wave 2 - Middle */}
        <motion.path
          fill="rgba(99, 102, 241, 0.5)"
          d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,213.3C672,203,768,213,864,224C960,235,1056,245,1152,234.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          animate={{
            d: [
              "M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,213.3C672,203,768,213,864,224C960,235,1056,245,1152,234.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,160L48,176C96,192,192,224,288,234.7C384,245,480,235,576,224C672,213,768,203,864,213.3C960,224,1056,256,1152,266.7C1248,277,1344,267,1392,261.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />

        {/* Wave 3 - Front */}
        <motion.path
          fill="rgba(99, 102, 241, 0.8)"
          d="M0,288L48,282.7C96,277,192,267,288,272C384,277,480,299,576,293.3C672,288,768,256,864,250.7C960,245,1056,267,1152,272C1248,277,1344,267,1392,261.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          animate={{
            d: [
              "M0,288L48,282.7C96,277,192,267,288,272C384,277,480,299,576,293.3C672,288,768,256,864,250.7C960,245,1056,267,1152,272C1248,277,1344,267,1392,261.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,256L48,261.3C96,267,192,277,288,272C384,267,480,245,576,250.7C672,256,768,288,864,293.3C960,299,1056,277,1152,272C1248,267,1344,277,1392,282.7L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  );
}
```

### 4. Aurora / Northern Lights

#### Aurora Background
```tsx
export function AuroraBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Aurora Layer 1 */}
      <motion.div
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #00ff8855 30%, #00ffff33 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: ['-20%', '20%', '-20%'],
          skewX: ['-5deg', '5deg', '-5deg'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Aurora Layer 2 */}
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #ff00ff44 40%, #00ffff22 60%, transparent 80%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: ['20%', '-20%', '20%'],
          skewX: ['5deg', '-5deg', '5deg'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Aurora Layer 3 */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #00ff0033 35%, #ff880022 55%, transparent 75%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: ['-10%', '10%', '-10%'],
          y: ['-5%', '5%', '-5%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
```

### 5. Noise/Grain Texture

#### Animated Grain
```tsx
export function GrainOverlay() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 opacity-20"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
      animate={{
        x: [0, -10, 0],
        y: [0, -10, 0],
      }}
      transition={{
        duration: 0.2,
        repeat: Infinity,
      }}
    />
  );
}
```

### 6. Grid Patterns

#### Animated Grid
```tsx
export function AnimatedGrid() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '50px 50px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Glow effect at center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </div>
  );
}
```

### 7. Blob Backgrounds

#### Morphing Blobs
```tsx
export function MorphingBlobs() {
  const blobVariants = {
    animate: {
      d: [
        "M440,320Q410,390,340,410Q270,430,200,410Q130,390,100,320Q70,250,100,180Q130,110,200,90Q270,70,340,90Q410,110,440,180Q470,250,440,320Z",
        "M440,320Q440,390,370,420Q300,450,230,420Q160,390,120,320Q80,250,120,180Q160,110,230,80Q300,50,370,80Q440,110,440,180Q440,250,440,320Z",
        "M440,320Q410,390,340,410Q270,430,200,410Q130,390,100,320Q70,250,100,180Q130,110,200,90Q270,70,340,90Q410,110,440,180Q470,250,440,320Z",
      ],
    },
  };

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 500 500" className="absolute w-full h-full">
        <defs>
          <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
        <motion.path
          fill="url(#blob-gradient)"
          variants={blobVariants}
          animate="animate"
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ filter: 'blur(40px)', opacity: 0.6 }}
        />
      </svg>
    </div>
  );
}
```

## Examples

<example>
Context: User wants an animated hero background
user: "Create a beautiful animated gradient background for my landing page hero"
assistant: Creating a flowing mesh gradient background:
```tsx
<MeshGradient />
```
This creates a smooth, continuously moving gradient with multiple color spots that rotate and scale.
</example>

<example>
Context: User needs a starfield for a space-themed section
user: "Add a twinkling starfield background"
assistant: Using the Starfield component with customizable count:
```tsx
<Starfield count={300} />
```
</example>

## Performance Tips

1. Use `will-change: transform` for moving elements
2. Limit particle count on mobile (50-100 max)
3. Use CSS `filter: blur()` sparingly - it's expensive
4. Consider using `requestAnimationFrame` for canvas-based effects
5. Test on lower-end devices

## Related Skills

- **creative-effects** - Morphing shapes and liquids
- **accent-animations** - Floating decorative elements
- **css-animations** - Keyframe-based backgrounds

## Author

Created by Brookside BI as part of React Animation Studio
