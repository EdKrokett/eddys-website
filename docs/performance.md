# Performance: Cache-Schichten und Region

Warum die Startseiten-Kacheln langsam waren und was die Ladezeit jetzt trägt.
Stand: 27.08.2026.

## Das Problem

Die Hero-Kachelwand (`HomeHero.vue` → `useBlogWallImages()`) holt ihre Bild-URLs
client-seitig über `/api/blog?limit=24`. Dieser Endpoint proxyt WordPress auf
`blog.eduard-andrae.de`. Gemessen am Live-Deployment:

| Pfad | Zeit |
|------|------|
| `/api/blog?limit=24` **kalt** | 1,6 – 3,0 s |
| `/api/blog?limit=24` **warm** | 0,17 s |
| Bild via `/_vercel/image` kalt | 0,5 s |
| Bild via `/_vercel/image` warm | 0,06 s |

Die Bilder waren nie das Problem — die Vercel-Bildoptimierung cached sauber am Edge
(`age: 41336`). Die Spanne kalt/warm beim API-Call ist das, was als „manchmal fünf
Sekunden" auffiel.

## Die drei Schichten (von innen nach außen)

**1. `withWpCache` (In-Memory + Best-Effort-Storage), `server/utils/wpCache.ts`**
TTL 30 min für Listen, 60 min für Einzelbeiträge. Lebt nur so lange wie die
Function-Instanz — auf Serverless nach jedem Cold Start leer. Diese Schicht allein
reicht deshalb nicht, siehe `error-catalog.md`.

**2. CDN-Cache über `routeRules`, `nuxt.config.ts`**
Die eigentliche Verbesserung. `s-maxage=1800, stale-while-revalidate=86400` auf
`/api/blog`. Bewusst als Header statt als Nitro-`swr`/`isr`: Vercels ISR-Prerender
müsste die Query-Parameter per `allowQuery` einzeln freigeben, sonst teilen sich alle
`?limit=`-Varianten einen Eintrag. Der CDN-Cache schlüsselt von Haus aus auf die volle
URL inklusive Query.

`stale-while-revalidate` ist hier der wichtigere Teil: Nach Ablauf der 30 Minuten
bekommt der nächste Besucher sofort die alte Antwort, während im Hintergrund neu
geholt wird. Niemand wartet mehr auf WordPress.

**3. Schlanke WordPress-Anfrage, `server/api/blog.get.ts`**
`_fields` beschränkt die Antwort auf die Felder, die auch gemappt werden. Ohne das
liefert WordPress jedes `content.rendered` voll mit: 743 KB / 2,05 s statt
226 KB / 1,16 s bei 24 Posts.

⚠️ `_embedded` muss **explizit** in der `_fields`-Liste stehen, ebenso die beiden
`_links.wp:*`. `_fields` filtert die Antwort auch dann, wenn `_embed` gesetzt ist —
ohne diese Einträge fehlen Beitragsbild und Kategorien kommentarlos.

Die Route `server/api/blog/[slug].get.ts` bekommt bewusst kein `_fields`: sie braucht
`content.rendered` und holt ohnehin nur einen Beitrag.

## Der Archiv-Filter (30.08.2026)

`/api/blog?search=…&category=…` reicht Suchbegriff und Kategorie an WordPress durch,
statt die geladene Liste im Browser zu filtern — nur so erfassen beide das ganze Archiv
(Begründung und Fallstricke: `error-catalog.md`).

Was das kostet: eine zusätzliche Anfrage je Filterwechsel. Beim Tippen um 300 ms
entprellt, damit ein getipptes Wort nicht als sechs Anfragen ankommt; ein Kategorie-Klick
geht sofort raus, weil dort nichts zu entprellen ist. Gemessen kalt 1,58 s, warm 0,004 s.

Warum das trotzdem billig bleibt — alle drei Cache-Schichten greifen unverändert:

- Der CDN-Header auf `/api/blog` schlüsselt auf die volle URL inklusive `?search=` und
  `?category=`. Häufige Filter werden also am Edge beantwortet, ohne WordPress zu fragen.
- `withWpCache` deckt dasselbe pro Function-Instanz ab. Der Suchbegriff geht als **Hash**,
  die Kategorie als **aufgelöste ID** an **fester Position** in den Key
  (`all-posts:<such-hash>:<kategorie-id>:<limit>:<page>`, jeweils `all` wenn ungesetzt) —
  roh angehängt zerlegte unstorage sie in Verzeichnisse, siehe `error-catalog.md`.
- `_fields` gilt für gefilterte Anfragen genauso: eine Trefferseite ist so schlank wie
  eine Listenseite, weil kein `content.rendered` mitkommt.

Die Kategorie-IDs stehen fest in `shared/utils/blog-categories.ts`, statt sie über
`/wp/v2/categories?slug=…` aufzulösen — das spart pro Filterklick einen Roundtrip, und
WordPress-Term-IDs ändern sich nicht.

Der Filter läuft ausschließlich im Client. `/blog` liegt per ISR am Edge (Schicht 4) und
alle Query-Varianten teilen sich dort einen Eintrag — serverseitig gefiltert bekäme der
nächste Besucher das Ergebnis des vorigen.

## Function-Region (`vercel.json`)

`vercel.json` ist JSON und kann keine Kommentare tragen, deshalb hier:

```json
{ "regions": ["fra1"] }
```

Die Functions liefen vorher in **iad1 (US-Ost)**, erkennbar am Response-Header
`x-vercel-id: fra1::iad1::…` (Edge Frankfurt, Ausführung US-Ost). WordPress steht bei
IONOS in Deutschland — jeder Cache-Miss ging damit zweimal über den Atlantik. `fra1`
setzt die Ausführung neben die Datenquelle.

Nach dem nächsten Deploy prüfen, dass der Header nur noch `fra1::…` zeigt. Falls die
Projekteinstellung in Vercel Vorrang behält: Dashboard → Settings → Functions →
Function Region ebenfalls auf Frankfurt stellen.

## Die Kachelwand: Bildgröße und Wiederholung

Zwei Fehler, die beim Nachmessen der Wand auffielen — beide unabhängig vom Cache.

### 1. Jede Kachel lud 2,7-fach zu groß

`image.screens` ist auf Vercel nicht nur ein Breakpoint-Alias, sondern die Liste der
**erlaubten** Bildbreiten: @nuxt/image schreibt die Werte als `images.sizes` in die
Vercel-Build-Config, der Provider rundet jede angeforderte Breite auf den nächsten
Eintrag **auf**, und alles, was nicht in der Liste steht, beantwortet Vercel mit 400
(`INVALID_IMAGE_OPTIMIZE_REQUEST`).

Der Default beginnt bei 640. Die Kachel war 240px breit — `width="240"` (1x) und 480
(2x) rundeten **beide** auf 640: dieselbe Datei zweimal im `srcset`, 26 KB statt 4 KB
pro Kachel.

| Breite | Dateigröße (WebP, q55) |
|--------|------------------------|
| 240 | 4 KB |
| 320 | 7 KB |
| 480 | 15 KB |
| 640 | 26 KB |

Prüfrezept — welche Breiten die Live-Seite akzeptiert:

```bash
for w in 240 320 480 640 768 1024; do
  echo -n "w=$w -> "
  curl -s -o /dev/null -w "%{http_code}\n" \
    "https://eddys-website-mauve.vercel.app/_vercel/image?url=<encoded>&w=$w&q=55"
done
```

### 2. Dasselbe Foto stand zweimal auf einem Screen

Jede Spalte wird für die Drift-Schleife per `[...col, ...col]` verdoppelt. Hat sie
weniger einzigartige Bilder, als gleichzeitig ins Sichtfenster passen, ist die
Wiederholung permanent im Bild. Vorher: 4 einzigartige Bilder bei **4,24** sichtbaren
Kacheln (1440px) bzw. **7,1** auf dem Handy. trusted-blogs hatte denselben Fehler
(dort Issue #45).

### Die Lösung: Geometrie statt Breakpoints

Spaltenzahl bleibt fest (5 Desktop / 3 Mobile), aber **Bildanzahl und Bildbreite
werden aus der Kachelgeometrie berechnet** (`imagesPerColumn`, `tileImageWidth` in
`HomeHero.vue`). Feste Werte pro Breakpoint träfen beides daneben: Der Bedarf schwankt
zwischen 2,7 und 7,3 sichtbaren Kacheln je nach Viewport.

Die Formel ist gegen Browser-Messungen geprüft (berechnet / gemessen): 7,26 / 7,26
bei Android 360, 3,98 / 3,96 bei Tablet 768, 3,55 / 3,54 bei Desktop 1440.

Ergebnis über die Breakpoints:

| Viewport | Spalten × Bilder | Kachel | Bildbreite | Transfer |
|----------|------------------|--------|-----------|----------|
| Android 360 | 3 × 10 = 30 | 117px | 240 (2,05×) | ~120 KB |
| iPhone 390 | 3 × 10 = 30 | 127px | 240 (1,89×) | ~120 KB |
| Tablet 768 | 3 × 6 = 18 | 258px | 480 (1,86×) | ~270 KB |
| Desktop 1280 | 5 × 5 = 25 | 257px | 480 (1,87×) | ~375 KB |
| Desktop 1440 | 5 × 5 = 25 | 290px | 480 (1,66×) | ~375 KB |
| Desktop 1920 | 5 × 4 = 20 | 390px | 640 (1,64×) | ~520 KB |

Vorher lagen Desktop wie Mobile pauschal bei 24 bzw. 12 Bildern à 26 KB — also
~624 KB Desktop und ~312 KB Mobile, bei gleichzeitig sichtbarer Wiederholung.

Zwei Stellschrauben, falls die Wand später zu schwer oder zu weich wirkt:
`TILE_SHARPNESS` (1,5 — bewusst unter 2, weil die Wand hinter dem Schleier liegt und
gefiltert ist) und `TILE_REPEAT_HEADROOM` (1,35 — Reserve gegen die Wiederholung).

⚠️ `TILE_SCREEN_WIDTHS` in `HomeHero.vue` muss eine Teilmenge von `image.screens` in
`nuxt.config.ts` bleiben, sonst rundet der Provider still nach oben.

⚠️ `WALL_GAP`, `WALL_OVERHANG`, `WALL_VERTICAL_OVERHANG`, `TILE_ASPECT`, `HERO_VH_FACTOR`
und `HERO_MAX_HEIGHT` spiegeln CSS-Werte aus derselben Datei. Wer das Layout der Wand
ändert (`gap`, `inset`, `aspect-ratio`, `min-height`), muss sie mitziehen — sonst
rechnet die Formel an der Realität vorbei. Gegenprobe per Browser-Messung, siehe oben.

## Was NICHT das Problem war

- **Der Idle-Gate im Hero.** `wallActive` schaltet nur `animation-play-state` der
  Drift-Animation, nicht die Sichtbarkeit. Die Kacheln erscheinen einzeln per
  `--loaded`, sobald ihr Bild da ist. Der `requestIdleCallback`-Timeout von 2000 ms
  liegt nicht im kritischen Pfad.
- **Die Spaltenzahl als Ladezeit-Hebel.** Von 6 auf 5 Spalten zu gehen hätte bei
  gleichbleibenden 4 Bildern pro Spalte nur 4 Bilder gespart — und die Wiederholung
  verschlimmert, weil die Kacheln dabei größer werden. Die Bildbreite war der Hebel,
  nicht die Anzahl. Zum Vergleich: trusted-blogs nutzt bei 5 Spalten **8** Bilder pro
  Spalte, also 40 statt 24 — dort ist die Bildanzahl höher, nicht niedriger.
- **Die zwei getrennten Fetches auf der Startseite** (`limit=3` für „Frisch aus dem
  Blog", `limit=24` für die Wand). Die Trennung ist Absicht und stammt aus
  trusted-blogs: ein gemeinsamer Fetch bedeutet ein gemeinsames Lade-Gate, die
  langsamere Sektion hält dann die schnellere auf. Nicht zusammenlegen.

## Kein Übertrag von trusted-blogs

Naheliegende Annahme, die nicht trägt: dort läuft dieselbe Cache-Idee schnell, weil
das Frontend als langlebiger Node-Prozess im Container deployt wird
(`tb26-code/frontend/Dockerfile`) und der Modul-Cache tagelang warm bleibt. Dazu
kommt ein eigenes, mitdeploytes FastAPI-Backend statt eines fremden WordPress.
Das clientseitige Lazy-Fetch-Muster (`useMagazineHighlights` / `useMagazineWallImages`)
ist hier bereits 1:1 übernommen. Mehr gibt es dort nicht zu holen.

## Messrezept

Ein Cache-Buster als Query-Parameter misst **nicht** den kalten Pfad — der Cache-Key
in `withWpCache` besteht nur aus `limit` und `page`, alles andere wird ignoriert.
Für echte Cache-Misses je einen bis dahin unbenutzten `limit`-Wert verwenden:

```bash
B="https://eddys-website-mauve.vercel.app"
for l in 23 22 21; do
  curl -s -o /dev/null -w "limit=$l: ttfb=%{time_starttransfer}\n" "$B/api/blog?limit=$l"
done
```

## Schicht 4: ISR auf den Blog-Seiten (30.08.2026)

Die drei Schichten oben cachen nur `/api/blog*`. Die **Seiten** blieben ungecacht —
`/blog/<beitrag>` antwortete mit `x-vercel-cache: MISS` und `max-age=0, must-revalidate`.

Der entscheidende Punkt, der leicht übersehen wird: Beim SSR ruft `useFetch('/api/blog')`
die Nitro-Route **direkt** auf, nicht über das CDN. Der Edge-Cache aus Schicht 2 wird beim
Rendern der Seite also komplett umgangen; es bleibt nur der In-Memory-Cache, der nach
jedem Cold Start leer ist. Gemessen am Live-Deployment (30.08.2026):

| Seite | kalt | warm |
|---|---|---|
| Startseite | 0,38 s | 0,09 s |
| `/blog` | 1,44 s | 0,13 s |
| `/blog/<beitrag>` | 0,69 s | 0,10 s |

`routeRules` mit `isr` schließt die Lücke: die fertige HTML-Seite liegt am Edge, der
Besucher wartet nie auf WordPress.

### Voraussetzung, die erst geschaffen werden musste

`/blog` las den Suchbegriff `?q=` über `route.query.q` **während des SSR**. Mit ISR wäre
das ein echter Fehler gewesen: Laut der in Schicht 2 dokumentierten Vercel-Eigenheit
teilen sich alle Query-Varianten einen Cache-Eintrag, solange `allowQuery` sie nicht
einzeln freigibt — ein Besucher hätte die vorgefilterte Seite eines anderen bekommen.

Gelöst nicht über `allowQuery`, sondern indem `/blog` **query-unabhängig gerendert** wird:
`app/pages/blog/index.vue` liest `?q=` jetzt in `onMounted`, also nach der Hydration. Die
SSR-Ausgabe ist damit für jede Query identisch und beliebig cachefähig, `/blog?q=marathon`
funktioniert unverändert. `onMounted` statt Setup ist Absicht — im Setup gelesen, würde der
Client sofort anders rendern als das gecachte HTML (Hydration-Mismatch).

**Regel für neue Seiten:** Eine Seite mit `isr`/`swr` darf im SSR-Pfad keine
Query-Parameter lesen. Wer das braucht, liest sie nach der Hydration oder verzichtet auf ISR.
