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

---

### In-Memory-Cache als einzige Schicht vor einem langsamen Fremd-Origin (Serverless)

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-27 |
| Schwere | Hoch |

**FALSCH:**
```ts
// wpCache.ts: Modul-globale Map + Best-Effort-storage, sonst nichts davor.
// nuxt.config.ts hat keine routeRules → Vercel liefert
// `cache-control: public, max-age=0, must-revalidate`, x-vercel-cache: MISS.
const memoryCache = new Map<string, CacheEntry<unknown>>()
```

**RICHTIG:**
```ts
// nuxt.config.ts — CDN-Schicht VOR die Function legen:
routeRules: {
  '/api/blog': {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
    },
  },
},
```

**WARUM:** Der Modul-globale Cache lebt nur so lange wie die Function-Instanz. Auf
Vercel Serverless heißt das: nach jedem Cold Start und in jeder neu hochgefahrenen
Parallel-Instanz ist er leer. Gemessen an `/api/blog?limit=24`: **1,6–3,0 s kalt gegen
0,17 s warm.** Genau diese Spanne fiel als „manchmal fünf Sekunden" auf — der Cache
funktionierte, er war nur zu oft leer.

Verschärfend kam dazu, dass die Function in **iad1 (US-Ost)** lief, während WordPress
bei IONOS in Deutschland steht (`x-vercel-id: fra1::iad1::…`) — jeder Cache-Miss ging
zweimal über den Atlantik.

Der Fehler war messtechnisch tückisch: Ein naiver Cache-Buster (`?_cb=…`) trifft **nicht**
den kalten Pfad, weil der Cache-Key in `withWpCache` nur aus `limit` und `page` gebaut
wird — der Zusatzparameter wird ignoriert und die Messung liefert fälschlich Warm-Werte.
Erst je ein bis dahin unbenutzter `limit`-Wert (23, 22, 21 …) erzeugt echte Cache-Misses.

Die naheliegende Referenz führte ebenfalls in die Irre: Auf trusted-blogs ist dieselbe
Cache-Implementierung schnell — aber nur, weil dort ein langlebiger Node-Prozess im
Container läuft (`frontend/Dockerfile`), dessen Modul-Cache tagelang warm bleibt.
Das Muster ist nicht portierbar; auf Serverless braucht es eine Schicht, die die
Instanz überlebt.

**→ AUDIT-PERSPEKTIVE:** „Überlebt diese Cache-Schicht den Prozess, der sie hält — und
ist der kalte Pfad wirklich kalt gemessen worden?"

---

### `image.screens` als stiller Aufrunder: Kachel lädt 2,7-fach zu groß

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich |
| Gefunden | 2026-08-27 |
| Schwere | Mittel |

**FALSCH:**
```vue
<!-- image.screens war nicht gesetzt, Default beginnt bei 640 -->
<NuxtImg :src="img" width="240" densities="1x 2x" format="webp" quality="55" />
<!-- erzeugt: w=640 1x, w=640 2x  →  dieselbe 26-KB-Datei zweimal im srcset -->
```

**RICHTIG:**
```ts
// nuxt.config.ts — kleine Breiten überhaupt erst erlauben
image: {
  screens: { tile: 240, tileDesktop: 320, tile2x: 480, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
}
```
```vue
<!-- Breite aus der gemessenen Kachelgeometrie, eine Dichte statt zweier Kandidaten -->
<NuxtImg :src="img" :width="tileImageWidth" densities="1x" format="webp" quality="55" />
```

**WARUM:** Auf Vercel ist `image.screens` nicht nur ein Breakpoint-Alias, sondern die
Liste der **erlaubten** Bildbreiten — @nuxt/image schreibt sie als `images.sizes` in
die Build-Config. Der Provider rundet jede angeforderte Breite auf den nächsten
Eintrag **auf**; alles andere quittiert Vercel mit 400
(`INVALID_IMAGE_OPTIMIZE_REQUEST`). Der Default beginnt bei 640, die Kachel war 240px
breit: 1x (240) und 2x (480) landeten beide auf 640, also 26 KB statt 4 KB — und die
zweite Dichte war komplett wirkungslos, weil sie auf dieselbe Datei zeigte.

Tückisch ist, dass nichts fehlschlägt: Die Bilder erscheinen, sehen gut aus, und im
Template steht `width="240"` — die Aufrundung passiert unsichtbar im Provider. Lokal
ist sie auch nicht reproduzierbar, weil dort IPX läuft und jede Breite exakt bedient.
Sichtbar wird sie erst am `srcset` der Live-Seite oder über
`naturalWidth` vs. `getBoundingClientRect().width` im Browser.

**→ AUDIT-PERSPEKTIVE:** „Stimmt die tatsächlich geladene Bildbreite mit der
Anzeigegröße überein — auf der Live-Plattform gemessen, nicht lokal?"

---

### Drift-Schleife mit weniger einzigartigen Bildern als sichtbaren Kacheln

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-27 |
| Schwere | Mittel |

**FALSCH:**
```ts
// 6 Spalten, 4 Bilder je Spalte — die Spalte wird für die Endlosschleife verdoppelt
const MIN_IMAGES_PER_COLUMN = 4
const imgs = wallImages.value.slice(0, columnCount * MIN_IMAGES_PER_COLUMN)
// Template: v-for="img in [...col, ...col]"
```

**RICHTIG:**
```ts
// Bedarf aus der Kachelgeometrie ableiten statt raten
const imagesPerColumn = computed(() => {
  const heroHeight = Math.min(viewportHeight.value * HERO_VH_FACTOR, HERO_MAX_HEIGHT)
  const wallHeight = heroHeight * WALL_VERTICAL_OVERHANG
  const tileHeight = tileCssWidth.value / TILE_ASPECT
  const visibleTiles = wallHeight / (tileHeight + WALL_GAP)
  return Math.max(MIN_IMAGES_PER_COLUMN, Math.ceil(visibleTiles * TILE_REPEAT_HEADROOM))
})
```

**WARUM:** Wird eine Spalte per `[...col, ...col]` für die Endlosschleife verdoppelt,
muss sie mehr einzigartige Bilder enthalten, als gleichzeitig ins Sichtfenster passen —
sonst steht dasselbe Foto zweimal auf einem Screen. Gemessen: 4,24 sichtbare Kacheln
bei 4 einzigartigen (1440px), auf dem Handy sogar 7,1 bei 4.

Zwei feste Werte für „Mobile" und „Desktop" lösen das nicht, weil der Bedarf
gegenläufig zur Kachelgröße ist: Je kleiner die Kachel, desto MEHR Bilder braucht die
Spalte. Ein 360px-Handy braucht 10 pro Spalte, ein 1920px-Desktop nur 4. Die Intuition
„kleiner Screen = weniger Bilder" führt hier in die falsche Richtung.

trusted-blogs hatte denselben Fehler (dort Issue #45) und löste ihn über einen
höheren Festwert (8). Der rechnet auf Tablets unnötig viel Transfer mit — die
abgeleitete Variante trifft jeden Viewport.

**→ AUDIT-PERSPEKTIVE:** „Bei einer verdoppelten Endlosschleife: Passen mehr Elemente
ins Sichtfenster, als es einzigartige gibt?"

---

### Suche und Kategorie filtern nur, was zufällig schon geladen war

| Feld | Inhalt |
|------|--------|
| Klasse | Unvollständig |
| Gefunden | 2026-08-30 |
| Schwere | Hoch |

**FALSCH:**
```ts
// useBlog.ts — `allPosts` sind die 30 Beiträge der ersten Seite
const filteredPosts = computed(() =>
  filterPosts(allPosts.value, searchQuery.value, activeCategory.value),
)
```

**RICHTIG:**
```ts
// Den Suchbegriff an WordPress durchreichen (server/api/blog.get.ts) und das
// Ergebnis NICHT noch einmal clientseitig nach Text filtern.
const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
```

**WARUM:** Die Liste hielt 30 von 242 Beiträgen. Der Filter sah also 12 % des Archivs
und meldete für alles andere „keine Treffer" — eine Suche, die nicht sagt, dass sie
nur einen Ausschnitt kennt, ist schlimmer als keine. Aufgefallen an einem Beitrag von
2010, den WordPress sofort findet.

Dieselbe Klasse traf zwei weitere Stellen, die zuerst übersehen wurden:

- Die **Kategorie-Chips**. „Wandern" zeigte 2 Beiträge, das Archiv enthält 5.
  Deshalb geht auch die Kategorie als `categories=<ID>` an WordPress — beide Filter
  teilen sich EINE Anfrage und einen Zustand (`blogFilterKey`). Getrennt gebaut hätte
  eine der beiden Dimensionen wieder clientseitig nachfiltern müssen.
- Die Liste der **angezeigten** Chips (`availableCategories`) blendete Kategorien aus,
  zu denen die geladenen 30 Beiträge nichts hatten. Ein Chip wäre also verschwunden,
  obwohl das Archiv Beiträge dazu enthält. Jetzt werden alle kuratierten Kategorien
  gezeigt.

Drei Details, an denen die Umstellung sonst scheitert:

1. **Nicht doppelt filtern.** WordPress durchsucht auch den Volltext. Von den vier
   Treffern für „nasenspray" haben drei das Wort weder im Titel noch im Anriss — ein
   zweiter Filter über `title`/`excerpt` warf genau die wieder raus und stellte den
   Bug still wieder her. Deshalb `pickVisiblePosts()` mit eigenem Test.
2. **Auch das Kategorie-Ergebnis nicht nachfiltern.** Der Server hat bereits gefiltert;
   ein zweiter Durchlauf über `post.categories` verwürfe alles, sobald `_embedded`
   einmal fehlt. `pickVisiblePosts()` gibt das Serverergebnis deshalb unverändert
   zurück, sobald sein Filter-Schlüssel zum aktuellen passt.
3. **Nur im Client filtern.** `/blog` liegt per ISR am Edge, alle Query-Varianten
   teilen sich einen Eintrag (siehe performance.md, Schicht 4). Serverseitig gerendert
   bekäme der nächste Besucher das Suchergebnis des vorigen.

Kosten: eine zusätzliche Anfrage je Filterwechsel, beim Tippen 300 ms entprellt, beim
Kategorie-Klick sofort. Kalt 1,58 s, warm 0,004 s — und am CDN gecacht, weil `s-maxage`
auf `/api/blog` die volle URL inklusive `?search=`/`?category=` schlüsselt.

**→ AUDIT-PERSPEKTIVE:** „Kennt der Filter die Grundgesamtheit, über die er urteilt —
oder nur den nachgeladenen Ausschnitt?"

---

### Externer Wert im Cache-Key erzeugt Verzeichnisse

| Feld | Inhalt |
|------|--------|
| Klasse | Still fehlgeschlagen |
| Gefunden | 2026-08-30 |
| Schwere | Mittel |

**FALSCH:**
```ts
withWpCache(`all-posts:${limit}:${page}:${search}`, 'blog-list', …)
// → ENOTDIR: not a directory, open '.data/kv/…/all-posts/30/1/nasenspray'
```


**RICHTIG:**
```ts
// Fester Platz, feste Länge, dateisystemsichere Zeichen
const searchToken = search
  ? createHash('sha256').update(search).digest('hex').slice(0, 16)
  : 'all'
withWpCache(`all-posts:${searchToken}:${limit}:${page}`, 'blog-list', …)
```

**WARUM:** unstorage bildet `:` im Key auf Verzeichnisebenen ab. `all-posts/30/1`
existierte bereits als **Datei** — der neue Eintrag hätte daraus einen Ordner machen
müssen. Der Schreibfehler wird in `wpCache.ts` bewusst nur geloggt, also blieb die
Seite funktionsfähig und die Storage-Schicht fiel lautlos aus. Ein `/` im Suchbegriff
hätte zusätzlich beliebige Unterordner angelegt.

Zwei Regeln daraus: Ein variables Segment gehört an eine **feste Position** im Key
(sonst kollidiert Tiefe mit Tiefe), und ein externer Wert gehört **kodiert oder
gehasht** (sonst bestimmt der Besucher die Pfadstruktur). Der Key trägt inzwischen vier
variable Stellen (`all-posts:<such-hash>:<kategorie-id>:<limit>:<seite>`) — alle mit
einem `all`-Platzhalter, damit die Tiefe konstant bleibt, auch wenn nichts gesetzt ist.
Der Kategorie-Slug geht dabei nie roh in den Key: gespeichert wird die aufgelöste ID
aus einer festen Liste.

Analogie-Suche ergab denselben Fehler in `server/utils/wp-post.ts`: dort ging der Slug
aus der URL roh als Key durch — `/blog/a:b` hätte `blog-post/a/b` angelegt. Dort jetzt
`encodeURIComponent(slug)`.

**→ AUDIT-PERSPEKTIVE:** „Geht ein Wert von außen in einen Cache-Key, Dateinamen oder
Storage-Pfad — und kann er dort die Struktur verändern statt nur zu benennen?"


### Kuratierte Spiegelliste einer Fremdsystem-Taxonomie driftet still

**Symptom:** Ein in WordPress neu angelegter Beitrag erschien auf `/blog` in der Liste,
aber die zugehörige Kategorie „Reisen" bekam keinen Filter-Chip. Kein Fehler, kein Log,
keine leere Trefferliste — der Chip war schlicht nicht da (09.09.2026).

**FALSCH:**
```ts
// Kommentar behauptet Vollständigkeit, die Liste hält sie nicht
// "der Blog hat insgesamt vier Kategorien, keine davon verschachtelt"
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  { slug: 'laufen', label: 'Laufen', id: 1 },
  { slug: 'wandern', label: 'Wandern', id: 153 },
  { slug: 'bloggen', label: 'Bloggen', id: 94 },
] as const
```

**RICHTIG:**
```ts
// `werbung` (ID 223) gehört nicht in die Leiste: gekennzeichnete Kooperationen sind
// keine Rubrik, nach der jemand filtern will. Die Liste ist kuratiert, nicht
// vollständig — wer eine Kategorie ergänzt, ergänzt sie HIER, sonst bleibt sie auf
// `/blog` unsichtbar, auch wenn WordPress sie längst kennt.
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  { slug: 'laufen', label: 'Laufen', id: 1 },
  { slug: 'wandern', label: 'Wandern', id: 153 },
  { slug: 'reisen', label: 'Reisen', id: 224 },
  { slug: 'bloggen', label: 'Bloggen', id: 94 },
] as const
```

**WARUM:** Die feste Liste ist als Performance-Entscheidung richtig und bleibt (siehe
`performance.md`). Der Fehler lag nicht in der Technik, sondern im Kommentar: Er las sich
wie eine Bestandsaufnahme („der Blog hat vier Kategorien") statt wie eine Pflege-Anweisung.
Wer die Datei später öffnete, sah eine Liste, die vollständig zu sein behauptete, und
hatte keinen Anlass, sie zu ergänzen. Die Auslassung von `werbung` war dokumentiert
nirgends — sie sah aus wie ein Versehen und machte damit auch die anderen Einträge
unglaubwürdig.

Das ist die allgemeine Form: **Jede im Code gepflegte Kopie einer Taxonomie aus einem
Fremdsystem driftet**, weil die Änderung im Fremdsystem stattfindet und der Code davon
nichts erfährt. Ein Test kann das nicht auffangen, denn er kennt dieselbe Kopie. Was hilft,
ist ein Kommentar, der die Liste als kuratiert kennzeichnet, jede Auslassung begründet und
die Pflegestelle benennt — plus ein Test, der die bewusste Auslassung festhält, damit sie
sich von einem Tippfehler unterscheidet.

Analogie-Suche: `app/utils/site.ts` verweist auf dieselbe Liste, führt aber keine eigene
Kopie. Keine weitere Spiegelliste einer WordPress-Taxonomie im Repo gefunden.

**→ AUDIT-PERSPEKTIVE:** „Pflegt der Code eine Liste, deren Wahrheit in einem Fremdsystem
liegt — und sagt der Kommentar, dass sie kuratiert ist, warum etwas fehlt und wo man
ergänzt?"

### Provider-Default für Cache-TTL trifft auf eine Quelle ohne `Cache-Control`

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich |
| Gefunden | 2026-09-11 |
| Schwere | Hoch |

**FALSCH:**
```typescript
image: {
  domains: ['blog.eduard-andrae.de'],
  // minimumCacheTTL nicht gesetzt → @nuxt/image nimmt 60 * 5 = 300 Sekunden
  screens: { /* ... */ },
}
```

**RICHTIG:**
```typescript
image: {
  domains: ['blog.eduard-andrae.de'],
  vercel: {
    // 31 Tage; der Default von 300 s ist für eine Quelle ohne Cache-Control ein Leck
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  screens: { /* ... */ },
}
```

**WARUM:** Vercel bestimmt die Cache-Dauer entfernter Bilder als `max(Cache-Control des
Quellservers, minimumCacheTTL)` und rechnet MISS **und STALE** je als Transformation ab.
WordPress schickt auf `/wp-content/uploads/` keinen `Cache-Control`-Header, also blieb der
Provider-Default von 300 Sekunden stehen: Jedes Beitragsbild wurde alle fünf Minuten neu
transformiert. Bei 5.000 Transformationen im Monat (Hobby) war das Kontingent nach zwei
Wochen zu 75 % verbraucht, ohne dass sich an Inhalt oder Traffic etwas geändert hatte.
Der Fehler war unsichtbar, weil nichts kaputtging: Die Bilder wurden ja korrekt
ausgeliefert, nur eben immer wieder neu erzeugt. Sichtbar geworden wäre er erst bei 100 %,
und dann als Alt-Text statt Bild.

Zwei Eigenschaften machen diese Klasse gefährlich: Der Default steht in `node_modules`,
nicht im Projekt, und er ist nur in Kombination mit einer *fremden* Eigenschaft falsch
(dem fehlenden Header der Quelle). Keine der beiden Seiten ist für sich genommen auffällig.

**→ AUDIT-PERSPEKTIVE:** „Verbrauchsmodelle" in `docs/audit-perspectives.md`.

---

## Ein Grid-Item schrumpft nicht unter seinen Inhalt

**Gefunden:** 12.09.2026, beim Bau von `/werkbank`.

**FALSCH:**
```css
.section__body {
  display: grid;
  gap: 2rem;
}

/* Kind: bewusst breiter als die Spalte, mit eigenem Scroll-Container */
.table-scroll { overflow-x: auto; }
.scenarios { min-width: 34rem; }
```

**RICHTIG:**
```css
.section__body {
  display: grid;
  gap: 2rem;
}

/* Ohne diese Zeile wächst das Grid-Item mit seinem Inhalt statt zu scrollen. */
.section__body > * {
  min-width: 0;
}
```

**WARUM:** Grid- und Flex-Items haben `min-width: auto`, nicht `0`. Sie schrumpfen deshalb
nie unter die Mindestbreite ihres Inhalts. Ein Kind mit `overflow-x: auto` und einem
`min-width: 34rem` breiten Inhalt löst dadurch **kein** Scrollen aus: Stattdessen wächst
das Grid-Item selbst auf 34rem, die Spalte wird breiter als der Viewport, und die ganze
Seite bekommt eine waagerechte Bildlaufleiste. Der `overflow-x: auto`-Container greift nie,
weil er nie zu schmal für seinen Inhalt wird.

Die Klasse ist heimtückisch, weil die Lösung (`overflow-x: auto`) an der richtigen Stelle
steht und trotzdem wirkungslos ist. Sichtbar wird der Fehler nur unterhalb der Breite, bei
der der Inhalt noch passt — auf dem Entwicklungsrechner also meistens gar nicht.

**Prüfen statt vermuten:** Ein Screenshot taugt hier nicht als Beweis. Chrome im alten
Headless-Modus und Playwright mit `fullPage: true` erzeugen beide Bilder, die wie ein
Überlauf aussehen, obwohl keiner vorliegt. Verlässlich ist nur die Messung im echten
Viewport:

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

**→ AUDIT-PERSPEKTIVE:** „Schrumpfverhalten" in `docs/audit-perspectives.md`.

---

## Text läuft aus der SVG-viewBox, ohne überzulaufen

**Gefunden:** 12.09.2026, in `app/components/WerkbankChain.vue`.

**FALSCH:**
```js
const branchX = routerX + STEP_X
// Labels beginnen bei branchX + 20 und laufen nach rechts
const viewBoxWidth = branchX + 76
```

**RICHTIG:**
```js
/** Längstes Label ist „Pinterest": 9 Zeichen Mono auf 12px mit Sperrung, rund 70px. */
const LABEL_SPACE = 110
const viewBoxWidth = branchX + LABEL_SPACE
```

**WARUM:** Eine viewBox ist ein Beschnitt, kein Container. Zu knapp bemessen schneidet sie
Inhalt ab, statt ihn überlaufen zu lassen — es gibt keine Bildlaufleiste, keine Warnung im
Build, keinen Lint-Fehler. Auf der Seite stand deshalb „LinkedI", „Faceboo" und „Pintere",
und zwar so selbstverständlich, dass es beim Überfliegen als Absicht durchgeht.

Der eigentliche Fehler war, die Breite eines Textes zu schätzen, statt Platz für den
längsten möglichen Fall einzuplanen. Bei SVG-Text gibt es keine Layout-Rückmeldung: Der
Browser misst nichts nach, was man selbst nicht gerechnet hat.

**→ AUDIT-PERSPEKTIVE:** „Beschnitt statt Überlauf" in `docs/audit-perspectives.md`.

## Ein Cache im SSR-Pfad macht On-Demand-Revalidierung wirkungslos

**Gefunden:** 16.09.2026, beim Bau des WordPress-Kommentar-Webhooks.

**FALSCH:**
```ts
// wpCache.ts
'blog-comments': 900,

// revalidate-comments.post.ts (angedacht)
memoryCache.delete(`wp-cache:data:blog-comments:${postId}`)
await fetch(`${base}/blog/${slug}`, { headers: { 'x-prerender-revalidate': token } })
```

**RICHTIG:**
```ts
// wpCache.ts — kein Eintrag für Kommentare, Begründung im Kommentar daneben.
const CACHE_TTLS: Record<string, number> = {
  'blog-list': 1800,
  'blog-post': 3600,
}
```

**WARUM:** Zwei Fehler in einem, und der zweite ist der teurere.

Erstens ist `memoryCache` modul-global, lebt also pro Function-Instanz. Der Handler löscht
in der Instanz, die den Webhook bearbeitet; den anschließenden Seiten-Render kann eine
andere Instanz übernehmen und ihren eigenen, noch gefüllten Cache benutzen. Ein `delete`
sieht nach Invalidierung aus, ist aber nur eine Wette auf Instanz-Identität. Der
`storage`-Mount taugt nicht als geteilte Schicht, weil das Vercel-Filesystem read-only ist.

Zweitens ist die Folge nicht „ein bisschen veraltet", sondern das Gegenteil des
Gewünschten: Der Revalidate-Render baut die Seite mit den alten Daten neu, und diese
falsche Fassung liegt danach wieder eine volle ISR-Periode als *frisch* am Edge. Der
Webhook hätte den falschen Stand für eine weitere Stunde zementiert, statt ihn zu beheben —
und dabei Erfolg gemeldet.

Die Verlockung war, den Cache „mitzunehmen, schadet ja nicht". Er schadete genau dort, wo
er unsichtbar war: nicht im Normalbetrieb, sondern im Reparaturpfad.

**→ AUDIT-PERSPEKTIVE:** „Was steht zwischen Auslöser und Ergebnis?" in
`docs/audit-perspectives.md`.

## Die Seite revalidiert, die Payload-Datei bleibt alt

**Gefunden:** 16.09.2026, beim Erweitern des Webhooks auf Beiträge — der Fehler steckte
im Kommentar-Webhook, der wenige Stunden vorher als fertig galt.

**FALSCH:**
```ts
const path = `/blog/${encodeURIComponent(post.slug)}`
await fetch(`${base}${path}`, { headers: { 'x-prerender-revalidate': token } })
```

**RICHTIG:**
```ts
// server/utils/revalidate-paths.ts
export function postPaths(slug: string): string[] {
  const encoded = encodeURIComponent(slug)
  return [`/blog/${encoded}`, `/blog/${encoded}/_payload.json`]
}
```

**WARUM:** Eine Nuxt-Seite liegt am Edge in zwei Fassungen. Das HTML bekommt, wer die URL
direkt aufruft; `<pfad>/_payload.json` bekommt, wer innerhalb der Seite dorthin klickt.
Beide sind eigene Cache-Einträge unter derselben `isr`-Regel, und beide enthalten dieselben
Daten — nachgeprüft:

```bash
curl -s "https://eduard-andrae.de/blog/<slug>/_payload.json" | grep -c "Martin"
# → enthält den kompletten Kommentarbaum samt Autorennamen
```

Wer nur das HTML revalidiert, repariert die Seite für Direktaufrufe und lässt sie für jeden
Klick aus der Übersicht veraltet. Das Tückische ist die Prüfmethode: Wer den Fix
kontrollieren will, ruft die URL direkt auf — und sieht genau die eine Fassung, die stimmt.
Der Fehler überlebt seine eigene Verifikation.

Gefunden wurde er nur, weil beim Erweitern auf Beiträge die Frage aufkam, welche Pfade
Vercel überhaupt einzeln cacht. Die Antwort stand im Build-Verzeichnis:
`.vercel/output/functions/` listet für `/blog` einen eigenen Eintrag
`blog/_payload.json-isr.prerender-config.json`.

**→ AUDIT-PERSPEKTIVE:** „In wie vielen Fassungen existiert das?" in
`docs/audit-perspectives.md`.
