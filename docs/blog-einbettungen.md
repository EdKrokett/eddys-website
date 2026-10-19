# Blog-Einbettungen: Videos und fremde Inhalte erst nach Klick

Stand 19.10.2026. Beschreibt `app/utils/embed-consent.ts` und seine Anwendung in
`app/pages/blog/[slug].vue`.

## Warum

Die Datenschutzerklärung sagt zu: „Es werden keine Inhalte dieser Dienste automatisch
eingebettet, eine Verbindung entsteht erst, wenn Sie einen Link anklicken.“ Die
Blogbeiträge enthielten aber fremde iframes, die beim Öffnen eines Beitrags sofort luden.
Gezählt über alle 245 Beiträge per REST-API (19.10.2026):

| Quelle | Anzahl | Herkunft im Markup |
| --- | ---: | --- |
| youtube.com | 46 | 40 klassischer Editor, 6 Gutenberg-Embed |
| youtube-nocookie.com | 22 | klassischer Editor |
| player.vimeo.com | 4 | 3 Gutenberg-Embed, 1 klassischer Editor |
| gpsies.com | 2 | Kartenausschnitt |
| facebook.com | 1 | Video |
| connect.garmin.com | 1 | Aktivität |

Dazu Flash-Einbettungen (`<object>`/`<embed>`) aus der Zeit vor 2012: 3 YouTube-Videos,
1 Facebook-Video, 7 Picasa-Alben.

**Entscheidung (Eddy, 19.10.2026):** Zwei-Klick-Lösung statt eines YouTube-Absatzes in der
Datenschutzerklärung. Damit stimmt die bestehende Erklärung wieder, ohne dass sie geändert
werden muss, und es entsteht keine Verbindung zu einem Drittanbieter ohne Zutun.

## Wie

`guardEmbeds(html, options)` ersetzt im Beitrags-HTML jedes iframe, dessen Quelle nicht
auf `eduard-andrae.de` liegt, durch einen Platzhalter. Ein Klick auf den Knopf im
Platzhalter setzt erst dann das iframe ein (`activateEmbed`).

- **YouTube** bekommt ein Vorschaubild (`i.ytimg.com/vi/<id>/hqdefault.jpg`). Es läuft über
  den eigenen Bild-Proxy (`useImage()`, auf Vercel `/_vercel/image`), der Browser spricht
  also nicht mit YouTube. Dafür steht `i.ytimg.com` in `image.domains`. Der Player selbst
  kommt nach dem Klick von **youtube-nocookie.com** und startet sofort (`autoplay=1`):
  Der Klick war die Entscheidung zum Abspielen, ein zweiter Klick auf den Player wäre
  Leerlauf.
- **Vimeo** behält seine Original-URL samt Query (private Videos brauchen den `h`-Parameter)
  und bekommt `autoplay=1`. Kein Vorschaubild: Das gäbe es nur über die Vimeo-API.
- **Alles andere** (GPSies, Facebook, Garmin) bekommt einen typografischen Platzhalter
  mit dem Anbieternamen. Das Seitenverhältnis kommt aus den `width`/`height`-Attributen.
  GPSies gibt es seit 2019 nicht mehr, die Garmin-Einbettung vermutlich auch nicht. Die
  Platzhalter bleiben trotzdem: Sie ändern nichts am Inhalt des Beitrags, und ob dort noch
  etwas lädt, sieht man nach dem Klick.
- **YouTube-Flash** (`youtube.com/v/<id>` in `<object>`/`<embed>`) wird zum normalen
  YouTube-Platzhalter. Diese drei Videos waren seit dem Ende von Flash unsichtbar und sind
  jetzt wieder abspielbar.
- **Übrige Flash-Einbettungen** (Facebook, Picasa) bleiben unverändert. Ohne Flash-Plugin
  fordert kein aktueller Browser die Datei an (per Netzwerk-Mitschnitt geprüft, siehe unten).

Der Platzhalter besteht nur aus `<span>`-, `<img>`- und `<button>`-Elementen: Die meisten
iframes stehen im klassischen Editor in einem `<p>`. Ein `<div>` darin schlösse der
HTML-Parser des Browsers vorzeitig, und das zerrisse den Absatz.

**Warum in der Seite und nicht in der Server-Route:** Die Vorschaubild-URL hängt vom
Bild-Provider ab (lokal IPX, auf Vercel `/_vercel/image`). Das weiß nur `useImage()` auf
der App-Seite. Der Regex-Durchlauf über einen Beitrag kostet unter einer Millisekunde.

## Prüfung

Netzwerk-Mitschnitt mit Playwright (Chrome headless, Dev-Server) über alle Beiträge, die
ein `<iframe>`, `<object>` oder `<embed>` enthalten, jeweils einmal ganz durchgescrollt.
Ergebnis vom 19.10.2026:

| Prüfung | Ergebnis |
| --- | --- |
| Beiträge mit Einbettungen | 71 |
| Platzhalter gesamt | 79 (76 iframes + 3 YouTube-Flash) |
| Anfragen an fremde Hosts beim Laden | **0** |
| iframes im DOM vor dem Klick | 0 |
| Facebook-/Picasa-Flash | keine Anfrage |
| Nach Klick (BITburger-Beitrag) | youtube-nocookie.com, danach Googles Video-Server |
| Fokus nach Klick | im iframe |

Wiederholen, wenn sich an `guardEmbeds` etwas ändert: Liste der Beiträge per REST-API
holen (`/wp-json/wp/v2/posts?per_page=100&page=N&_fields=slug,content`), jeden aufrufen,
`page.on('request')` auf Hosts außerhalb von `localhost`/`eduard-andrae.de` filtern.

## Bilder von fremden Servern (seit 19.10.2026)

Zehn `<img>` in alten Beiträgen zeigten direkt auf fremde Server und luden ohne Klick
(Eddys Freigabe, 19.10.2026). `proxyForeignImages(html, proxy)` in
`app/utils/foreign-images.ts` leitet jedes `<img>` mit fremder Quelle über den Bild-Proxy.
`srcset` und `sizes` fallen dabei weg, sonst lüde der Browser die Varianten weiter direkt.

| Server | Bilder | Zustand (19.10.2026) | Behandlung |
| --- | ---: | --- | --- |
| 3.bp.blogspot.com | 4 | 3 erreichbar, 1 tot (404) | Proxy |
| lh4.ggpht.com | 1 | erreichbar | Proxy |
| static.xx.fbcdn.net | 2 | erreichbar (Facebook-Emojis, 16px) | Proxy |
| www.1-2-sports.com | 1 | tot (404) | entfernt |
| tiger-balm-team.de | 1 | Server antwortet nicht | entfernt |
| www.assoc-amazon.de | 1 | Server antwortet nicht (Partner-Zählpixel) | entfernt |

**Freigegeben ist nur, was in `shared/utils/image-proxy-hosts.ts` steht.** Dieselbe Liste
speist `image.domains` in `nuxt.config.ts`. Ein fremdes Bild, dessen Server dort fehlt,
entfernt `proxyForeignImages` aus dem HTML. Es dem Proxy trotzdem zu übergeben, wäre ein
Leck: Für einen nicht freigegebenen Host gibt `useImage()` keine Proxy-URL zurück, sondern
still die Original-URL (`validateDomains` in IPX und im Vercel-Provider,
`@nuxt/image/dist/runtime/image.js`). Die drei entfernten Bilder waren ohnehin tot.

Kommt ein neues fremdes Bild in einen Beitrag, fehlt es auf dieser Seite, bis sein Server
in der Liste steht. Bilder aus der WordPress-Mediathek betrifft das nicht.

Relative Pfade (`../wp-content/…`, zehnmal in Beiträgen von 2010/2011) und `file://`
bleiben unangetastet: Sie zeigen auf die eigene Domain oder nirgendwohin, Daten fließen
dabei an niemanden.

Kosten: ein Bild ist eine Transformation, 31 Tage im CDN gehalten (`minimumCacheTTL`).
Bei sechs erreichbaren Bildern fällt das im Hobby-Kontingent nicht ins Gewicht.

## Qualitäts-Check (Q1–Q6)

1. **Externe Werte?** Ja, das gesamte Beitrags-HTML aus WordPress. Quell-URLs werden mit
   `new URL()` geparst, YouTube-IDs gegen `^[\w-]{11}$`, Vimeo-IDs gegen `^\d+$` geprüft.
   Alles, was in Attribute geschrieben wird, läuft durch `escapeAttribute`. `activateEmbed`
   setzt nur `https://`-Quellen ein. Leeres oder fehlendes HTML ergibt `''`.
2. **Fehlgeschlagener Request?** Das Vorschaubild hat einen dunklen Hintergrund, fällt es
   aus, bleibt der Platzhalter bedienbar. Ein gelöschtes YouTube-Video liefert ein graues
   Ersatzbild von YouTube.
3. **Leeres Ergebnis?** Ein Beitrag ohne Einbettungen bleibt Zeichen für Zeichen unverändert.
4. **Reaktive Kette?** `content` ist ein `computed` über `post`. Das eingesetzte iframe
   ist eine DOM-Änderung innerhalb von `v-html`; Vue setzt `innerHTML` nur neu, wenn sich
   der String ändert, das iframe bleibt also stehen.
5. **Test:** `app/utils/embed-consent.spec.ts`, je Quelle ein Fall, dazu eigene Domain,
   einfache Anführungszeichen, ungültige ID, Escaping, leere Eingabe.
6. **Pre/Postconditions** für `guardEmbeds(html, options)`:
   ```
   PRE:  html ist string, undefined oder null
   POST: kein <iframe> mit fremder Quelle im Ergebnis;
         keine youtube.com/v/-Flash-Einbettung im Ergebnis
   INV:  HTML ohne fremde iframes bleibt unverändert;
         iframes der eigenen Domain bleiben unverändert
   ```
