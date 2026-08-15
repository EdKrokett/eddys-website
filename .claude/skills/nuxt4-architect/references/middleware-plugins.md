# Nuxt Middleware & Plugins

> **Paths:**
> - Route middleware: `app/middleware/`
> - Plugins: `app/plugins/`

## When to Use

Working with route guards, redirects, app extensions, or lifecycle hooks.

## Route Middleware

Route middleware runs before navigation. Used for auth checks and redirects.

### Global Middleware

Runs on every route change. **REQUIRED: Use `.global.ts` suffix:**

```ts
// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return navigateTo('/login')
  }
})
```

**Without `.global.ts` suffix, middleware is named (not global).**

### Named Middleware

Runs only when explicitly applied via `definePageMeta`. No `.global` suffix:

```ts
// app/middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAdmin } = useAuth()

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
```

Apply in page:

```vue
<!-- app/pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})
</script>
```

### Middleware Return Values

```ts
export default defineNuxtRouteMiddleware((to, from) => {
  return                            // Allow navigation
  return navigateTo('/login')       // Redirect
  return abortNavigation()          // Block navigation
  return abortNavigation('Denied')  // Block with error
})
```

### Middleware Order

1. Global middleware (alphabetical by filename)
2. Layout middleware
3. Page middleware (defined in `definePageMeta`)

## Plugins

Plugins extend the Vue app with global functionality. Run during app initialization.

### Basic Plugin

```ts
// app/plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const { token } = useAuth()
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      }
    }
  })

  return {
    provide: { api }
  }
})
```

Use in components:

```vue
<script setup lang="ts">
const { $api } = useNuxtApp()
const users = await $api('/users')
</script>
```

### Plugin with Vue Plugin

```ts
// app/plugins/toast.client.ts
import Toast from 'vue-toastification'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, { position: 'top-right', timeout: 3000 })
})
```

### Plugin with Hooks

```ts
// app/plugins/init.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:created', () => {
    console.log('App created')
  })

  nuxtApp.hook('page:finish', () => {
    console.log('Page loaded')
  })
})
```

### Client-Only or Server-Only

Use file suffix:

- `.client.ts` — runs only on client (browser APIs, analytics)
- `.server.ts` — runs only on server

### Plugin Order

Numeric prefix controls execution order:

```
app/plugins/
├── 01.auth.ts
├── 02.api.ts
└── 03.analytics.client.ts
```

## Best Practices

**Middleware:**

- Return `navigateTo()` or nothing — don't mutate state heavily
- Keep logic minimal — delegate to composables
- Use for guards & redirects only
- Global = `.global.ts` suffix required

**Plugins:**

- Use for app-wide functionality only
- Use `provide` for type safety
- Consider client/server context — use `.client`/`.server` suffix
- Minimize work in plugin initialization

## Common Mistakes

| Wrong | Right |
|---|---|
| `export default function({ route })` | `export default defineNuxtRouteMiddleware((to, from) => {})` |
| `redirect('/login')` | `return navigateTo('/login')` |
| `middleware/auth.ts` expecting global | `middleware/auth.global.ts` |
| `middleware/` (project root) | `app/middleware/` |
| Plugin without defineNuxtPlugin | Wrap in `defineNuxtPlugin()` |
| `useAuthStore()` (Pinia) | `useAuth()` composable |
