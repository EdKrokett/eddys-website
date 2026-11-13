# WordPress ohne eigenes Frontend („headless“)

Stand: 12.11.2026. Konzept, abgestimmt mit Eddy. **Schritte 1 bis 3 sind umgesetzt** (seit 13.11.2026
leitet WordPress per 301 um). Wer hier weitermacht, beginnt bei Schritt 4.

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
| Startseite, Kategorie, Schlagwort, Datumsarchiv, Autor, Paginierung | `https://eduard-andrae.de/blog` |
| Suche `?s=<begriff>` | `https://eduard-andrae.de/blog?q=<begriff>` (die Blog-Übersicht liest `q`), leere Suche → `/blog` |
| Kurzlink `?p=<id>` | wie der Beitrag, ohne Umweg über die WordPress-Adresse |
| Anhangseite | der Beitrag, an dem der Anhang hängt, sonst `/blog` |
| Seite `impressum` | `/impressum` |
| Seite `disclaimer` („Haftung und Datenschutz“) | `/datenschutz` |
| Seite `statistik` | `/statistik` (macht heute schon Redirection) |
| Seite `gewichtiges` (2016, Gewicht und Lauf-km) | `/statistik` (Eddy, 12.11.2026) |
| jede andere Seite, darunter `bildliches` (2015) | `/blog`. Eddy braucht „Bildliches“ nicht mehr (12.11.2026); die Seite darf in WordPress gelöscht werden, danach ist ihre Adresse eine 404. |
| Feed (`is_feed()`) | keine Umleitung |
| Vorschau (`is_preview()`) und angemeldete Nutzer | keine Umleitung, sonst funktioniert der Vorschau-Knopf für Entwürfe nicht |
| Embed (`/<slug>/embed/`), Trackback, `robots.txt`, `favicon.ico`, Sitemaps | keine Umleitung: Maschinen-Abrufe, keine Leser |
| Anfrage mit anderer Methode als GET/HEAD (Kommentarformular, XML-RPC) | keine Umleitung |
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

Plugin `wordpress/eddy-headless-redirect/`, Installation in `wordpress/README.md`.

- Einstellung unter Einstellungen → Headless-Weiterleitung mit drei Stellungen: **Aus**,
  **Testmodus** (Vorgabe nach der Aktivierung), **Aktiv**. „Aus“ ist der Notschalter, ohne
  das Plugin deaktivieren zu müssen.
- Testmodus: Das Plugin leitet nicht um, sondern setzt nur einen Header
  `X-Eddy-Redirect: <ziel>`. So lässt sich die Zuordnung prüfen, ohne Besucher umzuleiten.
  Leitet es bewusst nicht um, nennt `X-Eddy-Redirect-Skip: <grund>` den Grund (`404`,
  `feed`, `angemeldet`, `vorschau`, …). Den Grund-Header gibt es nur im Testmodus.
- Haken `template_redirect` mit Priorität 1, also vor `redirect_canonical` und
  `wp_old_slug_redirect` (beide Priorität 10). Dadurch springt `?p=123` direkt zur Nuxt-Seite.
  Ein umbenannter Beitrag ist für WordPress zunächst eine 404; ihn löst erst
  `wp_old_slug_redirect` auf den neuen Slug auf, danach greift das Plugin. Zwei Sprünge,
  bewusst akzeptiert, weil das Plugin sonst eine 404 umleiten müsste.
- Positivliste statt Ausnahmeliste: Umgeleitet wird nur, was `is_singular()`, `is_home()`,
  `is_front_page()`, `is_archive()` oder `is_search()` ist. Alles andere bleibt unberührt.
- Beitrags-Slugs werden einheitlich kodiert (`rawurlencode(rawurldecode(slug))`, große
  Hex-Ziffern), damit das Ziel Zeichen für Zeichen dem Canonical der Nuxt-Seite entspricht
  (`shared/utils/canonical-url.ts`).
- Redirection läuft vor `template_redirect` (Haken `init`). Seine Regeln, etwa für
  `/statistik/`, greifen also weiterhin zuerst und unabhängig vom Testmodus.
- Prüfskript `scripts/check-headless-redirect.mjs`: alle Beitrags-Links aus
  `/wp-json/wp/v2/posts?_fields=link` plus die Seiten abrufen, Header mit dem erwarteten
  Ziel vergleichen. Jedes Ziel einmal auf `eduard-andrae.de` aufrufen (muss 200 liefern,
  nicht 404 und nicht Weiterleitung) und dessen Canonical mit dem Ziel ohne Query
  vergleichen. Das Skript wertet sowohl den Test-Header als auch eine echte 301 aus und
  dient deshalb unverändert für Schritt 3.
- Ausdrücklich testen: Vorschau eines Entwurfs, unbekannter Pfad (404, keine Umleitung),
  Feed, ein Beitrag mit Sonderzeichen-Slug
  (`zwischenbericht-1-madeira-beine-%e2%88%925-kg-und-die-geloeste-handbremse`).
- **Reihenfolge:** Das Prüfskript erst laufen lassen, wenn der Fix für gecachte Fehlerseiten
  (`app/plugins/data-error-status.server.ts`, `wpLoadErrorStatus`) live ist. Der erste Lauf
  am 12.11.2026 hat ohne ihn 171 Beitragsseiten für eine Stunde auf 404 gesetzt
  (`docs/error-catalog.md`). Das Skript ist seitdem gedrosselt und hat einen Notaus.

**Befund aus dem ersten Prüflauf (12.11.2026):** Redirection-Regel 3 leitet
`/halbmarathon-cuxhaven-2011/` auf `/halbmarathon-cuxhaven-2011-2/` um. Das sind zwei
verschiedene Beiträge: die Ankündigung vom 11.01.2011 (ID 3332) und der Bericht vom
16.04.2011 (ID 3704). Die Ankündigung ist dadurch schon heute über ihre WordPress-Adresse
nicht erreichbar, auf `eduard-andrae.de/blog/halbmarathon-cuxhaven-2011` dagegen schon.
Erledigt am 12.11.2026 auf Eddys Entscheidung: Regel 3 in Redirection **deaktiviert**, nicht
gelöscht, damit sie sich mit einem Klick zurückholen lässt. Beide Beiträge sind seitdem
unter ihrer eigenen Adresse erreichbar.

**Prüflauf 12.11.2026 (Testmodus):** 272 Adressen, 252 Ziele, keine Fehler. 262 Zuordnungen
über den Test-Header, eine echte 301 (`/statistik/`, von Redirection). Übersprungen: Vorschau
eines Entwurfs, weil es keinen Entwurf gab. Abgedeckt ist sie trotzdem doppelt: anonym ist
ein Entwurf eine 404 (Fall „Unbekannter Pfad“), angemeldet greift `angemeldet`. In Schritt 3
einmal von Hand im Browser prüfen.

### Schritt 3: Scharf schalten

**Stand 13.11.2026:** Eddy hat auf „Aktiv“ geschaltet. Prüflauf: 272 Adressen, 252 Ziele,
keine Fehler, 263 echte Weiterleitungen (`x-redirect-by: Eddy Headless`, eine von
Redirection). Ketten von Hand geprüft: Altlink `eduard-andrae.de/<slug>/` landet in zwei
Sprüngen auf `/blog/<slug>` (200), ein unbekannter Pfad endet nach einem Sprung als
WordPress-404, keine Schleife. Eddy hat die Vorschau eines Entwurfs geprüft (bleibt auf
WordPress, funktioniert), die Domain-Property `eduard-andrae.de` in der Search Console
angelegt und die Sitemap eingereicht.

Bestätigt per manuell angelegtem TXT-Eintrag, **nicht** über IONOS Domain Connect: Der
Assistent wollte dafür den Mail-Dienst der Domain abschalten und den MX-Eintrag löschen.
Daran hängen die Weiterleitung `eddy@` und das Versandkonto `blog@` für FluentSMTP.

Nebenbei: Das Stylesheet der Sitemap ist abgeschaltet (`sitemap.xsl: false` in
`nuxt.config.ts`), weil Chrome XSLT entfernt und beim Aufruf warnte.

- Testmodus aus, Stichproben, Prüfskript erneut.
- Angemeldet in WP-Admin bei einem Entwurf auf „Vorschau“ klicken: Die Vorschau muss auf
  blog.eduard-andrae.de bleiben.
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

## Entscheidungen

Keine offenen. Entschieden am 13.11.2026: Umstellung nach dem grünen Prüflauf. Am 12.11.2026: „Gewichtiges“ → `/statistik`, „Bildliches“ wird nicht mehr
gebraucht (fällt unter „jede andere Seite“ → `/blog`), Redirection-Regel 3 deaktiviert.
