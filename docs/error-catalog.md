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

---

### Akzentfarbe verfehlte die Kontrast-Mindestanforderung

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich |
| Gefunden | 2026-08-26 |
| Schwere | Mittel |

**FALSCH:**
```css
--color-swiss-500: #c8102e;   /* auf Grafit #131418 nur 3,13:1 */

.cta--primary {
  background: var(--color-swiss-500);
  color: #fff;               /* weiß auf diesem Rot: 3,04:1 */
}
```

**RICHTIG:**
```css
--color-accent-500: #21a4a3;  /* auf Grafit 6,05:1 */
--color-accent-300: #58c5bb;  /* 8,87:1 — für Text und Kleinteiliges */

.cta--primary {
  background: var(--color-accent-500);
  color: var(--color-graphite-950);  /* dunkel auf Teal: 6,30:1 */
}
```

**WARUM:** Die Akzentfarbe wurde nach Gefühl gewählt und nie nachgemessen. WCAG AA verlangt
4,5:1 für Fließtext; das Rot erreichte auf der dunklen Grundfläche nur 3,13:1 und wurde
trotzdem für Meta-Zeilen, Kategorie-Labels und Zeitangaben verwendet — also durchgehend für
kleine Schrift. Der zweite Fehler war die naheliegende weiße Beschriftung auf der Akzentfläche
(3,04:1); auf einer mittelhellen Farbe gehört dunkle Schrift, nicht helle.

Der Wechsel auf Eddys trusted-blogs-Teal war als reine Geschmacksfrage angefragt und hat
nebenbei ein echtes Lesbarkeitsproblem behoben — aufgefallen ist es erst, weil vor dem
Einsetzen der neuen Farbe gerechnet statt geschätzt wurde.

**→ AUDIT-PERSPEKTIVE:** „Ist der Kontrast jeder Farbkombination nachgerechnet — besonders für
kleine Schrift und für Text auf farbigen Flächen?"

---

### Scroll-Animation startet bei `opacity: 0` und macht die Druckansicht leer

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-26 |
| Schwere | Mittel |

**FALSCH:**
```css
@utility reveal {
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      animation: reveal linear both;   /* startet bei opacity: 0 */
      animation-timeline: view();
    }
  }
}
```

**RICHTIG:**
```css
@utility reveal {
  @supports (animation-timeline: view()) {
    @media screen and (prefers-reduced-motion: no-preference) { /* screen! */
      animation: reveal linear both;
      animation-timeline: view();
    }
  }
}

@media print {
  * { animation: none !important; opacity: 1 !important; }
}
```

**WARUM:** Scroll-gebundene Einblendungen setzen Inhalte vor dem Eintreten auf `opacity: 0`.
Beim Drucken wird nicht gescrollt — ohne `screen` in der Media Query und ohne
`@media print`-Reset kommen leere Seiten aus dem Drucker. Ausgerechnet der Lebenslauf ist die
Seite, die jemand ausdrucken will, das ist also kein theoretischer Fall.

Nebenbefund für die eigene Prüfung: Vollseiten-Screenshots zeigen aus demselben Grund alles
unterhalb des Falzes unsichtbar. Das Prüfskript muss erst durch die Seite scrollen und
danach verifizieren, dass keine `.reveal`-Sektion unter `opacity: 0.99` bleibt — sonst hält
man einen echten Fehler für ein Artefakt oder umgekehrt.

**→ AUDIT-PERSPEKTIVE:** „Was passiert mit diesem Effekt, wenn nicht gescrollt werden kann?"

---

### `transform-origin: center` dreht SVG um den falschen Punkt

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich |
| Gefunden | 2026-08-26 |
| Schwere | Mittel |

**FALSCH:**
```css
/* viewBox="-110 -110 220 220" — Mittelpunkt liegt bei den Nutzerkoordinaten 0 0 */
.hand--second {
  transform-box: view-box;
  transform-origin: center;      /* löst auf zu: 110px 110px */
  animation: clock-sweep 60s linear infinite;
}
```

**RICHTIG:**
```css
.hand--second {
  transform-box: view-box;
  transform-origin: 0 0;         /* der tatsächliche Mittelpunkt dieser viewBox */
  animation: clock-sweep 60s linear infinite;
}
```

**WARUM:** `center` entspricht `50% 50%`. Die Prozentwerte werden gegen die **Größe**
der viewBox gerechnet (220 → 110px), das Ergebnis aber im **Nutzerkoordinatensystem**
angewendet. Bei einer auf `0 0` zentrierten viewBox ist (110, 110) nicht die Mitte,
sondern der Rand unten rechts — der Sekundenzeiger drehte um einen Punkt am
Zifferblattrand und flog aus dem Bild.

Der Fehler ist besonders tückisch, weil er im Ruhezustand unsichtbar ist: Das erste
Bild sieht korrekt aus, die Abweichung zeigt sich erst im Lauf der Animation. Er fiel
auch bei mehreren Screenshots nicht auf und wurde erst durch eine Messung sichtbar:
Bounding-Box-Mittelpunkt des Zeigers über die Zeit protokollieren und gegen den
gemessenen Zifferblattmittelpunkt halten. Wandert er, stimmt der Drehpunkt nicht.

**→ AUDIT-PERSPEKTIVE:** „Ist bei einer Rotation der Drehpunkt gemessen — oder nur
das Standbild betrachtet worden?"
