# WordPress-Gegenstücke

Code, der **nicht** in dieser Nuxt-Anwendung läuft, sondern in WordPress auf
`blog.eduard-andrae.de`. Er liegt hier im Repo, damit er versioniert ist und neben dem
Endpunkt steht, den er aufruft — deployt wird er aber von Hand.

## `eddy-comment-revalidate/` — Inhalts-Webhook

Meldet Änderungen an Kommentaren und Beiträgen an `server/api/revalidate.post.ts`, damit
die betroffenen Seiten sofort neu gebaut werden statt auf den ISR-Ablauf zu warten. Warum
das nötig ist und was genau neu gebaut wird: `docs/revalidierung.md`.

Der Ordnername stammt noch aus Version 1.0, als das Plugin nur Kommentare kannte. Er
bleibt, weil er in WordPress den Installationspfad bestimmt — ein neuer Name legte beim
Hochladen ein zweites Plugin an, statt das vorhandene zu ersetzen.

### Paket bauen

```bash
cd wordpress && zip -r ~/Downloads/eddy-comment-revalidate.zip eddy-comment-revalidate
```

### Installieren

1. WP-Admin → Plugins → Installieren → Plugin hochladen → das ZIP wählen → aktivieren.
2. Einstellungen → Inhalts-Webhook öffnen.
3. **Endpoint:** `https://eduard-andrae.de/api/revalidate`
4. **Secret:** derselbe Wert wie `NUXT_REVALIDATE_SECRET` in Vercel.
5. Speichern, dann *Jetzt testen*. Erwartet wird `OK (200)`.

Bei einem Update dasselbe ZIP neu hochladen — WordPress fragt, ob die vorhandene Version
ersetzt werden soll. Endpoint und Secret bleiben dabei erhalten, sie liegen in der
Datenbank und nicht im Plugin.

### Update auf Version 1.3

Die Statistik-Meldung geht nicht mehr über WP-Cron, sondern direkt am Ende des
Speichervorgangs (Begründung im Kommentar an `eddy_cr_queue_statistik()`). ZIP hochladen und
ersetzen genügt.

### Update auf Version 1.2

Neu: `eddy_cr_queue_statistik()` und der Scope `statistik`, aufgerufen vom Plugin
`eddy-laufstatistik` (unten). Nichts einzutragen; ZIP hochladen und ersetzen genügt. Die
Nuxt-Seite muss vorher deployt sein, sonst behandelt eine alte Fassung von
`server/api/revalidate.post.ts` die Meldung als Kommentar-Meldung ohne Post-ID und antwortet 400.

### Update von Version 1.0 auf 1.1

Version 1.0 sprach noch `/api/revalidate-comments` an. Das Plugin stellt die gespeicherte
Adresse beim ersten Aufruf des WP-Backends selbst um, es ist also nichts einzutragen.
Prüfen lässt es sich im Endpoint-Feld: Dort muss `/api/revalidate` stehen.

### Fehlerbilder

| Antwort | Bedeutung |
|---|---|
| `OK (200)` | Alle betroffenen Pfade wurden neu gebaut. |
| `Fehler (401)` | Secret stimmt nicht mit `NUXT_REVALIDATE_SECRET` überein. |
| `Fehler (503)` | `VERCEL_BYPASS_TOKEN` fehlt zur Laufzeit. |
| `Fehler (502)` mit „x-vercel-cache: HIT" | Der Token wurde ignoriert — im Build stand ein anderer oder gar keiner. |
| `Fehler (502)` mit Pfadliste | Einzelne Pfade schlugen fehl; die Antwort nennt jeden mit Grund. |
| `Fehler (409)` | Kommentar an einem unveröffentlichten Beitrag — nichts zu tun, kein echter Fehler. |
| `Fehler (404)` | Kommentar zu einem Beitrag, den WordPress nicht mehr kennt. |
| `Fehler` ohne Code | Die Seite war nicht erreichbar (Timeout, DNS, Firewall). |

Das Plugin sendet nie synchron: Es plant den Aufruf über `wp_schedule_single_event`, damit
niemand beim Kommentieren oder Speichern auf einen fremden Server wartet. Ein Ergebnis
erscheint auf der Einstellungsseite deshalb erst, wenn WP-Cron gelaufen ist — bei einem
Klick auf *Jetzt testen* dagegen sofort, der sendet direkt und prüft dabei alle vier Pfade.

## `eddy-laufstatistik/` — Laufstatistik

Eddys Läufe als eigener Inhaltstyp „Lauf“ mit Eingabemaske in WP-Admin (Menüpunkt **Läufe**)
und öffentlicher Leseschnittstelle `GET /wp-json/eddy-laufstatistik/v1/laeufe`. Ersetzt die
TablePress-Tabelle; angezeigt wird auf `eduard-andrae.de/statistik`. Datenmodell, Regeln und
Umzug: `docs/statistik.md`.

### Paket bauen

```bash
cd wordpress && zip -r ~/Downloads/eddy-laufstatistik.zip eddy-laufstatistik
```

### Installieren

WP-Admin → Plugins → Installieren → Plugin hochladen → das ZIP wählen → aktivieren. Keine
Einstellungen. Danach erscheint links der Menüpunkt **Läufe**.

Die Seite wird nach jeder Änderung an einem Lauf neu gebaut, wenn der Inhalts-Webhook ab
Version 1.2 aktiv ist. Ohne ihn greift nur die ISR-Frist.

### Prüfen

```bash
curl -s https://blog.eduard-andrae.de/wp-json/eddy-laufstatistik/v1/laeufe | head -c 300
```

Erwartet wird eine JSON-Liste. `rest_no_route` heißt: Plugin nicht aktiv.

## `eddy-headless-redirect/` — Headless-Weiterleitung

Leitet Leser des WordPress-Frontends per 301 auf dieselbe Seite unter `eduard-andrae.de` um.
REST-API, Admin, Login, Bilder, Feed, Vorschau und 404-Seiten bleiben unberührt. Konzept,
Zuordnungstabelle und die Regel gegen die Endlosschleife: `docs/headless-wordpress.md`.

Seit Version 1.3 nimmt das Plugin außerdem die Kommentare an, die Leser im Formular auf
`eduard-andrae.de` schreiben (`POST /wp-json/eddy-headless/v1/kommentare`). Weg und
Begründung: `docs/blog-kommentare.md`.

### Paket bauen

```bash
cd wordpress && zip -r ~/Downloads/eddy-headless-redirect.zip eddy-headless-redirect
```

### Installieren

1. WP-Admin → Plugins → Installieren → Plugin hochladen → das ZIP wählen → aktivieren.
2. Einstellungen → Headless-Weiterleitung: Nach der ersten Aktivierung steht dort
   **Testmodus**. Es wird noch niemand umgeleitet.

### Prüfen

```bash
npm run check:headless
```

Im Testmodus wertet das Skript den Header `X-Eddy-Redirect` aus, im aktiven Betrieb die
echte 301. Erwartet wird am Ende „Alles in Ordnung“. Einzelne Adresse von Hand:

```bash
curl -sI https://blog.eduard-andrae.de/impressum/ | grep -i x-eddy
# X-Eddy-Redirect: https://eduard-andrae.de/impressum
```

Fehlt der Header ganz: Plugin nicht aktiv oder auf „Aus“.

### Stellungen

| Stellung | Wirkung |
|---|---|
| Aus | Nichts. Notschalter, ohne das Plugin zu deaktivieren. |
| Testmodus | Nur Header, keine Umleitung. |
| Aktiv | 301 auf `eduard-andrae.de`. Browser merken sich eine 301 dauerhaft; ein Zurückschalten wirkt bei Besuchern, die schon umgeleitet wurden, erst nach dem Leeren des Browser-Caches. |

### Update auf Version 1.1

Sitemap-Adressen des Blogs (`/sitemap.xml`, `/wp-sitemap*.xml`) leiten auf
`https://eduard-andrae.de/sitemap.xml` um, statt als Startseite auf `/blog` zu landen.
Hintergrund: `docs/headless-wordpress.md`, Schritt 4. ZIP hochladen und ersetzen genügt, die
Stellung (Aktiv) bleibt erhalten. Prüfen:

```bash
curl -sI https://blog.eduard-andrae.de/sitemap.xml | grep -i location
# location: https://eduard-andrae.de/sitemap.xml
```

### Update auf Version 1.2

Keine Ausnahme mehr für angemeldete Nutzer: Auch wer in WP-Admin angemeldet ist, wird
umgeleitet. Die Vorschau bleibt auf WordPress, sie hängt an `is_preview()`, ebenso private
Beiträge und Entwürfe. ZIP hochladen und ersetzen genügt; danach einmal bei einem Entwurf auf
„Vorschau“ klicken.

### Update auf Version 1.3

Neu: die Route `POST /wp-json/eddy-headless/v1/kommentare` für das Kommentarformular der
Nuxt-Seite. ZIP hochladen und ersetzen genügt, nichts einzutragen, die Stellung (Aktiv)
bleibt erhalten. **Reihenfolge: erst dieses Update, dann die Nuxt-Seite deployen.** Ohne das
Update meldet das Formular „Kommentieren ist gerade nicht möglich“.

Prüfen, ohne einen Kommentar anzulegen (leerer Body, WordPress lehnt ihn ab):

```bash
curl -s -X POST https://blog.eduard-andrae.de/wp-json/eddy-headless/v1/kommentare \
  -H 'Content-Type: application/json' -d '{}'
# erwartet: {"code":"rest_missing_callback_param", … "status":400}
# rest_no_route (404) heißt: Plugin nicht aktiv oder älter als 1.3.0
```

Nichts anderes als `{}` schicken: Name und E-Mail sind auf diesem Blog keine Pflichtfelder,
ein Body mit Beitrags-ID und Text legt einen echten, sofort öffentlichen Kommentar an
(am 22.11.2026 versehentlich passiert, `docs/blog-kommentare.md`).

Danach einmal von Hand auf `eduard-andrae.de` kommentieren. Der Kommentar muss in
WP-Admin → Kommentare stehen, die Benachrichtigungsmail muss ankommen, und nach der
Freigabe muss er auf der Beitragsseite erscheinen (Inhalts-Webhook).

Bekannte Eigenheit: Steht Akismet auf „Den schlimmsten Spam automatisch löschen“, antwortet
WordPress bei solchem Spam mit einer Weiterleitung statt mit JSON. Das Formular zeigt dann
„Keine Verbindung zum Blog“. Für echte Leser tritt das nicht auf.

### Update auf Version 1.3.1

Kommentare aus dem Formular landeten im Spam, weil Akismet auf diesem Weg die Merkmale
eines echten Formulars fehlten (`docs/blog-kommentare.md`, Abschnitt „Was Akismet über einen
Kommentar erfährt“). Das Plugin meldet Akismet jetzt den Nonce als „inaktiv“ statt
„fehlgeschlagen“, die Adresse des Beitrags auf `eduard-andrae.de` und den Zeitpunkt, zu dem
das Formular geöffnet wurde.

Neu außerdem: Landet ein Kommentar aus dem Formular trotzdem im Spam, kommt eine Mail
„[Blog] Kommentar im Spam: <Name>“ an den Autor des Beitrags, höchstens 20 am Tag. Ist der
Kommentar echt, im Spam-Ordner auf **Kein Spam** klicken; nur so erfährt Akismet von dem
Irrtum.

ZIP hochladen und ersetzen genügt, nichts einzutragen. Die Reihenfolge gegenüber dem Deploy
der Nuxt-Seite ist egal.

