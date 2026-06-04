---
name: text-animations
description: "Expert knowledge for creative text animations - typewriter effects, character-by-character reveals, kinetic typography, split text animations, and expressive text motion."
---

# Text Animations Skill

Expert knowledge for creative text animations - typewriter effects, character-by-character reveals, kinetic typography, split text animations, and expressive text motion.

## When to Use

Activate this skill when:
- User wants typewriter/typing animations
- Creating character-by-character text reveals
- Building kinetic typography effects
- Need animated headings or titles
- Creating text scramble effects
- Building split-text animations

## File Patterns

- `**/*.tsx` with text animation components
- `**/components/Text*.tsx`
- `**/components/Heading*.tsx`
- `**/components/Title*.tsx`

## Text Animation Types

### 1. Typewriter Effects

#### Basic Typewriter
```tsx
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
}: {
  text: string;
  speed?: number;
  delay?: number;
}) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return (
    <span>
      {displayText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}
```

#### Typewriter with Delete
```tsx
export function TypewriterLoop({
  texts,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
}: {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span>
      {displayText}
      <motion.span
        className="inline-block w-0.5 h-[1em] bg-current ml-1"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    </span>
  );
}
```

### 2. Character-by-Character Animations

#### Staggered Characters
```tsx
export function StaggeredText({
  text,
  staggerDelay = 0.03,
}: {
  text: string;
  staggerDelay?: number;
}) {
  const characters = text.split('');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  const charVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="inline-block"
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={charVariants}
          className="inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
```

#### Wave Text
```tsx
export function WaveText({ text }: { text: string }) {
  const characters = text.split('');

  return (
    <span className="inline-block">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.05,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
```

#### Bouncy Text
```tsx
export function BouncyText({ text }: { text: string }) {
  const characters = text.split('');

  return (
    <span className="inline-block">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          whileHover={{
            y: -10,
            color: '#667eea',
            transition: {
              type: 'spring',
              stiffness: 500,
              damping: 10,
            },
          }}
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
```

### 3. Word-by-Word Animations

#### Staggered Words
```tsx
export function StaggeredWords({
  text,
  staggerDelay = 0.1,
}: {
  text: string;
  staggerDelay?: number;
}) {
  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="inline"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
```

#### Highlighted Words
```tsx
export function HighlightedText({
  text,
  highlightWords,
  highlightColor = '#667eea',
}: {
  text: string;
  highlightWords: string[];
  highlightColor?: string;
}) {
  const words = text.split(' ');

  return (
    <span>
      {words.map((word, i) => {
        const isHighlighted = highlightWords.some(
          (hw) => word.toLowerCase().includes(hw.toLowerCase())
        );

        return (
          <motion.span
            key={i}
            className="inline-block mr-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {isHighlighted ? (
              <motion.span
                className="relative inline-block"
                whileHover={{ scale: 1.05 }}
              >
                <motion.span
                  className="absolute inset-0 -z-10 rounded"
                  style={{ backgroundColor: highlightColor }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
                />
                <span className="relative text-white px-1">{word}</span>
              </motion.span>
            ) : (
              word
            )}
          </motion.span>
        );
      })}
    </span>
  );
}
```

### 4. Text Scramble Effects

#### Scramble Text
```tsx
export function ScrambleText({
  text,
  duration = 1000,
}: {
  text: string;
  duration?: number;
}) {
  const [displayText, setDisplayText] = useState(text);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  useEffect(() => {
    let frame = 0;
    const totalFrames = 20;
    const interval = duration / totalFrames;

    const animate = setInterval(() => {
      frame++;

      const progress = frame / totalFrames;
      const revealedLength = Math.floor(progress * text.length);

      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (i < revealedLength) {
          result += text[i];
        } else if (text[i] === ' ') {
          result += ' ';
        } else {
          result += characters[Math.floor(Math.random() * characters.length)];
        }
      }

      setDisplayText(result);

      if (frame >= totalFrames) {
        clearInterval(animate);
        setDisplayText(text);
      }
    }, interval);

    return () => clearInterval(animate);
  }, [text, duration]);

  return <span className="font-mono">{displayText}</span>;
}
```

### 5. Split Text / Line Animations

#### Split Lines
```tsx
export function SplitLines({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{
              duration: 0.6,
              delay: i * 0.1,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
```

### 6. Counter/Number Animations

#### Counting Number
```tsx
export function CountingNumber({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
}: {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
}) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = from + (to - from) * eased;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return <span>{count.toFixed(decimals)}</span>;
}
```

### 7. Gradient Text Animation

#### Animated Gradient Text
```tsx
export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #667eea)',
        backgroundSize: '300% 100%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}
```

### 8. Outline Text Animation

#### Animated Stroke Text
```tsx
export function StrokeText({ text }: { text: string }) {
  return (
    <svg viewBox="0 0 800 100" className="w-full h-auto">
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-6xl font-bold"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        {text}
      </motion.text>
    </svg>
  );
}
```

## Examples

<example>
Context: User wants a typewriter effect for hero text
user: "Create a typewriter animation for my headline"
assistant: Using the Typewriter component:
```tsx
<h1 className="text-5xl font-bold">
  <Typewriter text="Welcome to the future" speed={80} />
</h1>
```
</example>

<example>
Context: User needs animated counter for statistics
user: "Animate the number counting up from 0 to 1000"
assistant: Using CountingNumber:
```tsx
<span className="text-4xl font-bold">
  <CountingNumber to={1000} duration={2} /> users
</span>
```
</example>

<example>
Context: User wants gradient animated heading
user: "Make the heading text have a flowing gradient"
assistant: Using GradientText:
```tsx
<h1 className="text-6xl font-bold">
  <GradientText>Innovation Starts Here</GradientText>
</h1>
```
</example>

## Related Skills

- **creative-effects** - Glitch and distortion
- **framer-motion** - Core animation library
- **css-animations** - CSS-based text effects

## Author

Created by Brookside BI as part of React Animation Studio
