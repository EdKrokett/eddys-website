---
name: nuxt4-architect
description: >
  Nuxt 4 frontend architecture enforcement for this single-app repo.
  Activate for ALL tasks involving Vue components, pages, layouts, composables,
  middleware, plugins, styling, data fetching, forms, server routes, or API integration.
---

# Nuxt 4 Architect

You are the lead frontend architect for this Nuxt 4 personal-website repo. All Vue source code belongs under `app/`. There is no separate backend — WordPress (via its public REST API) is the content source, consumed through Nitro server routes at `server/`.

Installed versions: Nuxt 4.3.0, @nuxt/ui 4.4.0, Tailwind CSS 4.1.18, TypeScript 5.9.3, npm.

## Three Cardinal Rules

1. All Vue source goes into `app/`
   Pages, components, composables, layouts, middleware, plugins, utils, assets → `app/<dir>/`.
   `server/` stays at the project root. `shared/` at the project root.
   NEVER create pages/, components/ etc. at the project root.

2. `useFetch`/`useAsyncData` return `shallowRef` by default
   Deep mutation (`data.value.nested.prop = x`) is a SILENT NO-OP.
   Replace entire `.value` or pass `{ deep: true }`.

3. Tailwind v4 = CSS-only config
   NO `tailwind.config.js/ts`. `@nuxt/ui` auto-registers the `@tailwindcss/vite` plugin.
   Theme via `@theme {}` in `app/assets/css/main.css`.
   Use `@import "tailwindcss"` and `@import "@nuxt/ui"`.

## Vue/Nuxt Frontend Conventions

1. **Components = Presentation** — Templates + user interaction only. Calculations, filtering, sorting → composables.
2. **Composables for data & logic** — Centralize `useFetch`/`$fetch` in `app/composables/`. No scattered fetches.
3. **`status` over boolean flags** — Use `status: 'idle' | 'pending' | 'success' | 'error'` from useFetch, not `isLoading`/`hasError`.
4. **`useState` for shared state** — SSR-safe cross-component state. No Pinia.
5. **Pages = thin orchestrators** — Compose components + composables. Types in `shared/types/`.

## Workflow

On every frontend task:

1. **Read** the relevant reference before coding:
   - Structure/paths → `references/structure.md`
   - Data fetching/reactivity → `references/data-fetching.md`
   - Styling/Tailwind → `references/styling.md`
   - Forms/errors/loading/toasts → `references/ux-patterns.md`
   - Server routes/API endpoints → `references/server.md`
   - File-based routing/navigation → `references/routing.md`
   - Route middleware/plugins → `references/middleware-plugins.md`
   - NuxtLink/NuxtImg/NuxtTime → `references/nuxt-components.md`
   - nuxt.config.ts/modules/route rules → `references/nuxt-config.md`

2. **Verify context:** Run `ls app/` to confirm the directory exists.

3. **STOP — Qualitäts-Check Q1-Q6 schriftlich beantworten** (siehe unten). Antworten AUSSCHREIBEN bevor Code entsteht. Bei Unsicherheit: User fragen statt raten.

4. **Tests schreiben** (bei Composables/Utils — PFLICHT) aus den Qualitäts-Check-Antworten. Edge Cases aus Frage 1 → Testcases, Pre/Postconditions aus Frage 6 → Assertions. Tests an konkreten Invarianten ausrichten, nicht generisch.

5. **Implementieren** — Code schreiben bis alle Tests grün sind.

6. **Validate:** Run `python .claude/skills/nuxt4-architect/scripts/verify.py` after creating/moving files. Fix before responding.

**DO NOT load all reference files at once.** Load only what is relevant to the current task.

## Path Map

| Type | Correct | WRONG |
|---|---|---|
| Pages | `app/pages/` | `pages/` (project root) |
| Components | `app/components/` | `components/` (project root) |
| Composables | `app/composables/` | `composables/` (project root) |
| Layouts | `app/layouts/` | `layouts/` (project root) |
| Middleware | `app/middleware/` | `middleware/` (project root) |
| Plugins | `app/plugins/` | `plugins/` (project root) |
| Utils | `app/utils/` | `utils/` (project root) |
| Assets | `app/assets/` | `assets/` (project root) |
| Server API | `server/api/` | `app/server/` |
| Server Routes | `server/routes/` | `app/server/` |
| Server Utils | `server/utils/` | `app/server/` |
| Server Middleware | `server/middleware/` | `app/server/` |
| Shared Types | `shared/types/` | `app/shared/` |

## Import Aliases

- `~` / `@` → `app/` | `~~` / `@@` → project root
- `#imports` (auto), `#server` (`server/`), `#shared` (`shared/`), `#components` (auto), `#ui` (`@nuxt/ui`)
- Correct: `import X from '~/components/Foo.vue'`
- WRONG: `import X from '~/app/components/Foo.vue'` (double-pathing)

## Nuxt UI v4 Quick Reference

Component renames from v2 (DO NOT use old names):
- `UFormGroup` → `UFormField`
- `UToggle` → `USwitch`
- `UDivider` → `USeparator`
- `UDropdown` → `UDropdownMenu`
- `URange` → `USlider`
- `UNotification` → `UToast`

Color system uses 7 aliases ONLY: `primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`.
Direct Tailwind color names (e.g., `color="red"`) are NOT supported on Nuxt UI components.

App must be wrapped in `<UApp>` for toast, tooltip, and programmatic overlays to work.

## Nuxt Built-in Components

ALWAYS prefer Nuxt components over raw HTML elements:

| HTML Element | Nuxt Component | Why |
|---|---|---|
| `<a>` | `<NuxtLink>` | Client-side navigation, prefetching |
| `<img>` | `<NuxtImg>` | Optimization, lazy loading, responsive |
| `<time>` | `<NuxtTime>` | SSR-safe formatting, localization |

Details in `references/nuxt-components.md`.

## Data Fetching Cheat Sheet

```typescript
// SSR → useFetch (status: idle | pending | success | error)
const { data, status, error, refresh } = await useFetch<MyType>('/api/endpoint')

// User action (click/submit) → $fetch
async function onSubmit() {
  const result = await $fetch('/api/endpoint', { method: 'POST', body })
}

// Deep reactivity: useFetch('/api/...', { deep: true })
// Mutate shallowRef: data.value = { ...data.value, updatedField: 'new' }
```

## Self-Check Before Responding (Architektur)

- Files inside `app/` (Vue) and `server/` (API)?
- Loading state for async data? (`status === 'pending'`)
- Error handling present? (`v-if="status === 'error'"` or try/catch)
- No `tailwind.config.js` created?
- `$fetch` for user actions, `useFetch` for SSR loads?
- TypeScript types (no `any`)?
- Using UFormField (not UFormGroup)?
- Colors use aliases (primary/success/error), not Tailwind names (red/green)?
- Using NuxtLink/NuxtImg/NuxtTime instead of raw HTML elements?
- Business logic in composables, not in `.vue` files?
- Typed routes (`navigateTo({ name: '...' })`) not string paths?
- Descriptive route params (`[slug]` not `[id]`)?

## Qualitäts-Check (VOR dem Codeschreiben beantworten)

1. **Kommt ein Wert von EXTERN (User-Input, URL-Parameter, API-Response)?**
   Was passiert bei:
   - `undefined`/`null`? → `v-if` oder Default-Wert VOR Rendering.
   - Leerer String `""`? → Zeigt die UI dann „undefined" oder ein leeres Element?
   - HTML/Script im String? → Wird es escaped? (`v-text` statt `v-html` als Default; WordPress-Content ist HTML — bewusst über `v-html`, aber nur für Content aus der eigenen, vertrauten WP-Instanz)
   - Extrem langer String? → Bricht das Layout oder gibt es `truncate`/`line-clamp`?

2. **Was sieht der User wenn der Request fehlschlägt?**
   Kein `useFetch` ohne `status === 'error'`-Handling.
   Kein `$fetch` ohne try/catch mit User-sichtbarer Fehlermeldung.
   Konkretes Anti-Pattern: Stille Fehler die den User im Loading-State hängen lassen.

3. **Was passiert bei leerem Ergebnis?**
   API gibt `[]` oder `null` zurück → Zeigt die UI einen Empty-State?
   `data.value?.items` ist leer → Keine unsichtbare leere Liste, sondern expliziter Hinweis.

4. **Ist die reaktive Kette vollständig?**
   `useFetch` gibt `shallowRef` zurück — tiefe Mutation ist ein STILLER NO-OP.
   Wird `.value` komplett ersetzt oder nur ein Nested-Feld mutiert (= Bug)?

5. **Test: Würde der Test einen Bug finden?**
   Jede Composable/Utility braucht `*.spec.ts` mit:
   - Happy Path mit konkretem Wert-Assert (nicht nur Truthiness)
   - Edge Case: `undefined`, `null`, `""`, `0`, leeres Array
   - Fehlerfall: Was gibt die Funktion zurück wenn die Eingabe ungültig ist?

6. **Pre/Postconditions aufschreiben** (bei Composables mit Logik):
   ```
   PRE:  [Was muss die Eingabe erfüllen?]
   POST: [Was muss das Ergebnis erfüllen?]
   INV:  [Was darf sich NICHT ändern?]
   ```
   Jede Postcondition → Test-Assertion. Jede verletzte Precondition → definiertes Verhalten (kein stiller Fehler).
