---
name: react-animation-studio:animate-component
intent: /animate-component
tags:
  - react-animation-studio
  - command
  - animate-component
inputs: []
risk: medium
cost: medium
description: Add animations to existing React components with intelligent analysis and seamless integration.
---

# /animate-component

Add animations to existing React components with intelligent analysis and seamless integration.

## Usage

```
/animate-component <component-path> [animation-description]
```

## Description

The `/animate-component` command analyzes an existing React component and adds animations while preserving the component's structure and functionality. It intelligently identifies animation opportunities and applies best practices.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Animation type: entrance, exit, hover, gesture, scroll | auto-detect |
| `--library <lib>` | Animation library to use | framer-motion |
| `--preserve-props` | Keep all existing props unchanged | true |
| `--dry-run` | Preview changes without modifying file | false |

## Workflow

1. **Analyze Component** - Parse component structure and identify elements
2. **Detect Opportunities** - Find animatable elements and interactions
3. **Suggest Animations** - Propose appropriate animations
4. **Apply Changes** - Add animation code while preserving functionality
5. **Validate** - Ensure TypeScript types and imports are correct

## Examples

```bash
# Add entrance animation to a card component
/animate-component src/components/Card.tsx add fade-in entrance

# Add hover effects
/animate-component src/components/Button.tsx --type hover

# Add scroll-triggered animations
/animate-component src/components/Section.tsx --type scroll reveal on scroll

# Preview changes first
/animate-component src/components/Modal.tsx --dry-run add slide-up entrance
```

## Analysis Capabilities

The command analyzes:

**Component Structure:**
- Wrapper elements (divs, sections)
- Interactive elements (buttons, links)
- List items and children
- Conditional renders

**Existing Animations:**
- Current animation implementations
- CSS transitions/animations
- Potential conflicts

**Props and State:**
- Visibility toggles (isOpen, isVisible)
- Loading states
- Active/selected states

## Transformation Examples

### Before
```tsx
function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-xl bg-white shadow-md p-6">
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
```

### After (with entrance animation)
```tsx
import { motion } from 'framer-motion';

function Card({ title, children }: CardProps) {
  return (
    <motion.div
      className="rounded-xl bg-white shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}
```

### Before (Modal)
```tsx
function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50">
      <div className="bg-white rounded-xl p-6">
        {children}
      </div>
    </div>
  );
}
```

### After (with enter/exit animations)
```tsx
import { AnimatePresence, motion } from 'framer-motion';

function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl p-6"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Smart Detection

The command automatically detects and suggests:

| Pattern | Suggested Animation |
|---------|---------------------|
| `isOpen` prop | Enter/exit with AnimatePresence |
| `isLoading` state | Skeleton or spinner transition |
| Button element | Hover scale + tap feedback |
| List/grid of items | Staggered entrance |
| Card component | Hover lift effect |
| Modal/dialog | Backdrop fade + content slide |

## Author

Created by Brookside BI as part of React Animation Studio
