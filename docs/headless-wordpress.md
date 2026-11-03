# WordPress ohne eigenes Frontend („headless“)

Stand: 03.11.2026. Konzept, abgestimmt mit Eddy. **Schritt 1 ist umgesetzt, Schritte 2 bis 4
sind offen.** Wer hier weitermacht, beginnt bei Schritt 2.

## Ausgangslage

Jeder Beitrag existiert zweimal öffentlich:

| Adresse | Was dort läuft |
|---|---|
| `blog.eduard-andrae.de/<slug>/` | WordPress mit Theme Blocksy, Cookie-Banner (Complianz), Autoptimize, The SEO Framework. Gibt sich per Canonical als Original aus. |
| `eduard-andrae.de/blog/<slug>` | Nuxt-Seite, holt denselben Inhalt über die REST-API. |

Google sieht doppelte Inhalte und entscheidet selbst, welche Fassung zählt. Drei Plugins
existieren nur, weil das WordPress-Frontend Besucher hat.

## Ziel

WordPress bleibt Redaktionssystem, verliert aber sein öffentliches Gesicht. Unter
`blog.eduard-andrae.de` bleibt erreichbar, was die Technik braucht:

- `wp-admin`, `wp-login.php`: Eddy schreibt weiter wie gewohnt
- `wp-json`: Quelle für Beiträge, Kommentare, Läufe (`server/api/*`)
- `wp-content/uploads`: Bilder, die die Nuxt-Seite über `/_vercel/image` lädt
- `wp-cron.php`, `xmlrpc.php` (falls genutzt), der RSS-Feed

Alles, was ein Mensch zum Lesen aufruft, leitet per 301 auf `eduard-andrae.de` um.

## Umsetzung der Weiterleitung: eigenes Plugin

Nicht über `.htaccess` und nicht über Redirection-Regex. Beide sehen nur den URL-Text und
können einen Beitrag nicht von einer Seite oder Kategorie unterscheiden. Ein Plugin am Hook
`template_redirect` läuft, nachdem WordPress die Anfrage aufgelöst hat, und fragt ab, *was*
aufgerufen wurde (`is_singular('post')`, `is_category()`, …). Damit funktionieren auch
umbenannte Beiträge (WordPress löst alte Slugs selbst auf) und Kurzlinks wie `?p=123`.

Muster wie `wordpress/eddy-comment-revalidate/` und `wordpress/eddy-laufstatistik/`: Quelle
im Repo, per ZIP hochgeladen.

| Aufruf | Ziel |
|---|---|
| Beitrag | `https://eduard-andrae.de/blog/<slug>` |
| Startseite, Kategorie, Schlagwort, Datumsarchiv, Autor, Suche, Paginierung | `https://eduard-andrae.de/blog` |
| Seite `impressum` | `/impressum` |
| Seite `disclaimer` („Haftung und Datenschutz“) | `/datenschutz` |
| Seite `statistik` | `/statistik` (macht heute schon Redirection) |
| Seiten `bildliches` (2015), `gewichtiges` (2016) | **offen, Eddy entscheidet**: `/blog`, `/ueber-mich` oder als Beitrag übernehmen |
| Feed (`is_feed()`) | keine Umleitung |
| Vorschau (`is_preview()`) und angemeldete Nutzer | keine Umleitung, sonst funktioniert der Vorschau-Knopf für Entwürfe nicht |
| 404 | **keine Umleitung**, siehe Endlosschleife |
| REST, Admin, Login, Cron, Uploads | erreichen `template_redirect` gar nicht oder sind ausgenommen |

### Endlosschleife (hart verboten)

`app/pages/[...slug].vue` schickt jeden unbekannten Pfad auf `eduard-andrae.de` per 301 an
`blog.eduard-andrae.de` (alte Links aus der Zeit vor dem Umzug). Würde WordPress einen ihm
unbekannten Pfad zurückschicken, liefe der Aufruf im Kreis. Regel: Das Plugin leitet **nur**
um, was WordPress positiv als Inhalt erkannt hat. Alles andere bleibt die WordPress-404.

Folge, bewusst akzeptiert: Ein Altlink `eduard-andrae.de/mein-beitrag/` braucht zwei Sprünge
(→ `blog.eduard-andrae.de/mein-beitrag/` → `eduard-andrae.de/blog/mein-beitrag`). Verkürzen
ließe sich das später in der Catch-all-Route, indem sie Beitrags-Slugs selbst erkennt.

### Weiterleitungsketten aus Redirection

Redirection hat 18 Regeln (Stand 03.11.2026), etwa Tippfehler-Slugs auf den richtigen Slug.
Die bleiben gültig und hängen einen Sprung an. Kein Handlungsbedarf, Aufräumen optional.

## Schritte

### Schritt 1: Nuxt-Seite als Original vorbereiten ✅ (03.11.2026)

Wirkt auch ohne die Umstellung und ändert für Besucher nichts.

- **Canonical auf jeder Seite** (`app/app.vue`, Logik in `shared/utils/canonical-url.ts`):
  Website-Adresse plus Pfad, ohne Query, ohne abschließenden Schrägstrich, Sonderzeichen in
  einheitlicher Kodierung. Ohne Query ist Pflicht, weil `isr`-Seiten query-unabhängig
  rendern müssen (`docs/performance.md`) und `/blog?q=…` kein eigenes Original ist.
- **Alle Beiträge in der Sitemap** (`server/api/__sitemap__/posts.get.ts`, als `sources` in
  `nuxt.config.ts`): Slug und `modified_gmt` aus WordPress, dient als `lastmod`. Gecacht über
  `withWpCache` (Typ `sitemap`, 1 h); die Sitemap selbst cacht das Modul 10 min am Edge. Ein
  neuer Beitrag steht also spätestens nach gut einer Stunde drin.

Solange WordPress sich selbst als Original ausgibt, beanspruchen beide Fassungen diese
Rolle. Das ist nicht schlechter als vorher (ohne Canonical galt die Nuxt-Seite implizit als
eigenes Original), wird aber erst mit Schritt 3 eindeutig.

**Noch offen, aber keine Voraussetzung:** Interne Links in alten Beiträgen zeigen auf
`blog.eduard-andrae.de/<slug>/`. Nach der Umstellung funktionieren sie über die
Weiterleitung. Sauberer wäre, sie auf der Nuxt-Seite direkt auf `/blog/<slug>` umzuschreiben
(Anknüpfungspunkt: `rewriteLegacyWpUrls` in `shared/utils/`). Dabei Bild-URLs unter
`wp-content/uploads` **nicht** anfassen, die müssen auf WordPress zeigen.

### Schritt 2: Plugin bauen, mit Testmodus

- Einstellung „Testmodus“: Das Plugin leitet nicht um, sondern setzt nur einen Header
  `X-Eddy-Redirect: <ziel>`. So lässt sich die Zuordnung prüfen, ohne Besucher umzuleiten.
- Prüfskript: alle Beitrags-Links aus `/wp-json/wp/v2/posts?_fields=link` plus die Seiten
  abrufen, Header mit dem erwarteten Ziel vergleichen. Jedes Ziel einmal auf
  `eduard-andrae.de` aufrufen (muss 200 liefern, nicht 404 und nicht Weiterleitung).
- Ausdrücklich testen: Vorschau eines Entwurfs, unbekannter Pfad (404, keine Umleitung),
  Feed, ein Beitrag mit Sonderzeichen-Slug
  (`zwischenbericht-1-madeira-beine-%e2%88%925-kg-und-die-geloeste-handbremse`).

### Schritt 3: Scharf schalten

- Testmodus aus, Stichproben, Prüfskript erneut.
- Google Search Console: Property für `eduard-andrae.de` anlegen (falls nicht vorhanden),
  `https://eduard-andrae.de/sitemap.xml` einreichen. Ein vorübergehender Knick im Ranking ist
  möglich, 301 überträgt den Großteil.
- `memory`/Notizen: `wordpress_widgets.md` wird gegenstandslos (Sidebar ist nicht mehr sichtbar).

### Schritt 4: Aufräumen in WordPress

- Löschen: Complianz, Autoptimize, The SEO Framework.
- Blocksy bleibt installiert (WordPress braucht ein Theme), ist aber nicht mehr sichtbar.
- Datenschutzerklärung auf `eduard-andrae.de` gegenlesen: Hinweise auf den Cookie-Banner des
  Blogs streichen, falls vorhanden.
- Bleibt: Akismet (prüft auch Kommentare, die über die Nuxt-Seite eingehen), FluentSMTP,
  Redirection, die eigenen Plugins, die AI-Plugins (Eddys Entscheidung).

## Offene Entscheidungen für Eddy

1. Ziel für die Seiten „Bildliches“ und „Gewichtiges“.
2. Zeitpunkt der Umstellung (Schritt 3).
