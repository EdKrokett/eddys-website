# Fehlerklassen-Gedächtnis

Konkrete Fehler aus dem Projekt als Vorher/Nachher-Beispiele.
Das stärkste Signal für KI-Code-Generierung: „Dieser Code ist falsch, dieser ist richtig."

**Pflicht:** Bei jedem Bugfix einen Eintrag anlegen. Wächst mit jeder Entdeckung.

---

## Template

```
### [Kurzbeschreibung]

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich / Schwacher Test / Unvollständig / Fix-Regression |
| Gefunden | YYYY-MM-DD |
| Schwere | Kritisch / Hoch / Mittel |

**FALSCH:**
\`\`\`typescript
// konkreter fehlerhafter Code
\`\`\`

**RICHTIG:**
\`\`\`typescript
// konkreter korrigierter Code
\`\`\`

**WARUM:** Was passiert mit dem falschen Code bei welcher Eingabe.

**→ AUDIT-PERSPEKTIVE:** Welche Frage hätte diesen Fehler VOR dem Codeschreiben aufgedeckt?
(Eintrag in `docs/audit-perspectives.md` anlegen!)
```

---

## Einträge

### `immediate: true`-Watcher liest `useFetch`-Daten, bevor der Fetch aufgelöst ist

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich |
| Gefunden | 2026-08-26 |
| Schwere | Mittel |

**FALSCH:**
```typescript
const hasMore = ref(paginated)

watch(data, (posts) => {
  if (paginated && posts.length < limit) hasMore.value = false
}, { immediate: true })
```

**RICHTIG:**
```typescript
const reachedEnd = ref(false)

const hasMore = computed(() =>
  paginated && !reachedEnd.value && data.value.length >= limit,
)
```

**WARUM:** `useFetch` gibt seine Refs sofort zurück, der Setup-Code läuft synchron weiter —
`data.value` ist zu diesem Zeitpunkt noch der Default (`[]`). Serverseitig feuerte der
`immediate`-Watcher also gegen ein leeres Array und setzte `hasMore` auf `false`; der Client
las die Daten direkt aus dem Payload und kam auf `true`. Ergebnis: Server rendert die Liste
ohne „Mehr laden"-Button, der Client erwartet ihn → `Hydration completed but contains
mismatches`, und der Button fehlte im SSR-HTML. Als abgeleiteter Wert (`computed`) kann diese
Divergenz baulich nicht entstehen, weil er erst zum Renderzeitpunkt ausgewertet wird.

**→ AUDIT-PERSPEKTIVE:** „Liest dieser Code `useFetch`-Daten zu einem Zeitpunkt, zu dem sie
noch der Default sein können?"

---

### Whitelist-Middleware für 301-Redirects wird bei jeder neuen Seite falsch

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-26 |
| Schwere | Hoch |

**FALSCH:**
```typescript
// server/middleware/legacy-wp-redirect.ts
const KNOWN_PATH_PREFIXES = ['/api', '/blog', '/impressum', '/kooperationen', ...]

const isKnownPath = KNOWN_EXACT_PATHS.has(path)
  || KNOWN_PATH_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
if (isKnownPath) return
return sendRedirect(event, `https://blog.eduard-andrae.de${event.path}`, 301)
```

**RICHTIG:**
```vue
<!-- app/pages/[...slug].vue — greift nur, wenn der Router nichts gefunden hat -->
<script setup lang="ts">
const route = useRoute()
await navigateTo(`https://blog.eduard-andrae.de${route.fullPath}`, {
  external: true,
  redirectCode: 301,
})
</script>
```

**WARUM:** Die handgepflegte Liste war schon beim Anlegen der ersten neuen Seiten veraltet —
`/ueber-mich`, `/kontakt` und `/datenschutz` fehlten darin und wurden auf WordPress
weitergeleitet (verifiziert: HTTP 301 statt 200). Die Liste ist eine Kopie des Routings,
die zwangsläufig auseinanderläuft. Eine Catch-all-Route hat dieselbe Information aus erster
Hand: Sie wird nur erreicht, wenn keine echte Route gematcht hat, und muss bei neuen Seiten
nie nachgezogen werden. (Fall 4 der Prinzipien in CLAUDE.md: Design ändern statt Regel
nachtragen.)

**→ AUDIT-PERSPEKTIVE:** „Dupliziert diese Liste Wissen, das das Framework schon hat?"

---

### WordPress-Bestandsinhalte enthalten absolute URLs der alten Domain

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-26 |
| Schwere | Hoch |

**FALSCH:**
```typescript
content: post.content.rendered,
featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
```

**RICHTIG:**
```typescript
content: rewriteLegacyWpUrls(post.content.rendered),
featuredImage: normalizeImageUrl(post._embedded?.['wp:featuredmedia']?.[0]?.source_url),
```

**WARUM:** Das Umstellen von `WP_HOME`/`WP_SITEURL`/`WP_CONTENT_URL` (Phase B der
Domain-Migration) wirkt nur auf neu gerendertes Markup. In der Datenbank stehen die
Block-Inhalte mit absoluten URLs — Messung: **41 von 50** zuletzt veröffentlichten Beiträgen
enthalten noch `www.eduard-andrae.de`. Solange die alte Domain auf den Blog weiterleitet,
fällt das nicht auf. Nach Phase C zeigt sie auf Vercel — dann wären alle Bilder in den
Beiträgen tot, und `image.domains` in `nuxt.config.ts` (nur `blog.eduard-andrae.de`) hätte
NuxtImg ohnehin blockiert. Der eigentliche Fix gehört in die WP-Datenbank, siehe KD-003.

**→ AUDIT-PERSPEKTIVE:** „Welche Daten wurden VOR der Umstellung erzeugt und tragen den alten
Zustand noch in sich?"

---

### Scoped-Style überschreibt Tailwind-Utility gleicher Spezifität

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich |
| Gefunden | 2026-08-26 |
| Schwere | Niedrig |

**FALSCH:**
```vue
<button class="burger lg:hidden">…</button>

<style scoped>
.burger { display: grid; }
</style>
```

**RICHTIG:**
```vue
<button class="burger">…</button>

<style scoped>
.burger { display: grid; }
@media (min-width: 1024px) { .burger { display: none; } }
</style>
```

**WARUM:** `.burger` und `.lg\:hidden` haben dieselbe Spezifität (eine Klasse). Scoped Styles
werden nach den Tailwind-Utilities eingebunden, also gewinnt `display: grid` — das
Mobile-Menü-Icon war auf dem Desktop dauerhaft sichtbar, neben der bereits eingeblendeten
Desktop-Navigation. Sobald eine Scoped-Regel dieselbe Property setzt wie eine Utility-Klasse,
darf man die Utility nicht mehr zum Umschalten benutzen.

**→ AUDIT-PERSPEKTIVE:** „Setzt eine Scoped-Regel dieselbe CSS-Property wie eine
Tailwind-Utility am selben Element?"

---

### Fremdes HTML ohne das CSS gerendert, das es voraussetzt

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-26 |
| Schwere | Mittel |

**FALSCH:** `.wp-content` definierte Regeln für `p`, `h2`, `a`, `img`, `ul` — aber keine für
die Layout-Klassen der Gutenberg-Blöcke (`wp-block-gallery`, `is-layout-flex`,
`has-nested-images`).

**RICHTIG:**
```css
.wp-content .wp-block-gallery.has-nested-images {
  display: flex; flex-wrap: wrap; gap: 0.75rem;
}
.wp-content .wp-block-gallery.has-nested-images > figure { flex: 1 1 12rem; min-width: 0; }
.wp-content .wp-block-gallery.has-nested-images > figure > img { width: 100%; max-width: none; }
```

**WARUM:** WordPress liefert nur die Klassennamen aus, das zugehörige Block-CSS kommt im
Theme — das hier niemand lädt. Eine dreiteilige Galerie kollabierte dadurch auf die
Thumbnail-Breite aus dem `width`-Attribut (real: 69px), während der Beitragstext auf „Bild
links / Mitte / rechts" verwies. Verifiziert nach dem Fix: 3 Bilder à 227px nebeneinander.

**→ AUDIT-PERSPEKTIVE:** „Welche CSS-Klassen liefert die Fremdquelle mit, für die wir keine
Regeln haben?"
