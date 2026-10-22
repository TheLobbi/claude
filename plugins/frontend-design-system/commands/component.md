---
name: component
intent: Generate styled UI components with design system consistency
tags:
  - frontend-design-system
  - command
  - component
inputs: []
risk: medium
cost: medium
description: Generate styled UI components with design system consistency
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Styled Component Generation Command

Generate production-ready UI components with design system consistency, accessibility features, and style variants.

## Usage

```bash
/component <type> [style] [--target styled|tailwind|chakra]
```

## Arguments

- `type` (required): Component type - `button`, `card`, `modal`, `form`, `navigation`, `input`, `select`, `checkbox`, `radio`, `switch`, `badge`, `alert`, `tooltip`, `dropdown`, `tabs`, `accordion`, `breadcrumb`, `pagination`, `table`, `loader`, `progress`
- `style` (optional): Design style name to apply (defaults to active theme)
- `--target` (optional): Output target. `styled` (default, styled-components), `tailwind`, or `chakra` (Chakra UI v3). See "Chakra UI v3 Target" below.

## Examples

```bash
# Generate a Material Design button
/component button "Material Design"

# Generate a card component
/component card

# Generate a form with Neumorphism style
/component form Neumorphism

# Generate a modal dialog
/component modal Glassmorphism

# Generate navigation
/component navigation "Modern Minimalist"

# Generate a Chakra UI v3 card (slot recipe + compound parts)
/component card Glassmorphism --target chakra
```

## Execution Flow

### 1. Load Component Template

Load base template for the component type from:
`frontend-design-system/skills/component-patterns/`

### 2. Load Design Style

Extract style tokens and characteristics:
- Colors, typography, spacing
- Shadows, borders, effects
- Animation preferences
- Accessibility requirements

### 3. Component Generation

#### Button Component

```typescript
// components/Button/Button.tsx
import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '@/design-tokens/tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Variant styles
const variantStyles = {
  primary: css`
    background-color: ${tokens.colors.primary[500]};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.primary[600]};
      box-shadow: ${tokens.shadows.md};
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      background-color: ${tokens.colors.primary[700]};
      transform: translateY(0);
    }
  `,
  secondary: css`
    background-color: ${tokens.colors.neutral[100]};
    color: ${tokens.colors.neutral[900]};
    border: none;

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.neutral[200]};
    }
  `,
  outline: css`
    background-color: transparent;
    color: ${tokens.colors.primary[500]};
    border: 2px solid ${tokens.colors.primary[500]};

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.primary[50]};
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${tokens.colors.primary[500]};
    border: none;

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.primary[50]};
    }
  `,
  danger: css`
    background-color: ${tokens.colors.error[500]};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background-color: ${tokens.colors.error[600]};
    }
  `,
};

// Size styles
const sizeStyles = {
  sm: css`
    padding: ${tokens.spacing[1]} ${tokens.spacing[2]};
    font-size: ${tokens.typography.fontSize.sm};
    min-height: 32px;
  `,
  md: css`
    padding: ${tokens.spacing[2]} ${tokens.spacing[3]};
    font-size: ${tokens.typography.fontSize.base};
    min-height: 40px;
  `,
  lg: css`
    padding: ${tokens.spacing[3]} ${tokens.spacing[4]};
    font-size: ${tokens.typography.fontSize.lg};
    min-height: 48px;
  `,
};

const StyledButton = styled.button<{
  $variant: ButtonProps['variant'];
  $size: ButtonProps['size'];
  $fullWidth?: boolean;
  $isLoading?: boolean;
}>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${tokens.spacing[1]};
  font-family: ${tokens.typography.fontFamily.base};
  font-weight: ${tokens.typography.fontWeight.medium};
  border-radius: ${tokens.radii.md};
  transition: all ${tokens.transitions.base};
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  user-select: none;

  /* Variant styles */
  ${({ $variant }) => variantStyles[$variant || 'primary']};

  /* Size styles */
  ${({ $size }) => sizeStyles[$size || 'md']};

  /* Full width */
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Loading state */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      color: transparent;
      pointer-events: none;
    `}

  /* Focus visible for accessibility */
  &:focus-visible {
    outline: 2px solid ${tokens.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const LoadingSpinner = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        $isLoading={isLoading}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {leftIcon && <span>{leftIcon}</span>}
        {children}
        {rightIcon && <span>{rightIcon}</span>}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';
```

```typescript
// components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button leftIcon={<span>←</span>}>Back</Button>
      <Button rightIcon={<span>→</span>}>Next</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: 'Button',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Button',
    disabled: true,
  },
};
```

#### Card Component

```typescript
// components/Card/Card.tsx
import React, { forwardRef, HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '@/design-tokens/tokens';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
}

const variantStyles = {
  elevated: css`
    background-color: ${tokens.colors.semantic.background.paper};
    box-shadow: ${tokens.shadows.md};
    border: none;
  `,
  outlined: css`
    background-color: ${tokens.colors.semantic.background.default};
    box-shadow: none;
    border: 1px solid ${tokens.colors.semantic.border.default};
  `,
  filled: css`
    background-color: ${tokens.colors.neutral[50]};
    box-shadow: none;
    border: none;
  `,
};

const paddingStyles = {
  none: css`
    padding: 0;
  `,
  sm: css`
    padding: ${tokens.spacing[2]};
  `,
  md: css`
    padding: ${tokens.spacing[3]};
  `,
  lg: css`
    padding: ${tokens.spacing[4]};
  `,
};

const StyledCard = styled.div<{
  $variant: CardProps['variant'];
  $padding: CardProps['padding'];
  $hoverable?: boolean;
  $clickable?: boolean;
}>`
  border-radius: ${tokens.radii.lg};
  transition: all ${tokens.transitions.base};

  /* Variant styles */
  ${({ $variant }) => variantStyles[$variant || 'elevated']};

  /* Padding styles */
  ${({ $padding }) => paddingStyles[$padding || 'md']};

  /* Hoverable effect */
  ${({ $hoverable }) =>
    $hoverable &&
    css`
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${tokens.shadows.lg};
      }
    `}

  /* Clickable cursor */
  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:active {
        transform: translateY(0);
      }
    `}
`;

const CardHeader = styled.div`
  padding-bottom: ${tokens.spacing[2]};
  border-bottom: 1px solid ${tokens.colors.semantic.divider};
  margin-bottom: ${tokens.spacing[2]};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: ${tokens.typography.fontSize['2xl']};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.semantic.text.primary};
`;

const CardBody = styled.div`
  color: ${tokens.colors.semantic.text.primary};
  line-height: ${tokens.typography.lineHeight.normal};
`;

const CardFooter = styled.div`
  padding-top: ${tokens.spacing[2]};
  border-top: 1px solid ${tokens.colors.semantic.divider};
  margin-top: ${tokens.spacing[2]};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${tokens.spacing[2]};
`;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'elevated', padding = 'md', hoverable, clickable, children, ...props }, ref) => {
    return (
      <StyledCard
        ref={ref}
        $variant={variant}
        $padding={padding}
        $hoverable={hoverable}
        $clickable={clickable}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        {...props}
      >
        {children}
      </StyledCard>
    );
  }
);

Card.displayName = 'Card';

// Sub-components
export { CardHeader, CardTitle, CardBody, CardFooter };
```

#### Form Component

```typescript
// components/Form/Form.tsx
import React, { forwardRef, FormHTMLAttributes } from 'react';
import styled from 'styled-components';
import { tokens } from '@/design-tokens/tokens';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  layout?: 'vertical' | 'horizontal';
  spacing?: 'sm' | 'md' | 'lg';
}

const StyledForm = styled.form<{ $layout: FormProps['layout']; $spacing: FormProps['spacing'] }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $spacing }) =>
    $spacing === 'sm'
      ? tokens.spacing[2]
      : $spacing === 'lg'
      ? tokens.spacing[4]
      : tokens.spacing[3]};
`;

const FormField = styled.div<{ $layout?: 'vertical' | 'horizontal' }>`
  display: flex;
  flex-direction: ${({ $layout }) => ($layout === 'horizontal' ? 'row' : 'column')};
  gap: ${tokens.spacing[1]};
  align-items: ${({ $layout }) => ($layout === 'horizontal' ? 'center' : 'flex-start')};
`;

const Label = styled.label`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${tokens.colors.semantic.text.primary};
  min-width: ${({ $layout }) => ($layout === 'horizontal' ? '120px' : 'auto')};
`;

const Input = styled.input`
  padding: ${tokens.spacing[2]};
  border: 1px solid ${tokens.colors.semantic.border.default};
  border-radius: ${tokens.radii.md};
  font-size: ${tokens.typography.fontSize.base};
  font-family: ${tokens.typography.fontFamily.base};
  transition: all ${tokens.transitions.fast};
  flex: 1;

  &:focus {
    outline: none;
    border-color: ${tokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${tokens.colors.primary[50]};
  }

  &:disabled {
    background-color: ${tokens.colors.neutral[50]};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: ${tokens.colors.semantic.text.disabled};
  }
`;

const HelperText = styled.span<{ $error?: boolean }>`
  font-size: ${tokens.typography.fontSize.xs};
  color: ${({ $error }) =>
    $error ? tokens.colors.error[500] : tokens.colors.semantic.text.secondary};
  margin-top: ${tokens.spacing[0.5]};
`;

const FormActions = styled.div`
  display: flex;
  gap: ${tokens.spacing[2]};
  justify-content: flex-end;
  margin-top: ${tokens.spacing[2]};
`;

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ layout = 'vertical', spacing = 'md', children, ...props }, ref) => {
    return (
      <StyledForm ref={ref} $layout={layout} $spacing={spacing} {...props}>
        {children}
      </StyledForm>
    );
  }
);

Form.displayName = 'Form';

// Export sub-components
export { FormField, Label, Input, HelperText, FormActions };
```

#### Modal Component

```typescript
// components/Modal/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { tokens } from '@/design-tokens/tokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${tokens.zIndex.modal};
  animation: ${fadeIn} ${tokens.transitions.base};
  padding: ${tokens.spacing[3]};
`;

const sizeMap = {
  sm: '400px',
  md: '600px',
  lg: '800px',
  xl: '1000px',
};

const ModalContainer = styled.div<{ $size: ModalProps['size'] }>`
  background-color: white;
  border-radius: ${tokens.radii.lg};
  box-shadow: ${tokens.shadows.xl};
  max-width: ${({ $size }) => sizeMap[$size || 'md']};
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} ${tokens.transitions.base};
`;

const ModalHeader = styled.div`
  padding: ${tokens.spacing[3]} ${tokens.spacing[4]};
  border-bottom: 1px solid ${tokens.colors.semantic.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${tokens.typography.fontSize['2xl']};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.semantic.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${tokens.typography.fontSize['2xl']};
  cursor: pointer;
  padding: ${tokens.spacing[1]};
  color: ${tokens.colors.semantic.text.secondary};
  transition: color ${tokens.transitions.fast};

  &:hover {
    color: ${tokens.colors.semantic.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: ${tokens.spacing[4]};
  overflow-y: auto;
  flex: 1;
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <Overlay onClick={handleOverlayClick}>
      <ModalContainer ref={modalRef} $size={size} role="dialog" aria-modal="true">
        {title && (
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <CloseButton onClick={onClose} aria-label="Close modal">
              ×
            </CloseButton>
          </ModalHeader>
        )}
        <ModalBody>{children}</ModalBody>
      </ModalContainer>
    </Overlay>,
    document.body
  );
};
```

## Chakra UI v3 Target

Used when `--target chakra` is passed. Source of truth: `skills/chakra-ui-v3/SKILL.md`. Never emit a pattern from its "v2 → v3 banned list". For props and examples of built-in components, query the official `chakra-ui` MCP server (`get_component_props`, `get_component_example`) instead of recalling them.

Rules:
- Multi-part components are slot recipes (`defineSlotRecipe`) exposed as compound parts via `createSlotRecipeContext` (`withProvider` on the root, `withContext` on the rest).
- Colors come from `colorPalette` (custom palettes must satisfy the colorPalette contract: `50`-`950` plus `solid`, `contrast`, `fg`, `muted`, `subtle`, `emphasized`, `focusRing`).
- Boolean state props are component-specific. Use names such as `open`, `disabled`, `invalid`, `required`, or `loading` only when `get_component_props` returns them for the selected component; never invent an `is*` variant or assume this list is exhaustive.
- Overlays are compound parts (`Dialog.Root` etc.), not flat `Modal`/`Drawer`.
- Register the slot recipe under `theme.slotRecipes` in `createSystem(defaultConfig, defineConfig(...))`, then run `npx @chakra-ui/cli typegen ./theme.ts`.

```typescript
// theme/recipes/card.ts
import { defineSlotRecipe } from '@chakra-ui/react';

export const cardSlotRecipe = defineSlotRecipe({
  slots: ['root', 'header', 'body'],
  base: {
    root: { bg: 'brand.muted', color: 'brand.fg', px: 4, py: 2 },
    header: { px: 4, py: 3 },
    body: { px: 4, py: 3 },
  },
});

// theme.ts
// const config = defineConfig({ theme: { slotRecipes: { card: cardSlotRecipe } } })
// export const system = createSystem(defaultConfig, config)
```

```tsx
// components/Card/Card.tsx
"use client"
import { createSlotRecipeContext } from '@chakra-ui/react';
import { cardSlotRecipe } from '@/theme/recipes/card';

const { withProvider, withContext } = createSlotRecipeContext({ recipe: cardSlotRecipe });

// Prop types: derive from the official MCP (get_component_props); do not guess.
export const CardRoot = withProvider<HTMLDivElement, CardRootProps>('div', 'root');
export const CardHeader = withContext<HTMLDivElement, CardPartProps>('div', 'header');
export const CardBody = withContext<HTMLDivElement, CardPartProps>('div', 'body');
```

```tsx
// Usage: colorPalette plus boolean props (open / disabled / loading)
import { Button, Dialog } from '@chakra-ui/react';

<CardRoot colorPalette="brand">
  <CardHeader>Title</CardHeader>
  <CardBody>
    <Button colorPalette="brand" loading disabled>Save</Button>
  </CardBody>
</CardRoot>

<Dialog.Root open={open}>
  {/* parts: get_component_example for Dialog */}
</Dialog.Root>
```

Pass `unstyled` on the root to drop recipe styles. Foreground/background semantic pairs must meet WCAG AA in light and dark (`check_contrast` from the `design-styles` MCP server).

## Component Files Structure

```
components/{ComponentName}/
├── {ComponentName}.tsx          # Main component
├── {ComponentName}.test.tsx     # Unit tests
├── {ComponentName}.stories.tsx  # Storybook stories
├── {ComponentName}.module.css   # CSS modules (if needed)
├── index.ts                     # Barrel export
└── README.md                    # Component documentation
```

## Testing Template

```typescript
// components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('Click me')).toHaveStyle({ color: 'transparent' });
  });
});
```

## Output

```
✅ Component Generated: {ComponentName}

Files created:
- components/{ComponentName}/{ComponentName}.tsx
- components/{ComponentName}/{ComponentName}.test.tsx
- components/{ComponentName}/{ComponentName}.stories.tsx
- components/{ComponentName}/index.ts
- components/{ComponentName}/README.md

Features:
- TypeScript support with full type definitions
- Accessibility features (ARIA, keyboard navigation)
- Responsive design
- Dark mode compatible
- Storybook stories for documentation
- Unit tests with React Testing Library

Next steps:
1. Import: import { {ComponentName} } from '@/components/{ComponentName}';
2. Run tests: npm test {ComponentName}
3. View in Storybook: npm run storybook
4. Customize variants and sizes as needed
```
