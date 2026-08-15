# Nuxt File-Based Routing

> **Path:** All pages live at `app/pages/`, NOT `pages/` at the project root.

## When to Use

Working with pages, layouts, navigation, or route configuration.

## File-Based Routing Basics

`app/pages/` folder structure directly maps to routes. File names determine URLs.

**Key principles:**

- **ALWAYS use descriptive params:** `[userId].vue` NOT `[id].vue`
- **Optional params:** `[[paramName]].vue`
- **Catch-all:** `[...path].vue`
- **Route groups for organization:** `(folder)/` groups files without affecting URLs

## File Structure Example

```
app/pages/
├── index.vue               # /
├── about.vue               # /about
├── [...slug].vue           # catch-all for 404
├── users.vue               # parent route (layout for /users/*)
└── users/
    ├── index.vue           # /users
    └── [userId].vue        # /users/:userId
```

## Route Groups

Route groups organize files WITHOUT affecting URLs. Wrap folder names in parentheses:

```
app/pages/
├── (marketing)/            # group folder (ignored in URL)
│   ├── about.vue           # /about (not /marketing/about)
│   └── pricing.vue         # /pricing
└── (admin)/                # group folder (ignored in URL)
    ├── dashboard.vue       # /dashboard
    └── settings.vue        # /settings
```

**Access route groups in middleware:**

```ts
// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  if (to.meta.groups?.includes('admin')) {
    // check admin access
  }
})
```

## Parent Routes (Nested Layouts)

Parent route = layout for nested routes. Use `<NuxtPage />` (NOT `<Nuxt />`):

```vue
<!-- app/pages/users.vue -->
<template>
  <div class="users-layout">
    <nav>
      <NuxtLink to="/users">All Users</NuxtLink>
      <NuxtLink to="/users/create">Create User</NuxtLink>
    </nav>
    <NuxtPage />
  </div>
</template>
```

```
app/pages/
├── users.vue           # Parent route with <NuxtPage />
└── users/
    ├── index.vue       # /users
    ├── [userId].vue    # /users/:userId
    └── create.vue      # /users/create
```

## definePage() for Route Customization

```vue
<!-- app/pages/profile.vue -->
<script setup lang="ts">
definePage({
  name: 'user-profile',
  path: '/profile/:userId',
  alias: ['/me'],
  meta: {
    requiresAuth: true,
    title: 'User Profile',
  }
})
</script>
```

## Typed Router

**ALWAYS use typed routes for navigation:**

```ts
// Type-safe with route name
await navigateTo({ name: '/users/[userId]', params: { userId: '123' } })

// WRONG: String-based (not type-safe)
await navigateTo('/users/123')
```

**REQUIRED: Check `typed-router.d.ts` for available route names and params before navigating.**

## useRoute with Types

```ts
// Generic route
const route = useRoute()

// Typed route (preferred)
const route = useRoute('/users/[userId]')
// route.params.userId is now typed correctly
```

## Navigation

```ts
await navigateTo('/about')
await navigateTo({ name: '/users/[userId]', params: { userId: '123' } })
await navigateTo({ path: '/search', query: { q: 'nuxt' } })
await navigateTo('https://nuxt.com', { external: true })
await navigateTo('/login', { replace: true })
await navigateTo('/docs', { open: { target: '_blank' } })
```

## Route Meta & Layout

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'dashboard',
  meta: { requiresAuth: true }
})
</script>
```

## Dynamic Layout Switching (Nuxt 4.3+)

```vue
<script setup lang="ts">
const user = useUser()

if (!user.value) {
  setPageLayout('guest')
} else {
  setPageLayout('dashboard')
}
</script>
```

## Dynamic Route Patterns

```
[userId].vue              # /users/123
[[slug]].vue              # /blog or /blog/post (optional)
[...path].vue             # /a/b/c (catch-all)
[[...path]].vue           # / or /a/b/c (optional catch-all)
```

## Common Mistakes

| Wrong | Right |
|---|---|
| `[id].vue` | `[userId].vue` or `[postId].vue` |
| `navigateTo('/users/' + id)` | `navigateTo({ name: '/users/[userId]', params: { userId: id } })` |
| `<Nuxt />` | `<NuxtPage />` |
| Separate `app/layouts/` for everything | Parent routes with `<NuxtPage />` for nested layouts |
