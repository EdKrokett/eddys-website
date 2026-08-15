# Nuxt Configuration

> **Path:** `nuxt.config.ts`

## When to Use

Configuring modules, runtime config, route rules, auto-imports, Nitro, or experimental features.

## Actual Project Config

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },
})
```

**Important:** `@nuxt/ui` automatically registers `@tailwindcss/vite`. Do NOT add `@nuxtjs/tailwindcss` — it conflicts.

## Runtime Config

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private (server-only)
    apiSecret: process.env.API_SECRET,

    public: {
      // Public (client + server)
      apiBase: process.env.API_BASE || 'http://localhost:3000'
    }
  }
})
```

Access in app:

```ts
const config = useRuntimeConfig()

// Server-side: config.apiSecret (available)
// Client-side: config.public.apiBase (available)
// Client-side: config.apiSecret → undefined (private)
```

## Auto-Imports

Nuxt auto-imports from these directories under `app/`:

- `components/` — Vue components
- `composables/` — Composition functions
- `utils/` — Utility functions

Server auto-imports from `server/utils/`.

### Custom Auto-Import Directories

```ts
export default defineNuxtConfig({
  imports: {
    dirs: ['stores', 'types']
  }
})
```

## App Config

For non-sensitive config exposed to client:

```ts
// app/app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
    }
  }
})
```

Access: `const appConfig = useAppConfig()`

## Route Rules

Pre-render, cache, or customize routes:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
    '/admin/**': { ssr: false },
    '/blog/**': { swr: 3600 },        // Cache for 1 hour
    '/**': { isr: 60 },               // ISR: regenerate every 60s
  }
})
```

### Route Rule Layouts (Nuxt 4.3+)

Apply layouts via route rules for centralized layout management:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/admin/**': { appLayout: 'admin' },
    '/docs/**': { appLayout: 'docs' },
    '/': { appLayout: 'default' }
  }
})
```

## TypeScript

```ts
export default defineNuxtConfig({
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false
  }
})
```

## Experimental Features

```ts
export default defineNuxtConfig({
  experimental: {
    typedPages: true,
    viewTransition: true,
    payloadExtraction: true  // ISR/SWR payload extraction (Nuxt 4.3+)
  }
})
```

## Nitro Config

Server engine configuration:

```ts
export default defineNuxtConfig({
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/api/**': { cors: true }
    }
  }
})
```

## Layers

Extend or share configuration:

```ts
export default defineNuxtConfig({
  extends: ['./base-layer']
})
```

## Environment Variables

Use `.env` file at the project root:

```env
API_SECRET=secret123
API_BASE=https://api.example.com
```

Access via `useRuntimeConfig()` — NEVER use `process.env` in client code.

## Common Mistakes

| Wrong | Right |
|---|---|
| Hardcoded API URLs | Use `runtimeConfig.public` |
| Secrets in `app.config.ts` | Use `runtimeConfig` (private) |
| `process.env` in client code | Use `useRuntimeConfig()` |
| Adding `@nuxtjs/tailwindcss` | `@nuxt/ui` handles Tailwind |
| `tailwind.config.ts` | CSS-only config via `@theme {}` |
| Import everything manually | Let Nuxt auto-import |
