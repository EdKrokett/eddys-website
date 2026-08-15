# UX Patterns for Nuxt 4 + Nuxt UI v4

Code is not "done" until it handles loading, errors, and user feedback.

## 1. Loading States

Every `useFetch`/`useAsyncData` must handle all status values.

```vue
<script setup lang="ts">
const { data, status, error, refresh } = await useFetch<Item[]>('/api/items')
</script>

<template>
  <!-- Error state -->
  <div v-if="status === 'error'" class="p-4">
    <p>Failed to load: {{ error?.message }}</p>
    <UButton @click="refresh()">Retry</UButton>
  </div>

  <!-- Loading state -->
  <div v-else-if="status === 'pending'" class="space-y-4">
    <USkeleton class="h-8 w-1/3" />
    <USkeleton class="h-4 w-full" />
    <USkeleton class="h-4 w-2/3" />
  </div>

  <!-- Content -->
  <div v-else-if="data">
    <!-- actual content here -->
  </div>
</template>
```

## 2. Form Handling with Server-Route Validation Error Mapping

### UForm + UFormField + Zod (Standard Schema)

Nuxt UI supports any Standard Schema library: Zod, Valibot, Yup, Joi. None are bundled.

```vue
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Min 2 characters'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  name: '',
})

const form = ref()
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  form.value?.clear()
  loading.value = true
  try {
    await $fetch('/api/users', { method: 'POST', body: event.data })
    useToast().add({ title: 'Saved successfully', color: 'success' })
    navigateTo('/users')
  } catch (err: unknown) {
    const fetchErr = err as { statusCode?: number; data?: Record<string, unknown>; message?: string }
    if (fetchErr.statusCode === 422 && fetchErr.data) {
      const errors: Array<{ path: string; message: string }> = []

      // Nitro server-route format: createError({ statusCode: 422, data: { errors: { field: ['msg'] } } })
      if (fetchErr.data.errors) {
        const fieldErrors = fetchErr.data.errors as Record<string, string | string[]>
        Object.entries(fieldErrors).forEach(([k, v]) => {
          errors.push({ path: k, message: Array.isArray(v) ? v[0] : v })
        })
      }

      form.value?.setErrors(errors)
    } else {
      useToast().add({
        title: 'Error',
        description: fetchErr.message || 'Unknown error',
        color: 'error',
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm ref="form" :schema="schema" :state="state" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" />
    </UFormField>
    <UFormField label="Name" name="name">
      <UInput v-model="state.name" />
    </UFormField>
    <UButton type="submit" :loading="loading">Save</UButton>
  </UForm>
</template>
```

### Key Form Rules
- Use `$fetch` (NOT `useFetch`) for form submissions
- Use `UFormField` (NOT `UFormGroup` – that's the v2 name)
- Parse 422 errors into field-level messages via `form.setErrors()`
- The `:loading` prop on UButton disables it during request
- Use `color="success"` / `color="error"` on toasts (NOT `color="green"` / `color="red"`)
- UForm validates on `input`, `change`, `blur` events by default; always on `submit`
- Nested fields use dot notation: `name="address.city"` matches `z.object({ address: z.object({ city: ... }) })`

### UForm Exposed Methods
```typescript
const form = ref()

form.value.submit()              // trigger programmatic submit
form.value.validate()            // validate all, returns FormData or throws
form.value.validate({ silent: true })  // validate without setting errors, returns FormData or false
form.value.clear()               // clear all fields and errors
form.value.clear('email')        // clear specific field
form.value.setErrors([...])      // set field errors from API response
form.value.getErrors()           // get all current errors
form.value.getErrors('email')    // get errors for specific field
form.value.errors                // Ref of all errors
form.value.dirty                 // boolean: any field changed
form.value.loading               // Ref<boolean>: auto-managed during submit
```

## 3. Action Feedback

Every mutating action (POST/PUT/DELETE) must provide feedback via toast:

```typescript
async function deleteItem(id: number) {
  try {
    await $fetch(`/api/items/${id}`, { method: 'DELETE' })
    useToast().add({ title: 'Item deleted', color: 'success' })
    refresh() // refresh the list
  } catch (err: unknown) {
    const fetchErr = err as { message?: string }
    useToast().add({
      title: 'Delete failed',
      description: fetchErr.message || 'Unknown error',
      color: 'error',
    })
  }
}
```

### useToast API
```typescript
const toast = useToast()

// Add a toast (returns the toast object with id)
const t = toast.add({
  title: 'Title',
  description: 'Optional details',
  color: 'success',        // primary | secondary | success | info | warning | error | neutral
  icon: 'i-lucide-check',  // optional Iconify icon
  duration: 5000,           // auto-close in ms (0 = never)
  actions: [{               // optional action buttons
    label: 'Undo',
    onClick: () => { /* ... */ },
  }],
})

toast.update(t.id, { title: 'Updated' })
toast.remove(t.id)
toast.clear()
```

## 4. Confirmation for Destructive Actions

```vue
<script setup lang="ts">
const showConfirm = ref(false)
const deleting = ref(false)

async function confirmDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/items/${itemId}`, { method: 'DELETE' })
    useToast().add({ title: 'Deleted', color: 'success' })
    showConfirm.value = false
  } catch (err: unknown) {
    const fetchErr = err as { message?: string }
    useToast().add({ title: 'Failed', description: fetchErr.message, color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UButton color="error" @click="showConfirm = true">Delete</UButton>

  <UModal v-model:open="showConfirm" title="Confirm deletion">
    <template #body>
      <p>Are you sure? This action cannot be undone.</p>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <UButton variant="ghost" @click="showConfirm = false">Cancel</UButton>
        <UButton color="error" :loading="deleting" @click="confirmDelete">Delete</UButton>
      </div>
    </template>
  </UModal>
</template>
```

UModal props:
- `v-model:open` controls open/close
- `title` / `description` for header content
- Slots: `header`, `title`, `description`, `body`, `footer`, `close`
- `:close="true"` – show close button
- `:prevent-close="false"` – prevent close on overlay click
- `fullscreen` – takes entire viewport

### Programmatic Overlays (useOverlay)

For confirm dialogs and dynamic modals, use `useOverlay` instead of managing refs:

```typescript
const overlay = useOverlay()

async function confirmDelete(itemId: number) {
  const modal = overlay.create(ConfirmDialog, {
    props: { title: 'Delete?', message: 'This cannot be undone.' },
    events: {
      confirm: () => modal.close(true),
      cancel: () => modal.close(false)
    }
  })

  if (await modal.result) {
    await $fetch(`/api/items/${itemId}`, { method: 'DELETE' })
    useToast().add({ title: 'Deleted', color: 'success' })
  }
}
```

### Slideover (Side Panel)

```vue
<USlideover v-model:open="isOpen" title="Settings" side="right">
  <div class="p-4">Content...</div>
</USlideover>
```

Props: `side` (`left` | `right` | `top` | `bottom`), `title`, `description`, `:prevent-close`

### Drawer (Bottom Sheet)

```vue
<UDrawer v-model:open="isOpen" title="Options" handle>
  <div class="p-4">Content...</div>
</UDrawer>
```

Props: `handle` (drag handle), `:should-scale-background`, `:close-threshold`

### Tooltip

```vue
<UTooltip text="Helpful tip">
  <UButton icon="i-lucide-help-circle" />
</UTooltip>
```

### DropdownMenu

```vue
<UDropdownMenu :items="[
  { label: 'Edit', icon: 'i-lucide-pencil', click: () => edit() },
  { label: 'Duplicate', icon: 'i-lucide-copy' },
  { type: 'separator' },
  { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' }
]">
  <UButton icon="i-lucide-ellipsis-vertical" variant="ghost" />
</UDropdownMenu>
```

### CommandPalette (Search)

```vue
<UCommandPalette v-model:open="isOpen" :groups="groups" placeholder="Search..." />
```

Open via keyboard shortcut:

```typescript
defineShortcuts({ meta_k: () => { isOpen.value = true } })
```

## 5. TypeScript Standards

- No `any` – type unknown catches, then narrow with type assertion
- Use generics with useFetch: `useFetch<MyDTO>('/api/...')`
- Keep DTOs in `shared/types/` for app+server sharing
- WordPress REST responses are `snake_case` → map to `camelCase` once in the server route (see `server/api/blog.get.ts`), never re-map downstream

```typescript
// shared/types/user.ts
export interface UserDTO {
  id: number
  full_name: string
  email: string
  is_active: boolean
  created_at: string
}
```

## 6. Key Nuxt UI Component Props

### UButton
- `color`: primary | secondary | success | info | warning | error | neutral
- `variant`: solid | outline | soft | subtle | ghost | link
- `size`: xs | sm | md | lg | xl
- `loading`: boolean (shows spinner, disables interaction)
- `loadingAuto`: boolean (auto-manages loading from onClick promise)
- `icon` / `leadingIcon` / `trailingIcon`: Iconify icon name
- `disabled`: boolean
- `block`: boolean (full width)
- `type`: button | submit | reset
- `to`: route link (makes it a NuxtLink)

### UInput
- `v-model`: string/number value
- `type`: text | email | password | number | etc.
- `placeholder`: string
- `color` / `variant` / `size`: same pattern as UButton
- `loading`: boolean
- `icon` / `leadingIcon` / `trailingIcon`: Iconify icon name
- `disabled` / `required` / `autofocus`: boolean
- Modifiers: `v-model.trim`, `v-model.number`, `v-model.lazy`

**UCard** — Slots: `header`, `default`, `footer`. `variant`: outline (default).
**USkeleton** — Styled via class: `<USkeleton class="h-4 w-full" />`
**UTextarea** — `v-model` string, `rows`, `autoresize` (auto-grow), `maxrows`.

### USelectMenu (Searchable Dropdown)
- `v-model`: selected value(s)
- `options`: `[{ label, value, avatar?, icon?, disabled? }]`
- `searchable`, `multiple`, `clear` (v4.4+)
- Slot: `#option="{ option }"`

### Other Input Components

| Component | v-model | Key Props |
|---|---|---|
| `UInputMenu` | selected value | `options` (= USelectMenu), `searchable` |
| `UInputDate` (v4.2+) | Date / `{ start, end }` | `mode`: single/range, `locale` |
| `UInputTime` (v4.2+) | Time (`@internationalized/date`) | `hour-cycle`: 12/24, `minute-step` |
| `UInputNumber` | number | `min`, `max`, `step`, `format-options` |
| `UInputTags` | string[] | `max`, `placeholder` |

**USwitch** — `v-model` boolean, `label`, `description`, `on-icon`/`off-icon`.
**UCheckbox** — `v-model` boolean, `label`, `description`.
**UCheckboxGroup** — `v-model` array, `items: [{ label, value, description? }]`, `orientation`.
**URadioGroup** — `v-model` string, `items` (same), `orientation`.

### UFileUpload
- `v-model`: FileList
- `accept`: file type filter
- `multiple`: boolean
- `max-files`: number
- Use with `useFileUpload()` composable:

```typescript
const { files, open, reset, remove } = useFileUpload({
  accept: 'image/*', multiple: true, maxFiles: 5, maxSize: 5 * 1024 * 1024
})
```

### UFormField (Full Props)
- `name`: field name (matches state key and schema)
- `label`: label text
- `description`: help text below input
- `hint`: right-aligned hint text
- `required`: shows asterisk
- `:help`: manual error message

### UFieldGroup (Group Inputs)

```vue
<UFieldGroup label="Full Name">
  <UInput v-model="firstName" placeholder="First" />
  <UInput v-model="lastName" placeholder="Last" />
</UFieldGroup>
```

## 6b. Nuxt UI Composables

| Composable | Purpose |
|---|---|
| `useToast()` | Show notifications (see Section 3) |
| `useOverlay()` | Programmatic modals/slidelovers/drawers (see Section 4) |
| `defineShortcuts()` | Keyboard shortcuts |
| `useScrollspy()` | Track scroll position for anchor navigation |
| `useFileUpload()` | File upload handling |
| `useFormField()` | Access form field context in custom components |
| `useColorMode()` | Dark mode toggle (see `styling.md`) |
| `useKbd()` | Reactive keyboard modifier state |
| `defineLocale()` | Define i18n locale for Nuxt UI components |

### defineShortcuts

```typescript
defineShortcuts({
  meta_k: () => openSearch(),           // Cmd+K (Mac) / Ctrl+K (Win)
  meta_shift_p: () => openPalette(),    // Cmd+Shift+P
  escape: () => closeModal(),
  meta_enter: {
    handler: () => submit(),
    whenever: [isFormValid]             // Conditional shortcut
  }
})
```

| Key | Meaning |
|---|---|
| `meta` | Cmd (Mac) / Ctrl (Windows) |
| `ctrl` | Ctrl key |
| `alt` | Alt / Option key |
| `shift` | Shift key |
| `_` | Key separator |

### useScrollspy

```typescript
const { activeId } = useScrollspy({
  ids: ['section-1', 'section-2', 'section-3'],
  offset: 100
})
// activeId.value = 'section-2' (currently visible)
```

### useFormField (Custom Form Components)

Access form field context when building custom inputs inside UFormField:

```typescript
const { name, error, disabled } = useFormField()
```

## 7. Accessibility (CRITICAL)

Every component MUST meet these standards.

### Color Contrast

- **4.5:1 minimum** for normal text (WCAG AA)
- **3:1 minimum** for large text (18px+ or 14px+ bold)
- Nuxt UI semantic colors (`primary`, `error`, etc.) are designed to meet contrast — use them, don't override with low-contrast custom colors
- **Color is never the only indicator** — pair with icons, text, or patterns

### Focus States

Nuxt UI components have built-in focus rings. For custom interactive elements:

```vue
<!-- Custom clickable element needs visible focus -->
<div
  tabindex="0"
  class="rounded-lg p-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
  @click="handleClick"
  @keydown.enter="handleClick"
>
  Content
</div>
```

### Keyboard Navigation

- Tab order MUST match visual order
- All interactive elements reachable via keyboard
- `@keydown.enter` and `@keydown.space` on custom clickable elements
- Escape closes modals/overlays (UModal handles this automatically)

### ARIA & Semantic HTML

- `aria-label` on icon-only buttons: `<UButton icon="i-lucide-x" aria-label="Close" />`
- Use `<NuxtImg>` with `alt` for meaningful images, `alt=""` for decorative
- Use `<label>` for form inputs (UFormField handles this via `label` prop)
- Use semantic elements: `<nav>`, `<main>`, `<aside>`, `<section>`

### Reduced Motion

Respect `prefers-reduced-motion` for all custom animations:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

For Vue transitions, check programmatically:

```ts
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
```

## 8. Touch & Interaction

### Touch Targets

- **Minimum 44x44px** for all interactive elements on mobile
- Nuxt UI buttons/inputs meet this by default at size `md` and above
- For custom clickable elements, ensure sufficient padding:

```vue
<!-- Too small on mobile -->
<span class="text-sm cursor-pointer" @click="action">Link</span>

<!-- Correct: adequate touch target -->
<button class="min-h-[44px] min-w-[44px] p-3" @click="action">Link</button>
```

### Cursor & Hover

- Nuxt UI components handle `cursor-pointer` automatically
- **Custom clickable elements** need explicit `cursor-pointer`
- Hover feedback via color/opacity transitions, NOT scale transforms that shift layout:

```vue
<!-- Good: color transition, no layout shift -->
<div class="cursor-pointer transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">

<!-- Bad: scale shifts surrounding content -->
<div class="cursor-pointer hover:scale-105">
```

### Transitions

- **150–300ms** for micro-interactions (hover, focus, toggle)
- **300–500ms** for larger transitions (modals, drawers, page transitions)
- Use `transform` and `opacity` only — never animate `width`, `height`, `top`, `left`
- Tailwind: `transition-colors duration-200`, `transition-opacity duration-150`

## 9. Layout Shift Prevention

Async content MUST reserve space to prevent layout jumps:

```vue
<template>
  <!-- Reserve space with min-height while loading -->
  <div class="min-h-[200px]">
    <USkeleton v-if="status === 'pending'" class="h-[200px] w-full" />
    <div v-else-if="data">{{ data }}</div>
  </div>
</template>
```

- Set explicit `width` + `height` on `<NuxtImg>` to prevent CLS
- Use `USkeleton` matching the final content dimensions
- Fixed/sticky elements: account for their height with padding on adjacent content

## 10. Typography

- **Minimum 16px (1rem)** body text on mobile — never smaller
- **Line height 1.5–1.75** for body text (Tailwind: `leading-relaxed` or `leading-loose`)
- **Line length 65–75 characters** max for readability (Tailwind: `max-w-prose`)
- Use the project's `@theme` font stack — don't add ad-hoc font families

```vue
<!-- Readable text block -->
<p class="max-w-prose text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
  Long form content here...
</p>
```

## 11. Icons

Nuxt UI uses **Iconify** for icons. Use Lucide as the primary icon set (`i-lucide-*`).

- **NEVER use emojis as UI icons** — use SVG icons via Iconify
- **Consistent sizing**: default to `w-5 h-5` (20px), use `w-4 h-4` for small contexts
- UButton icon prop: `icon="i-lucide-plus"`, `leadingIcon`, `trailingIcon`
- Standalone: `<UIcon name="i-lucide-check" class="w-5 h-5" />`

```vue
<!-- Good: Iconify via Nuxt UI -->
<UButton icon="i-lucide-trash-2" color="error" aria-label="Delete" />

<!-- Bad: emoji as icon -->
<UButton>🗑️ Delete</UButton>
```

Browse available icons: https://icones.js.org/collection/lucide

## 12. Dark Mode & Contrast

Nuxt UI supports dark mode via `color-mode`. Ensure both modes work.

### Text Contrast

| Context | Light Mode | Dark Mode |
|---|---|---|
| Body text | `text-neutral-700` or darker | `text-neutral-300` or lighter |
| Muted/secondary | `text-neutral-500` minimum | `text-neutral-400` minimum |
| On colored bg | Test 4.5:1 contrast ratio | Test 4.5:1 contrast ratio |

### Borders & Surfaces

- Light mode borders: `border-neutral-200` (visible)
- Dark mode borders: `dark:border-neutral-800` (visible)
- Transparent/glass cards: use `bg-white/80 dark:bg-neutral-900/80` — NOT `bg-white/10` (invisible in light mode)

### Always Test Both

- Use Nuxt DevTools color mode toggle during development
- Check text readability on all background colors in both modes

## 13. Responsive Breakpoints

Test at these widths before delivery:

| Breakpoint | Width | Tailwind Prefix |
|---|---|---|
| Mobile | 375px | (default) |
| Tablet | 768px | `md:` |
| Desktop | 1024px | `lg:` |
| Wide | 1440px | `xl:` |

- **No horizontal scroll** at any breakpoint
- Use `max-w-7xl mx-auto` for consistent content width
- Fixed/sticky navbars: add `pt-[navbar-height]` to body content

## 14. Pre-Delivery UX Checklist

Run through before marking any frontend task as done:

### Interaction
- [ ] Loading states for all async data (skeleton or spinner)
- [ ] Error states with retry option
- [ ] Toast feedback for all mutations (POST/PUT/DELETE)
- [ ] Confirmation dialog for destructive actions
- [ ] Buttons disabled/loading during async operations

### Accessibility
- [ ] `alt` text on all meaningful images
- [ ] `aria-label` on icon-only buttons
- [ ] Form inputs have labels (via UFormField)
- [ ] Focus states visible on all interactive elements
- [ ] Tab order matches visual order
- [ ] `prefers-reduced-motion` respected for custom animations

### Visual Quality
- [ ] No emojis used as UI icons (use Iconify/Lucide)
- [ ] Text contrast meets 4.5:1 in both light and dark mode
- [ ] No layout shift from async content loading
- [ ] Hover states don't cause layout shift
- [ ] Consistent spacing and max-width across pages

### Responsive
- [ ] Works at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Body text minimum 16px on mobile
