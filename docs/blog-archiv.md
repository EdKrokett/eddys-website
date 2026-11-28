# Blog-Archiv und interne Verlinkung

Stand: 28.11.2026. Anlass: Google Search Console meldete 84 von 257 Sitemap-Adressen als
indexiert, 160 als „Gefunden – zurzeit nicht indexiert“.

## Befund

Die Beitragsseiten waren für Google fast nur über die Sitemap erreichbar:

| Seite | Links auf Beiträge im HTML |
|---|---|
| `/` | 0 |
| `/blog` | 30 (die neuesten; „Ältere Beiträge laden“ ist ein JavaScript-Knopf) |
| `/statistik` | 28 (Laufberichte im Protokoll) |
| `/ueber-mich` | 3 |
| jede Beitragsseite | 0 (nur „Alle Beiträge“ → `/blog`) |

Von 247 Beiträgen hatten damit rund 200 keinen einzigen internen Link. Google kennt sie aus
der Sitemap, stuft sie aber niedrig ein: Eine Adresse, auf die die eigene Seite nicht
verweist, gilt als unwichtig. Genau das heißt „Gefunden – zurzeit nicht indexiert“.

Die Kategorie-Chips auf `/blog` sind ebenfalls Knöpfe, keine Links. Das bleibt so: Sie
filtern, und eine Filteransicht soll nicht in den Index.

## Lösung

Zwei Bausteine, die sich ergänzen.

### 1. Archivseite `/blog/archiv`

Alle veröffentlichten Beiträge auf einer Seite, nach Jahr gruppiert, jeder als echter Link.
Damit liegt jeder Beitrag zwei Klicks unter der Startseite (Start → Blog → Archiv →
Beitrag). Verlinkt von `/blog` (Kopf und unter der Liste), aus dem Weiterlesen-Block jeder
Beitragsseite und aus dem Footer.

Gestaltung im Sinne von „Präzisionswerk“: oben eine Skala über alle Jahre, jeder Strich so
hoch, wie viele Beiträge das Jahr hat, und zugleich Sprungmarke zum Jahr. Darunter das
Register: Jahreszahl groß in Fraunces, Einträge als Zeilen mit Datum in Mono, Titel und
Kategorie.

Der Pfad `archiv` ist damit als Beitrags-Slug belegt. Heute gibt es keinen solchen Beitrag
(geprüft 28.11.2026); ein künftiger hieße in WordPress anders oder wäre nur unter dieser
Seite verdeckt.

### 2. Weiterlesen-Block auf jeder Beitragsseite

Am Ende jedes Beitrags:

- **Älter / Neuer:** die chronologischen Nachbarn. Das allein verkettet alle Beiträge.
- **Mehr aus der Kategorie:** bis zu drei Beiträge derselben Hauptkategorie, zeitlich am
  nächsten (ohne die beiden Nachbarn). Hauptkategorie ist die erste aus
  `BLOG_CATEGORIES`, die der Beitrag trägt; `werbung` zählt nicht.
- Link zum Archiv mit der Gesamtzahl.

## Datenfluss

Beide Bausteine lesen dieselbe Liste: `fetchBlogArchiv()` in `server/utils/blog-archiv.ts`
holt alle Beiträge mit `_fields=slug,title,date,categories` seitenweise (100 pro Anfrage,
Schleife gemeinsam mit der Sitemap in `server/utils/wp-all-posts.ts`) und cacht sie per
`withWpCache` (Typ `archiv`, 30 min wie die Blogliste).

- `GET /api/blog/archiv` → alle Einträge, neueste zuerst.
- `GET /api/blog/<slug>/nachbarn` → `{ newer, older, related, total }`. Ein unbekannter
  Slug (etwa ein Beitrag, der neuer ist als der Cache) liefert leere Nachbarn, keinen
  Fehler: Der Block ist Beiwerk und darf die Beitragsseite nie scheitern lassen.

Die Logik (Gruppieren, Skala, Nachbarn) liegt als reine Funktionen in
`shared/utils/blog-archiv.ts`, das Prüfen der WordPress-Antwort in
`server/utils/blog-archiv.ts`. Beide haben Specs.

## Aktualität

`/blog/archiv` fällt unter die ISR-Regel `/blog/**` (1 h). Der Inhalts-Webhook baut es bei
Beitragsänderungen mit `/blog` zusammen neu (`blogIndexPaths`). Wie bei der Blogliste kann
der Daten-Cache der Function-Instanz dabei noch den alten Stand halten; ein neuer Beitrag
erscheint im Archiv und als „Neuer“-Nachbar also spätestens nach rund anderthalb Stunden.

## Fehlerverhalten

- Archiv-Liste nicht ladbar beim Rendern → 503, damit Vercel keine leere Archivseite eine
  Stunde lang cacht (gleiche Überlegung wie bei der Beitragsseite, `docs/error-catalog.md`).
- Nachbarn nicht ladbar → Block entfällt, die Beitragsseite rendert normal.

## Weitere Maßnahmen aus demselben Befund

- `robots.txt` lag nicht als Datei vor und fiel in die Catch-all-Route, also per 301 auf die
  robots.txt von WordPress (ohne `Sitemap:`-Zeile). Jetzt `public/robots.txt`.
- `/datenschutz` und `/impressum` tragen `noindex`, standen aber in der Sitemap. Jetzt per
  `sitemap.exclude` ausgenommen; `server/utils/sitemap-exclude.spec.ts` prüft, dass jede
  Seite mit `noindex` dort steht.

Einträge dazu in `docs/error-catalog.md` und `docs/audit-perspectives.md`.

## Offen: dünne Beiträge

Rund zehn Beiträge haben weniger als 150 Wörter Inhalt (z. B. `karstadt-marathon-2008-2`,
`stadtpark-hamburg-meine-neue-hausstrecke`). Sie sind die wahrscheinlichsten Kandidaten für
„Gecrawlt – zurzeit nicht indexiert“. Ob sie erweitert, zusammengelegt oder so belassen
werden, ist eine inhaltliche Entscheidung (Eddy).
