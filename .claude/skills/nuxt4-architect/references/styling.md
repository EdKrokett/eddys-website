# Tailwind CSS v4 + Nuxt UI Styling

> Setup (CSS entry point, forbidden files, v3→v4 syntax, color aliases) → SKILL.md. This reference covers theming, utilities, and advanced patterns.

**Quick notes:** In `main.css`, order matters: `@import "tailwindcss"` → `@import "@nuxt/ui"` → `@theme static {}`. Tailwind utility classes work in `class` — only component `color` prop requires aliases. `@apply` works in `<style scoped>`. Prefer utility classes. Plugins: `@plugin "...";` in CSS (replaces v3 `require()`).

## Theme Customization

### Level 1: CSS @theme (Tailwind tokens)

```css
/* app/assets/css/main.css */
@theme static {
  --font-sans: 'Public Sans', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --color-brand-50: oklch(0.97 0.01 240);
  --color-brand-500: oklch(0.55 0.15 240);
  --color-brand-900: oklch(0.25 0.08 240);
  --spacing-128: 32rem;
}
```

These become Tailwind classes: `font-sans`, `text-brand-500`, `p-128`.

### Level 2: App Config (Nuxt UI color mapping)

```typescript
// app/app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
    },
  },
})
```

Maps `color="primary"` on Nuxt UI components to Tailwind's green palette.

## Nuxt UI CSS Variable Utilities

Semantic classes auto-adapting to light/dark mode. **Prefer these over raw Tailwind color classes.**

### Text

| Class | Light | Dark | Use for |
|---|---|---|---|
| `text-dimmed` | 400 | 500 | Placeholders, hints |
| `text-muted` | 500 | 400 | Secondary text |
| `text-toned` | 600 | 300 | Subtitles |
| `text-default` | 700 | 200 | Body text |
| `text-highlighted` | 900 | 100 | Headings, emphasis |
| `text-inverted` | 50 | 950 | On dark/light backgrounds |

### Backgrounds

| Class | Light | Dark | Use for |
|---|---|---|---|
| `bg-default` | white | 900 | Page background |
| `bg-muted` | 50 | 800 | Subtle sections |
| `bg-elevated` | white | 800 | Cards, modals |
| `bg-accented` | 100 | 700 | Hover states |
| `bg-inverted` | 900 | 100 | Inverted sections |

### Borders

| Class | Light | Dark |
|---|---|---|
| `border-default` | 200 | 800 |
| `border-muted` | 100 | 800 |
| `border-accented` | 200 | 700 |
| `border-inverted` | 900 | 100 |

### Global CSS Variables

```css
:root {
  --ui-radius: 0.25rem;       /* Base border radius */
  --ui-container: 80rem;      /* Container max-width */
  --ui-header-height: 4rem;   /* Header height */
}
```

Override in `app/assets/css/main.css`:

```css
:root {
  --ui-radius: 0.5rem;
  --ui-primary: var(--ui-color-primary-700);
}
.dark {
  --ui-primary: var(--ui-color-primary-200);
}
```

## Component Theme Override (Tailwind Variants)

### Level 3: Global Override via app.config.ts

```typescript
export default defineAppConfig({
  ui: {
    button: {
      slots: { base: 'font-bold rounded-full' },
      variants: { size: { md: { base: 'px-6 py-3' } } },
      defaultVariants: { color: 'neutral', variant: 'outline' }
    }
  },
})
```

### Level 4: Per-Instance Override

```vue
<UButton :ui="{ base: 'font-mono' }">Custom</UButton>
<UButton class="rounded-none">Square</UButton>  <!-- class overrides root/base slot -->
```

### CRITICAL: Match Component Theme Structure

**Slots-based** (Button, Card, Input, Select, most): `ui: { button: { slots: { base: '...' } } }`

**Flat base** (Container, Skeleton, Form, Main): `ui: { container: { base: '...' } }`

Check https://ui.nuxt.com/components/[name] Theme section.

## Adding Custom Semantic Colors

To add beyond the 7 defaults (e.g., `tertiary`):

1. Register in `nuxt.config.ts`:
```typescript
ui: { theme: { colors: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'neutral'] } }
```

2. Define shades in `app/assets/css/main.css`:
```css
@theme {
  --color-tertiary-50: #fef2f2;
  --color-tertiary-100: #fee2e2;
  /* ... all shades 200-800 ... */
  --color-tertiary-900: #7f1d1d;
  --color-tertiary-950: #450a0a;
}
```

3. Assign in `app/app.config.ts`:
```typescript
export default defineAppConfig({ ui: { colors: { tertiary: 'tertiary' } } })
```

4. Use: `<UButton color="tertiary">Custom</UButton>`

## Dark Mode

`@nuxtjs/color-mode` is auto-installed by `@nuxt/ui`.

```typescript
const colorMode = useColorMode()
colorMode.preference = 'dark'  // 'light' | 'dark' | 'system'
```

Built-in: `<UColorModeButton />`, `<UColorModeSelect />`, `<UColorModeSwitch />`

## Advanced Tailwind v4 CSS Patterns

### Design Token Hierarchy

Structure: **Brand Tokens** (abstract OKLCH values) → **Semantic Tokens** (`--color-primary` in `@theme`) → **Component Tokens** (Tailwind classes `bg-primary`). Never hardcode raw color values in templates.

### OKLCH Colors

Perceptually uniform. Always pair foreground + background tokens:

```css
@theme static {
  --color-brand-500: oklch(0.55 0.15 240);
  --color-brand-foreground: oklch(0.98 0.01 240);
}
```

Lightness (1st value): `0.95+` = tints, `0.15-0.30` = shades.

### `size-*` Shorthand

`size-10` = `w-10 h-10`. Use for square elements (icons, avatars).

### Animation Tokens

Keyframes inside `@theme` output when referenced by `--animate-*`:

```css
@theme static {
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-slide-in: slide-in 0.3s ease-out;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-in {
    from { transform: translateY(-0.5rem); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
```

Use: `class="animate-fade-in"`

### `@starting-style` for Entry Animations

Native CSS for animating elements on appear. Nuxt UI handles its own transitions — use only for custom elements:

```css
[popover] {
  transition: opacity 0.2s, transform 0.2s, display 0.2s allow-discrete;
  opacity: 0; transform: scale(0.95);
}
[popover]:popover-open { opacity: 1; transform: scale(1); }
@starting-style {
  [popover]:popover-open { opacity: 0; transform: scale(0.95); }
}
```

### `@utility` Directive

Custom utilities in CSS (replaces v3 plugins):

```css
@utility text-gradient {
  @apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent;
}
```

### `@theme` Modifiers

| Modifier | Behavior | Use when |
|---|---|---|
| `@theme` | Tree-shaken (unused removed) | Most tokens |
| `@theme static` | Always output | Tokens used by JS/external CSS |
| `@theme inline` | References CSS variables | Font stacks from vars |

Our project uses `@theme static` because Nuxt UI and JS may reference tokens.

### Namespace Overrides

`--color-*: initial` clears all defaults. **WARNING**: Do NOT use with `@nuxt/ui` — breaks the color system. Only for bare Tailwind.

### `color-mix()` for Alpha Variants

```css
@theme {
  --color-primary-5: color-mix(in oklab, var(--color-primary) 5%, transparent);
  --color-primary-10: color-mix(in oklab, var(--color-primary) 10%, transparent);
}
```

For hover overlays, disabled states, subtle backgrounds.

### Container Queries

```css
@theme {
  --container-xs: 20rem;  --container-sm: 24rem;
  --container-md: 28rem;  --container-lg: 32rem;
}
```

```vue
<div class="@container">
  <div class="@sm:flex @sm:gap-4"><!-- Responds to parent, not viewport --></div>
</div>
```
