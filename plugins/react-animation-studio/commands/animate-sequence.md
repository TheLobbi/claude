---
name: react-animation-studio:animate-sequence
intent: /animate-sequence
tags:
  - react-animation-studio
  - command
  - animate-sequence
inputs: []
risk: medium
cost: medium
description: Create choreographed animation sequences with precise timing and orchestration.
---

# /animate-sequence

Create choreographed animation sequences with precise timing and orchestration.

## Usage

```
/animate-sequence <description>
```

## Description

The `/animate-sequence` command creates complex, multi-step animation sequences with precise timing control. It generates timeline-based animations that coordinate multiple elements.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--library <lib>` | Animation library (framer-motion, gsap) | framer-motion |
| `--output <path>` | Output file path | clipboard |
| `--duration <ms>` | Total sequence duration | auto |
| `--stagger <ms>` | Default stagger between items | 100 |
| `--loop` | Make sequence loop | false |
| `--reverse` | Play in reverse | false |

## Workflow

1. **Parse Sequence** - Break down the animation description
2. **Build Timeline** - Create ordered animation steps
3. **Calculate Timing** - Determine delays and overlaps
4. **Generate Code** - Output timeline code
5. **Add Controls** - Include play/pause/restart controls

## Examples

```bash
# Simple sequence
/animate-sequence logo fades in, then title slides up, then subtitle fades in

# Staggered items
/animate-sequence navigation items drop in from top one by one

# Complex choreography
/animate-sequence "hero image zooms in, headline types out, CTA button bounces in after 1 second"

# With timing
/animate-sequence --duration 3000 "background fades, card flips, content reveals"

# Looping sequence
/animate-sequence --loop "dot pulses, moves right, pulses, moves down, repeats"
```

## Sequence Syntax

The command understands natural timing language:

**Timing Keywords:**
- `then` - After previous completes
- `after X seconds` - Specific delay
- `with` / `simultaneously` - At the same time
- `while` - Overlapping duration
- `finally` - Last in sequence

**Examples:**
- "A fades in, then B slides up" (sequential)
- "A and B fade in together" (simultaneous)
- "A fades in, B slides up after 0.5 seconds" (delayed)
- "While A expands, B rotates" (parallel)

## Generated Code Examples

### Sequential Animation
```tsx
import { motion, useAnimation } from 'framer-motion';

function SequenceAnimation() {
  const controls = useAnimation();

  async function playSequence() {
    // Step 1: Logo fades in
    await controls.start('logoVisible');
    // Step 2: Title slides up
    await controls.start('titleVisible');
    // Step 3: Subtitle fades in
    await controls.start('subtitleVisible');
  }

  useEffect(() => {
    playSequence();
  }, []);

  return (
    <div>
      <motion.div
        variants={{
          logoHidden: { opacity: 0 },
          logoVisible: { opacity: 1, transition: { duration: 0.5 } },
        }}
        initial="logoHidden"
        animate={controls}
      >
        Logo
      </motion.div>
      <motion.h1
        variants={{
          titleHidden: { opacity: 0, y: 30 },
          titleVisible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
        initial="titleHidden"
        animate={controls}
      >
        Title
      </motion.h1>
      <motion.p
        variants={{
          subtitleHidden: { opacity: 0 },
          subtitleVisible: { opacity: 1, transition: { duration: 0.4 } },
        }}
        initial="subtitleHidden"
        animate={controls}
      >
        Subtitle
      </motion.p>
    </div>
  );
}
```

### GSAP Timeline
```typescript
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function GSAPSequence() {
  const containerRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from('.logo', { opacity: 0, duration: 0.5 })
      .from('.title', { opacity: 0, y: 30, duration: 0.5 }, '-=0.2')
      .from('.subtitle', { opacity: 0, duration: 0.4 }, '-=0.1');
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <div className="logo">Logo</div>
      <h1 className="title">Title</h1>
      <p className="subtitle">Subtitle</p>
    </div>
  );
}
```

### Staggered Sequence
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

function StaggeredNav({ items }) {
  return (
    <motion.nav
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, i) => (
        <motion.a key={i} variants={itemVariants}>
          {item.label}
        </motion.a>
      ))}
    </motion.nav>
  );
}
```

## Sequence Building Blocks

### Entrance Choreography
```tsx
const entranceSequence = {
  container: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        when: 'beforeChildren',
      },
    },
  },
  background: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },
  content: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },
};
```

### Exit Choreography
```tsx
const exitSequence = {
  container: {
    visible: {},
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1, // Reverse order
        when: 'afterChildren',
      },
    },
  },
  item: {
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  },
};
```

## Sequence Hooks

Generate reusable sequence hooks:

```typescript
function useAnimationSequence() {
  const controls = useAnimation();
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(async () => {
    setIsPlaying(true);
    await controls.start('step1');
    await controls.start('step2');
    await controls.start('step3');
    setIsPlaying(false);
  }, [controls]);

  const reset = useCallback(() => {
    controls.start('initial');
  }, [controls]);

  return { controls, play, reset, isPlaying };
}
```

## Author

Created by Brookside BI as part of React Animation Studio
