# Nuxt Built-in Components

> Preference table (NuxtLink, NuxtImg, NuxtTime over HTML) → see SKILL.md.

## NuxtLink

**ALWAYS use `<NuxtLink>` instead of `<a>` for internal links:**

```vue
<template>
  <!-- Internal navigation (type-safe) -->
  <NuxtLink :to="{ name: '/users/[userId]', params: { userId } }">Profile</NuxtLink>

  <!-- Simple internal link -->
  <NuxtLink to="/about">About</NuxtLink>

  <!-- External link -->
  <NuxtLink to="https://nuxt.com" external>Nuxt Docs</NuxtLink>

  <!-- Prefetch control -->
  <NuxtLink to="/dashboard" :prefetch="false">Dashboard</NuxtLink>

  <!-- Active state styling -->
  <NuxtLink to="/settings" active-class="text-primary" exact-active-class="font-bold">
    Settings
  </NuxtLink>
</template>
```

**Props:**

- `to` — Route path or route object (prefer typed route objects)
- `external` — Force external link behavior
- `target` — Link target (`_blank`, etc.)
- `prefetch` — Enable/disable prefetching (default: true)
- `activeClass` — Class when route matches
- `exactActiveClass` — Class when route exactly matches

## NuxtImg

**ALWAYS use `<NuxtImg>` instead of `<img>` for images.**

Requires `@nuxt/image` module.

```vue
<template>
  <!-- Basic usage -->
  <NuxtImg src="/images/hero.jpg" alt="Hero image" />

  <!-- Responsive with sizes -->
  <NuxtImg
    src="/images/banner.jpg"
    alt="Banner"
    width="1200"
    height="600"
    sizes="100vw sm:50vw md:400px"
  />

  <!-- Eager loading for above-fold -->
  <NuxtImg src="/images/logo.svg" loading="eager" alt="Logo" />

  <!-- With placeholder blur -->
  <NuxtImg src="/images/product.jpg" placeholder alt="Product" />

  <!-- Format conversion -->
  <NuxtImg src="/images/photo.png" format="webp" alt="Photo" />
</template>
```

**Props:**

- `src` — Image source path
- `alt` — Alt text (**required** for accessibility)
- `width` / `height` — Dimensions
- `sizes` — Responsive sizes
- `loading` — `lazy` (default) or `eager`
- `placeholder` — Show blur placeholder while loading
- `format` — Force output format (`webp`, `avif`, etc.)
- `quality` — Image quality (1-100)

**Use `loading="eager"` for above-the-fold images. Use sizes prop for responsive images.**

For art direction (different sources per breakpoint), use `<NuxtPicture>`.

## NuxtTime

**ALWAYS use `<NuxtTime>` instead of `<time>` or manual date formatting:**

```vue
<template>
  <!-- Relative time -->
  <NuxtTime :datetime="post.createdAt" relative />
  <!-- Output: "2 hours ago" -->

  <!-- Custom format -->
  <NuxtTime :datetime="date" year="numeric" month="long" day="numeric" />
  <!-- Output: "December 6, 2025" -->

  <!-- Short format -->
  <NuxtTime :datetime="date" month="short" day="numeric" />
  <!-- Output: "Dec 6" -->

  <!-- With time -->
  <NuxtTime :datetime="date" hour="numeric" minute="2-digit" />

  <!-- With locale -->
  <NuxtTime :datetime="date" locale="de-DE" />
</template>
```

**Props:**

- `datetime` — Date string, Date object, or timestamp
- `relative` — Show relative time ("2 hours ago")
- `locale` — Locale for formatting
- `year`, `month`, `day`, `hour`, `minute`, `second` — Intl.DateTimeFormat options

## Common Mistakes

| Wrong | Right |
|---|---|
| `<a href="/about">` | `<NuxtLink to="/about">` |
| `<img src="/photo.jpg">` | `<NuxtImg src="/photo.jpg" alt="...">` |
| `{{ formatDate(date) }}` | `<NuxtTime :datetime="date" />` |
| `formatTimeAgo(date)` | `<NuxtTime :datetime="date" relative />` |
| `new Date().toLocaleDateString()` | `<NuxtTime :datetime="date" />` |
| Missing `alt` on images | Always provide `alt` text |
