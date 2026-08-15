# Nuxt Server Patterns

> **Versions:** Nuxt uses h3 v1 and nitropack v2.
> **Path:** All server code lives at `server/`, NOT `app/server/`.
> **Note:** There is no separate backend — `server/` is Nitro's own server, and it's where WordPress-REST-API calls happen (via `backendFetch`, see `server/utils/backend-fetch.ts`).

## When to Use

Working with `server/` — API routes, server middleware, server utilities.

## Server Directory Structure

```
server/
├── api/                    # API endpoints (prefixed /api/)
│   ├── users.get.ts        # GET /api/users
│   ├── users.post.ts       # POST /api/users
│   └── users/
│       └── [userId].get.ts # GET /api/users/:userId
├── routes/                 # Non-API routes (no /api/ prefix)
│   └── healthz.get.ts      # GET /healthz
├── middleware/             # Server middleware (runs on every request)
│   └── log.ts
└── utils/                  # Server utilities (auto-imported)
    └── db.ts
```

## API Routes

File naming determines HTTP method and route:

- `users.get.ts` → GET /api/users
- `users.post.ts` → POST /api/users
- `users/[userId].get.ts` → GET /api/users/:userId
- `users/[userId].delete.ts` → DELETE /api/users/:userId

**REQUIRED: Use descriptive param names:** `[userId].get.ts` NOT `[id].get.ts`

### Basic API Route

```ts
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const users = await fetchUsers()
  return users
})
```

### Route with Params

```ts
// server/api/users/[userId].get.ts
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')

  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const user = await fetchUserById(userId)

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return user
})
```

### Route with Query Params

```ts
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10

  return await fetchUsers({ page, limit })
})
```

### Route with Body

```ts
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || !body.email) {
    throw createError({ statusCode: 400, message: 'Missing required fields: name, email' })
  }

  const user = await createUser(body)
  setResponseStatus(event, 201)
  return user
})
```

### Validated Body (Valibot)

Use `readValidatedBody` and `getValidatedQuery` for schema validation on the server:

```ts
// server/api/users.post.ts
import * as v from 'valibot'

const UserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email())
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, v.parser(UserSchema))
  const user = await createUser(body)
  setResponseStatus(event, 201)
  return user
})
```

> **Note:** Server-side validation uses Valibot (lightweight, h3-native). Client-side form validation uses Zod with UForm (see `ux-patterns.md`). Both are Standard Schema compatible.

## Error Handling

```ts
throw createError({
  statusCode: 400,
  statusMessage: 'Bad Request',
  message: 'Invalid input',
  data: { field: 'email' }  // Optional additional data
})
```

## Server Middleware

Runs on every server request (before route handlers):

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`${event.method} ${event.path}`)
})
```

Auth middleware:

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const token = getRequestHeader(event, 'authorization')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  event.context.user = await verifyToken(token)
})
```

## Server Utils

Reusable server functions in `server/utils/` (auto-imported in all server routes and middleware):

```ts
// server/utils/db.ts
export async function fetchUsers(options: { page: number, limit: number }) {
  // ...
}

export async function fetchUserById(id: string) {
  // ...
}
```

**Import server types from client (Nuxt 4.3+):**

```ts
// In app/ code — types only, no runtime server code in client bundle
import type { User } from '#server/utils/db'
```

## Cached Functions

```ts
// server/utils/github.ts
export const fetchRepo = defineCachedFunction(
  async (owner: string, repo: string) => {
    return await $fetch(`https://api.github.com/repos/${owner}/${repo}`)
  },
  {
    maxAge: 60 * 5,
    swr: true,
    name: 'github-repo',
    getKey: (owner, repo) => `${owner}/${repo}`,
  }
)
```

## Cached Event Handlers

ISR-style caching on API routes:

```ts
// server/api/products/[productId].get.ts
export default defineCachedEventHandler(
  async (event) => {
    const productId = getRouterParam(event, 'productId')
    return await fetchProductById(productId)
  },
  {
    maxAge: 3600,
    swr: true,
    getKey: event => getRouterParam(event, 'productId') ?? '',
  }
)
```

## Background Tasks

Use `event.waitUntil()` for async tasks that should not block the response (Nuxt 4+):

```ts
// server/api/analytics.post.ts
export default defineEventHandler(async (event) => {
  const data = await readBody(event)

  event.waitUntil(logAnalytics(data))

  return { success: true }
})
```

## Request Helpers

```ts
const userId = getRouterParam(event, 'userId')
const query = getQuery(event)
const body = await readBody(event)
const auth = getRequestHeader(event, 'authorization')
const token = getCookie(event, 'token')
const method = getMethod(event)
const ip = getRequestIP(event)
```

## Response Helpers

```ts
setResponseStatus(event, 201)
setResponseHeader(event, 'X-Custom', 'value')
setCookie(event, 'token', 'value', {
  httpOnly: true, secure: true, sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
})
return sendRedirect(event, '/login', 302)
return sendNoContent(event)
```

## WebSocket

```ts
// server/routes/_ws.ts
export default defineWebSocketHandler({
  open(peer) { console.log('Connected:', peer.id) },
  message(peer, message) { peer.send(`Echo: ${message.text()}`) },
  close(peer) { console.log('Disconnected:', peer.id) }
})
```

Enable in config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: { experimental: { websocket: true } }
})
```

## Common Mistakes

| Wrong | Right |
|---|---|
| `event.context.params.id` | `getRouterParam(event, 'userId')` |
| `return res.json(data)` | `return data` |
| `[id].get.ts` | `[userId].get.ts` |
| `app/server/` | `server/` |
| Throw generic errors | Use `createError` with status code |
| Logic in route handlers | Delegate to `server/utils/` |

## TS2589 & Fetch-Regeln (BINDEND, siehe docs/known-debt.md KD-004)

Die TS2589-Klippe (Routentypen-Matching sprengt ab ~270 Routen TypeScripts
Instanziierungslimit) ist seit 2026-08-08 entschärft: `nitro.hooks['types:extend']` in
`nuxt.config.ts` hält die generierte `InternalApi`-Tabelle leer. Daraus folgen drei Regeln:

1. **Routen-Platzierung ist frei.** Nach jeder neuen Route: `npm run typecheck` (Pflicht,
   mechanisch erzwungen durch Pre-Push-Hook und CI).
2. **Backend-/Extern-Aufrufe im Server über `backendFetch`** (`server/utils/backend-fetch.ts`,
   Nitro-Auto-Import) — nie `$fetch` mit `${apiBase}`- oder sonst dynamischen URLs. `$fetch`
   nur für interne `/api/…`-Aufrufe mit literaler URL. Response-Typen explizit annotieren
   (`backendFetch<MeinTyp>(…)` / `$fetch<MeinTyp>(…)`) — automatische Inferenz aus der
   Routentabelle gibt es nicht mehr.
3. **Den `types:extend`-Hook nicht anfassen.** Entfernen nur über das Ausstiegskriterium in
   KD-004 (neue Upstream-Typisierung + Nachweis mit den dokumentierten roten Platzierungen).
   In `server/utils/**` niemals Globals (`globalThis.$fetch` u. ä.) in Top-Level-Initialisierern
   lesen — nur zur Aufrufzeit (Fehlerklasse: `docs/error-catalog.md`, 2026-08-08).
