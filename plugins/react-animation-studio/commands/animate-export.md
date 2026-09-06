---
name: react-animation-studio:animate-export
intent: /animate-export
tags:
  - react-animation-studio
  - command
  - animate-export
inputs: []
risk: medium
cost: medium
description: Export animations as reusable components, hooks, or design tokens.
---

# /animate-export

Export animations as reusable components, hooks, or design tokens.

## Usage

```
/animate-export <source> [options]
```

## Description

The `/animate-export` command extracts and packages animations into reusable formats that can be shared across projects, teams, or published as packages.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <fmt>` | Export format (component, hook, tokens, package) | component |
| `--output <path>` | Output directory | ./animations |
| `--name <name>` | Export name | auto-generated |
| `--typescript` | Generate TypeScript definitions | true |
| `--stories` | Generate Storybook stories | false |
| `--tests` | Generate test files | false |

## Export Formats

### Component Export
Self-contained React component with animation built-in.

### Hook Export
Custom React hook encapsulating animation logic.

### Tokens Export
Design tokens for animation timing, easing, and spring configs.

### Package Export
Complete npm package ready for publishing.

## Examples

```bash
# Export animation as component
/animate-export src/components/FadeIn.tsx --format component

# Export as reusable hook
/animate-export src/animations/useSlideIn.ts --format hook

# Extract animation tokens
/animate-export --format tokens --output ./design-system/animations

# Create publishable package
/animate-export ./src/animations --format package --name @myorg/animations

# Include Storybook stories
/animate-export src/components/Modal.tsx --format component --stories

# With tests
/animate-export src/animations --format hook --tests
```

## Generated Outputs

### Component Export
```tsx
// animations/FadeInUp.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

export interface FadeInUpProps extends HTMLMotionProps<'div'> {
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Distance to animate from (pixels) */
  distance?: number;
}

export const FadeInUp = forwardRef<HTMLDivElement, FadeInUpProps>(
  ({ delay = 0, duration = 0.4, distance = 20, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: distance }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeInUp.displayName = 'FadeInUp';
```

### Hook Export
```tsx
// animations/hooks/useSlideIn.ts
import { useAnimation, Variants } from 'framer-motion';
import { useCallback, useEffect } from 'react';

export interface UseSlideInOptions {
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  delay?: number;
  autoPlay?: boolean;
}

export interface UseSlideInReturn {
  controls: ReturnType<typeof useAnimation>;
  variants: Variants;
  play: () => Promise<void>;
  reset: () => void;
}

export function useSlideIn(options: UseSlideInOptions = {}): UseSlideInReturn {
  const {
    direction = 'up',
    distance = 30,
    duration = 0.4,
    delay = 0,
    autoPlay = true,
  } = options;

  const controls = useAnimation();

  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -distance, y: 0 };
      case 'right': return { x: distance, y: 0 };
      case 'up': return { x: 0, y: distance };
      case 'down': return { x: 0, y: -distance };
    }
  };

  const variants: Variants = {
    hidden: { opacity: 0, ...getInitialPosition() },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  const play = useCallback(async () => {
    await controls.start('visible');
  }, [controls]);

  const reset = useCallback(() => {
    controls.set('hidden');
  }, [controls]);

  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  return { controls, variants, play, reset };
}
```

### Tokens Export
```typescript
// animations/tokens/index.ts
export const animationTokens = {
  duration: {
    instant: 0,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
  },

  easing: {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    emphasize: [0.25, 0.1, 0.25, 1],
  },

  spring: {
    snappy: { type: 'spring', stiffness: 400, damping: 30 },
    bouncy: { type: 'spring', stiffness: 300, damping: 15 },
    gentle: { type: 'spring', stiffness: 150, damping: 20 },
    stiff: { type: 'spring', stiffness: 500, damping: 45 },
  },

  distance: {
    sm: 10,
    md: 20,
    lg: 40,
    xl: 80,
  },
} as const;

export type AnimationDuration = keyof typeof animationTokens.duration;
export type AnimationEasing = keyof typeof animationTokens.easing;
export type AnimationSpring = keyof typeof animationTokens.spring;
```

### Package Export Structure
```
@myorg/animations/
├── package.json
├── README.md
├── LICENSE
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── components/
│   │   ├── FadeIn.tsx
│   │   ├── SlideIn.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAnimation.ts
│   │   ├── useReducedMotion.ts
│   │   └── index.ts
│   └── tokens/
│       ├── duration.ts
│       ├── easing.ts
│       ├── spring.ts
│       └── index.ts
├── dist/
│   ├── index.js
│   ├── index.d.ts
│   └── ...
└── stories/
    ├── FadeIn.stories.tsx
    └── SlideIn.stories.tsx
```

### Generated package.json
```json
{
  "name": "@myorg/animations",
  "version": "1.0.0",
  "description": "Reusable React animation components and hooks",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./components": {
      "import": "./dist/components/index.mjs",
      "require": "./dist/components/index.js"
    },
    "./hooks": {
      "import": "./dist/hooks/index.mjs",
      "require": "./dist/hooks/index.js"
    },
    "./tokens": {
      "import": "./dist/tokens/index.mjs",
      "require": "./dist/tokens/index.js"
    }
  },
  "peerDependencies": {
    "framer-motion": ">=10.0.0",
    "react": ">=18.0.0"
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "prepublishOnly": "npm run build"
  }
}
```

## Author

Created by Brookside BI as part of React Animation Studio
