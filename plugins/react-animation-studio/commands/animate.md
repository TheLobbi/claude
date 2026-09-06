---
name: react-animation-studio:animate
intent: /animate
tags:
  - react-animation-studio
  - command
  - animate
inputs: []
risk: medium
cost: medium
description: Generate beautiful, production-ready animation code from natural language descriptions. This command transforms creative descriptions into optimized TypeScript/React animations.
---

# /animate

Generate beautiful, production-ready animation code from natural language descriptions. This command transforms creative descriptions into optimized TypeScript/React animations.

## Usage

```
/animate <description>
```

## Description

The `/animate` command uses AI to interpret natural language animation descriptions and generate corresponding code using the configured animation library (Framer Motion by default).

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--library <lib>` | Animation library to use (framer-motion, gsap, css, react-spring) | framer-motion |
| `--output <path>` | Output file path for generated code | clipboard |
| `--component` | Generate as a reusable component | false |
| `--typescript` | Generate TypeScript code | true |
| `--reduced-motion` | Include reduced motion support | true |

## Workflow

1. **Parse Description** - Analyze the animation description
2. **Select Technique** - Choose optimal animation approach
3. **Generate Code** - Create production-ready code
4. **Add Accessibility** - Include reduced motion alternatives
5. **Output** - Display or save the generated code

## Examples

```bash
# Basic usage
/animate fade in from below with a bounce

# Specify library
/animate --library gsap stagger cards entering from the left

# Generate component
/animate --component a button that scales on hover and has ripple on click

# Complex animation
/animate hero text that types out letter by letter then fades to full opacity

# Scroll-triggered
/animate cards that flip and reveal content when scrolled into view
```

## Sample Outputs

### Input: "fade in from below with a bounce"
```tsx
import { motion } from 'framer-motion';

export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// Usage: <motion.div {...fadeInUp}>Content</motion.div>
```

### Input: "stagger cards entering from the left"
```tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

// Usage:
// <motion.div variants={container} initial="hidden" animate="visible">
//   {items.map(i => <motion.div key={i} variants={item} />)}
// </motion.div>
```

## Animation Vocabulary

The command understands these animation concepts:

**Motion Types:**
- fade (in/out)
- slide (up/down/left/right)
- scale (grow/shrink/pulse)
- rotate (spin/flip)
- bounce, wobble, shake

**Timing:**
- fast, slow, instant
- with delay, after
- stagger, sequence

**Triggers:**
- on hover, on click, on tap
- on scroll, when visible
- on mount, on exit

**Physics:**
- spring, bounce, elastic
- smooth, snappy, gentle

## Author

Created by Brookside BI as part of React Animation Studio
