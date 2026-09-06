---
name: react-animation-studio:animate-transition
intent: /animate-transition
tags:
  - react-animation-studio
  - command
  - animate-transition
inputs: []
risk: medium
cost: medium
description: Create page transitions and route animations for seamless navigation experiences.
---

# /animate-transition

Create page transitions and route animations for seamless navigation experiences.

## Usage

```
/animate-transition <type> [options]
```

## Description

The `/animate-transition` command sets up page-level transitions for React applications. It supports Next.js App Router, React Router, and other routing solutions with various transition styles.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--framework <fw>` | Framework (nextjs, react-router, remix) | auto-detect |
| `--type <type>` | Transition type | fade |
| `--duration <ms>` | Transition duration | 300 |
| `--shared-elements` | Enable shared element transitions | false |
| `--view-transitions` | Use View Transitions API | false |

## Transition Types

| Type | Description |
|------|-------------|
| `fade` | Cross-fade between pages |
| `slide` | Slide pages left/right |
| `slide-up` | Slide pages up/down |
| `scale` | Scale in/out |
| `morph` | Morph with shared elements |
| `flip` | 3D flip transition |
| `blur` | Blur transition |
| `none` | Instant (for comparison) |

## Examples

```bash
# Basic fade transition
/animate-transition fade

# Slide transitions with direction
/animate-transition slide --direction right

# Next.js App Router setup
/animate-transition --framework nextjs slide-up

# Enable shared element transitions
/animate-transition morph --shared-elements

# Use native View Transitions API
/animate-transition --view-transitions

# Custom duration
/animate-transition fade --duration 500
```

## Generated Code Examples

### Next.js App Router
```tsx
// app/template.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.3,
};

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### React Router
```tsx
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Routes, Route } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <HomePage />
            </motion.div>
          }
        />
        {/* More routes */}
      </Routes>
    </AnimatePresence>
  );
}
```

### Shared Element Transitions
```tsx
// pages/Gallery.tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function GalleryPage({ images }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image) => (
        <Link key={image.id} to={`/image/${image.id}`}>
          <motion.img
            layoutId={`image-${image.id}`}
            src={image.thumbnail}
            className="w-full h-48 object-cover rounded-lg"
          />
        </Link>
      ))}
    </div>
  );
}

// pages/ImageDetail.tsx
function ImageDetailPage({ image }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.img
        layoutId={`image-${image.id}`}
        src={image.fullSize}
        className="w-full h-auto"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1>{image.title}</h1>
        <p>{image.description}</p>
      </motion.div>
    </motion.div>
  );
}
```

### View Transitions API
```tsx
// hooks/useViewTransition.ts
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useViewTransition() {
  const router = useRouter();

  const navigate = useCallback((href: string) => {
    if (!document.startViewTransition) {
      router.push(href);
      return;
    }

    document.startViewTransition(() => {
      router.push(href);
    });
  }, [router]);

  return { navigate };
}

// CSS for View Transitions
// globals.css
/*
::view-transition-old(root) {
  animation: fade-out 0.25s ease-out;
}

::view-transition-new(root) {
  animation: fade-in 0.25s ease-in;
}

@keyframes fade-out {
  to { opacity: 0; transform: scale(0.95); }
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(1.05); }
}
*/
```

### Direction-Aware Transitions
```tsx
// hooks/useDirectionalTransition.ts
import { useRef } from 'react';
import { usePathname } from 'next/navigation';

const routes = ['/', '/about', '/products', '/contact'];

export function useDirectionalTransition() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  const currentIndex = routes.indexOf(pathname);
  const prevIndex = routes.indexOf(prevPathRef.current);

  const direction = currentIndex > prevIndex ? 1 : -1;

  // Update ref after render
  prevPathRef.current = pathname;

  const variants = {
    initial: { opacity: 0, x: 50 * direction },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 * direction },
  };

  return { variants, direction };
}
```

## Transition Presets

```typescript
export const transitionPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.25 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: { duration: 0.3 },
  },
};
```

## Author

Created by Brookside BI as part of React Animation Studio
