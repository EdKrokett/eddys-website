# Data Fetching & Reactivity in Nuxt 4

## shallowRef Default

`useFetch` and `useAsyncData` return data in a `shallowRef` by default (confirmed in source: `asyncData.js` line 320). Vue only tracks `.value` replacement, not nested property changes.

### Silent Bug (no re-render)
```typescript
const { data } = await useFetch<User>('/api/me')
data.value.name = 'Updated'           // DOM NOT updated
data.value.settings.theme = 'dark'    // DOM NOT updated
```

### Correct Patterns

Replace entire value (preferred):
```typescript
data.value = { ...data.value, name: 'Updated' }
```

Opt into deep reactivity when needed:
```typescript
const { data } = await useFetch<User>('/api/me', { deep: true })
data.value.name = 'Updated'  // Works with deep: true
```

Use triggerRef for manual trigger:
```typescript
import { triggerRef } from 'vue'
data.value.name = 'Updated'
triggerRef(data)  // Force re-render
```

## Status Values

The `status` ref replaces the older `pending` boolean. Four possible values:
- `'idle'` – not yet started
- `'pending'` – fetch in progress
- `'success'` – completed successfully
- `'error'` – fetch failed

## When to Use What

- Page load / SSR data → `useFetch` (hydration-safe, prevents double-fetch)
- Complex async logic → `useAsyncData` (full control over fetch function)
- User action (click/submit) → `$fetch` (no watcher overhead, one-shot request)
- Lazy/below-fold data → `useFetch` with `{ lazy: true }` (non-blocking, loads after navigation)

## useFetch Signature

```typescript
const {
  data,       // Ref<T | null> (shallowRef by default)
  status,     // Ref<'idle' | 'pending' | 'success' | 'error'>
  error,      // Ref<FetchError | undefined>
  refresh,    // (opts?) => Promise<void>
  execute,    // (opts?) => Promise<void> (alias for refresh)
  clear,      // () => void
} = await useFetch<T>(url, {
  // Key options:
  key: 'unique-key',          // deterministic hydration key
  method: 'GET',              // HTTP method
  query: { page, limit },     // reactive query params
  body: payload,              // request body (POST/PUT)
  headers: {},                // request headers
  watch: [page],              // reactive sources that trigger refetch
  deep: false,                // true → ref instead of shallowRef
  lazy: false,                // true → non-blocking, doesn't hold navigation
  server: true,               // false → skip SSR, client-only
  immediate: true,            // false → don't fetch on mount, use execute()
  dedupe: 'cancel',           // 'cancel' | 'defer' for duplicate requests
  default: () => [],          // default value before data loads
  getCachedData(key, nuxtApp) {
    // Return cached data to skip fetch, or undefined to fetch
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  },
})
```

## Anti-Patterns

### useFetch inside event handlers
```typescript
// WRONG: creates watchers + state on every call → memory leak
async function onClick() {
  const { data } = await useFetch('/api/action')
}

// CORRECT: use $fetch for event-driven requests
async function onClick() {
  const result = await $fetch('/api/action', { method: 'POST', body: { id: 1 } })
}
```

### useFetch without status handling
```typescript
// WRONG: raw data access causes flicker/undefined errors
const { data } = await useFetch('/api/items')
// template: {{ data.title }}  ← crashes if data is null during load
```

### Always handle status in templates
```vue
<template>
  <div v-if="status === 'error'">Error: {{ error?.message }}</div>
  <div v-else-if="status === 'pending'">Loading...</div>
  <div v-else-if="data">{{ data.title }}</div>
</template>
```

## Hydration Safety

- Wrap browser-only code in `onMounted()` or `<ClientOnly>`
- Never use `window`, `document`, `localStorage` in `<script setup>` top-level
- Use `useCookie()` instead of `localStorage` for SSR-compatible persistence

## SSR-Safe State

For shared reactive state across components, use `useState` (SSR-safe) instead of plain `ref`:

```typescript
// composables/useCounter.ts
export function useCounter() {
  const count = useState('counter', () => 0)  // SSR-safe, shared across components
  const increment = () => count.value++
  return { count, increment }
}
```

`useState` data is serialized during SSR and hydrated on the client. Plain `ref` would reset to initial value on hydration.
