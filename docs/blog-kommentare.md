# Blog-Kommentare: Anzeige aus WordPress

Wie die 5.190 WordPress-Kommentare auf der Nuxt-Seite erscheinen — und warum sie
anders behandelt werden als Beitragsinhalte. Stand: 22.11.2026.

## Warum Kommentare NICHT wie Beitragsinhalte behandelt werden

`app/pages/blog/[slug].vue` rendert `post.content` bewusst per `v-html`: dieser Inhalt
stammt aus Eddys eigener, vertrauter WordPress-Instanz.

**Für Kommentare gilt das ausdrücklich nicht.** Sie stammen von beliebigen Besuchern.
WordPress filtert beim Speichern zwar per `wp_filter_kses`, aber diese Garantie hängt an
fremder Konfiguration (Plugins, Filter, ältere WP-Versionen) — darauf baut diese Seite
keine XSS-Sicherheit auf.

Messung vom 30.08.2026 über 100 Kommentare — welches Markup real vorkommt:

| Tag | Vorkommen |
|---|---|
| `<p>` | 216 |
| `<br>` | 51 |
| `<a>` | 4 |
| `<strong>` | 1 |

Praktisch nur Absätze und Zeilenumbrüche. Deshalb die Entscheidung:
**serverseitig zu Klartext-Absätzen umwandeln, im Template per `v-text` rendern.**
Kein `v-html` auf Fremdtext, keine Sanitizer-Abhängigkeit, kein Restrisiko. Der Preis
sind 4 nicht mehr klickbare Links pro 100 Kommentare — die URL bleibt als Text lesbar.

`shared/utils/comment-text.ts` erledigt das: `<script>`/`<style>` samt Inhalt raus,
`<br>` → Zeilenumbruch, `</p>` → Absatzgrenze, alle übrigen Tags entfernen, **danach**
Entities dekodieren (Reihenfolge ist entscheidend: sonst würde ein dekodiertes
`&lt;b&gt;` erneut als Tag gelesen).

## Threading

27 von 50 Kommentaren sind Antworten (`parent != 0`) — Eddy antwortet seinen Lesern
regelmäßig. Eine flache Liste würde diesen Dialog zerstören, deshalb baut
`shared/utils/comment-threads.ts` einen Baum.

Zwei Invarianten, die dort getestet sind:

1. **Waisen gehen nicht verloren.** Zeigt ein `parent` auf einen Kommentar, der nicht in
   der Antwort steckt (WP-Pagination, gelöschter Elternkommentar), wird der Kommentar zur
   Wurzel — nicht verworfen.
2. **Zyklen hängen die Seite nicht auf.** Vor jedem Einhängen wird geprüft, ob der
   angebliche Elternteil bereits ein Nachfahre ist.

## Autoren-Kennzeichnung: bewusst konservativ

Eddys eigene Antworten stehen in der Datenbank in zwei Varianten: 18× mit `author: 21`
(eingeloggt) und 28× mit `author: 0` (als Gast kommentiert, gleicher Anzeigename).

Gekennzeichnet wird **nur `author !== 0`** — also der nachweislich eingeloggte
Seiten-Benutzer. Über den Anzeigenamen zu raten wäre falsch: jeder Gast kann "Eddy"
eintippen. Lieber ein paar Antworten ohne Abzeichen als eine falsche Urheber-Behauptung.

## Keine Gravatare

Die WP-API liefert `author_avatar_urls` (Gravatar). Bewusst ungenutzt: Gravatar-Abrufe
übertragen die IP jedes Besuchers an Automattic (US) und wären ein eigener Punkt in der
Datenschutzerklärung. Stattdessen ein Monogramm aus dem Anfangsbuchstaben auf
Indexraster — passt zum Präzisionswerk-Motiv und kostet keinen externen Request.

## Grenze: 500 Kommentare pro Beitrag

`per_page=100` ist WordPress' Maximum pro Anfrage. Die Route
`server/api/blog/[slug]/comments.get.ts` blättert deshalb weiter, bis eine Seite nicht mehr
voll ist, höchstens fünf Seiten. Erst darüber erscheint ein Hinweis, dass nicht alle
Kommentare geladen sind. Bei durchschnittlich 21 Kommentaren pro Beitrag ist das ein
theoretischer Fall.

Bis 22.11.2026 lag die Grenze bei 100, mit einem Link „Alle im Blog lesen“ auf den
WordPress-Beitrag. Den gibt es seit der Headless-Umstellung nicht mehr (siehe unten).

## Neue Kommentare schreiben (seit 22.11.2026)

Unter den Kommentaren steht ein eigenes Formular (`app/components/BlogCommentForm.vue`).
„Antworten“ an jedem Kommentar öffnet dasselbe Formular mit gesetztem Elternkommentar.

### Warum es das Formular gibt

Bis 22.11.2026 führte die Schaltfläche „Kommentar schreiben“ auf das Formular im
WordPress-Beitrag (`blog.eduard-andrae.de/<slug>/#respond`). Seit der Headless-Umstellung am
13.11.2026 leitet genau diese Adresse per 301 zurück auf die Nuxt-Seite. Neun Tage lang
konnte niemand kommentieren (`docs/error-catalog.md`).

### Weg eines Kommentars

```
Browser  ──POST JSON──▶  blog.eduard-andrae.de/wp-json/eddy-headless/v1/kommentare
                         (Plugin eddy-headless-redirect ab 1.3.0)
                         └─ wp_handle_comment_submission()   ← derselbe Kern-Weg wie
                            └─ Akismet, Flood-/Duplikatprüfung,   wp-comments-post.php
                               Moderation, Benachrichtigungsmail,
                               Haken comment_post → Inhalts-Webhook → Seite neu gebaut
```

Drei Entscheidungen dahinter:

1. **Der Browser sendet direkt an WordPress, nicht über eine Nitro-Route.** Akismet und die
   Flood-Prüfung von WordPress arbeiten mit der IP-Adresse des Absenders. Hinter einer
   Nitro-Route sähen sie nur Vercel-Adressen aus dem Rechenzentrum. Die REST-API von
   WordPress beantwortet CORS-Anfragen von jeder Herkunft (gemessen 22.11.2026: Preflight
   200, `Access-Control-Allow-Origin` spiegelt die Herkunft). Cookies gehen nicht mit
   (`credentials: 'omit'`), der Absender ist für WordPress immer ein Gast.
2. **Eigene Route statt `POST /wp/v2/comments`.** Die Kern-Route lehnt Gäste ab
   (`401 rest_comment_login_required`). Der Filter `rest_allow_anonymous_comments` würde sie
   öffnen, aber sie speichert über `wp_insert_comment()` und löst den Haken `comment_post`
   nicht aus. An dem hängen die Benachrichtigungsmails von WordPress und der Inhalts-Webhook
   (`wordpress/eddy-comment-revalidate/`). Die eigene Route ruft
   `wp_handle_comment_submission()` auf, also genau das, was das alte Formular tat.
3. **Kein neues Einfallstor.** `wp-comments-post.php` nimmt Gast-Kommentare seit jeher von
   jedem an. Die neue Route macht dasselbe mit JSON-Antwort, mit denselben Prüfungen davor.

### Was das Formular vor dem Senden tut (`shared/utils/comment-submit.ts`)

- Pflichtfelder Kommentar und Name prüfen. E-Mail und „Blog oder Website“ sind freiwillig
  (siehe unten); die Website bekommt `https://` vorangestellt, wenn das Schema fehlt. Nur
  http(s). Eine angegebene E-Mail-Adresse wird auf ihre Form geprüft.
- **Zeichen außerhalb der BMP (Emojis) als HTML-Entity kodieren** (`😄` → `&#x1f604;`).
  WordPress speichert 4-Byte-Zeichen hier nicht: `POST /wp/v2/comments` mit echtem Emoji
  endete am 12.11.2026 mit `500 rest_comment_failed_create`. Die Anzeige dekodiert Entities
  ohnehin (`comment-text.ts`).
- Längen gegen die Spaltengrenzen von WordPress prüfen (Name 245, E-Mail 100, Website 200,
  Text 65.525), und zwar NACH dem Kodieren.

### Pflicht sind nur Kommentar und Name (Eddy, 22.11.2026)

Die E-Mail-Adresse ist freiwillig. Drei Gründe:

- WordPress verlangt sie hier ohnehin nicht (nächster Absatz), die Pflicht galt nur im
  Formular.
- Sie wird nie angezeigt und nicht für Benachrichtigungen an den Kommentator benutzt. Eine
  Angabe zu erzwingen, die die Seite nicht braucht, widerspricht der Datensparsamkeit
  (Art. 5 Abs. 1 lit. c DSGVO).
- Wer nur wegen der Adresse nicht kommentiert, fehlt im Gespräch.

Was ohne Adresse wegfällt: Eddy kann dem Kommentator nicht privat antworten, und Akismet
hat ein Merkmal weniger. Wird in WordPress später „Der Autor muss bereits einen
freigegebenen Kommentar geschrieben haben“ eingeschaltet, erkennt WordPress Stammleser am
Paar aus Name und E-Mail; Kommentare ohne Adresse landen dann immer in der Moderation.

Das Feld „Blog oder Website“ war von Anfang an freiwillig. Ist es ausgefüllt, wird der Name
über dem Kommentar zum Link (`BlogCommentItem.vue`, nur http(s), `rel="nofollow ugc"`).

### WordPress-Einstellungen dahinter (gemessen 22.11.2026)

Auf blog.eduard-andrae.de ist die Einstellung „Benutzer müssen zum Kommentieren Name und
E-Mail-Adresse angeben“ **aus**, und Gast-Kommentare erscheinen ohne Moderation: Ein
`POST` an die Route mit nichts als Beitrags-ID und dem Text „x“ kam als
`201 {"status":"approved"}` zurück und stand sofort öffentlich am Beitrag (Kommentar 140800,
unbeabsichtigt angelegt und gleich wieder gelöscht).

Den Namen verlangt also nur das Formular, nicht die Route: Wer direkt an WordPress sendet,
kann ohne Namen kommentieren, so wie schon immer über `wp-comments-post.php`. Die
WordPress-Einstellung kennt nur „Name UND E-Mail“ als Paar. Wird sie eingeschaltet, lehnt
WordPress Kommentare ohne E-Mail ab (`require_name_email`), und das Formular müsste die
Adresse wieder zur Pflicht machen.

**Folge für Prüfungen:** Die Route nie mit einer Eingabe testen, deren Ablehnung von einer
WordPress-Einstellung abhängt. Gefahrlos sind nur Eingaben, die schon am Schema scheitern
(`{}`), ein Text aus Leerzeichen (`require_valid_comment`) oder eine Beitrags-ID, die es
nicht gibt.

### Was Akismet über einen Kommentar erfährt (Plugin 1.3.1, 28.11.2026)

Die ersten beiden Kommentare aus dem Formular landeten im Spam: ein Testkommentar am
22.11.2026 und Eddys eigener am 28.11.2026 („ist nirgendwo angekommen“). Grund laut
Akismet-Quelltext (`class.akismet.php`, `auto_check_comment`, Version 5.7.2): Akismet
erkennt das Formular des Themes an Merkmalen, die es dort selbst einbaut, und über die
Route fehlten alle.

| Merkmal | Altes WordPress-Formular | Route bis 1.3.0 | Route ab 1.3.1 |
|---|---|---|---|
| `akismet_comment_nonce` | `passed` (verstecktes Feld) | `failed`, weil `$_POST` leer ist | `inactive` (Filter `akismet_comment_nonce`, nur während der Route) |
| `POST_ak_js` (Zeitstempel, per JavaScript gesetzt) | vorhanden | fehlt | Öffnungszeitpunkt des Formulars (`form_opened_at`) |
| `referrer` | Adresse des Beitrags | `https://eduard-andrae.de/` (vom Browser gekürzt) | volle Adresse des Beitrags (`referrerPolicy` im `$fetch`) |
| `permalink` | Adresse des Beitrags | `blog.eduard-andrae.de/<slug>/`, also andere Domain als `referrer` | `https://eduard-andrae.de/blog/<slug>` (Filter `akismet_request_args`) |
| Tippverhalten (`ak_bkp`, `ak_bmc`, … aus `akismet-frontend.js`) | vorhanden | fehlt | fehlt weiterhin, bewusst |

„Nonce fehlgeschlagen, kein JavaScript, verweisende Seite auf fremder Domain“ ist das
Profil eines Skripts, das direkt an WordPress sendet. Alle Angaben ab 1.3.1 sind wahr: Einen
Nonce gibt es auf diesem Weg nicht, die öffentliche Adresse liegt auf `eduard-andrae.de`,
und den Zeitstempel setzt das Formular wirklich im Browser. Das Tippverhalten nachzubauen
hieße, ein internes Akismet-Protokoll zu kopieren und Verhaltensdaten zu erheben; das
bleibt weg.

Ob das reicht, entscheidet Akismets Dienst, und der nennt keine Gründe. Auch der Inhalt
zählt: Eddys Testkommentar hieß „WTF ?!?!“ von „Anonymus“ ohne E-Mail. Deshalb zusätzlich:

**Sicherheitsnetz:** Landet ein Kommentar aus dem Formular im Spam, schickt das Plugin eine
Mail an den Autor des Beitrags (höchstens 20 am Tag). WordPress selbst benachrichtigt bei
Spam niemanden, und der Absender sieht nur „wartet auf Freigabe“. Der Kommentar bleibt im
Spam-Ordner: Erst der Klick auf „Kein Spam“ meldet Akismet den Irrtum (`submit-ham`), und
daraus lernt der Filter für diese Seite. Spam über `wp-comments-post.php` bleibt stumm wie
bisher.

### Nach dem Senden

WordPress antwortet mit `{ id, status }`. `approved` heißt sofort öffentlich; alles andere
(Moderation, Spamverdacht) zeigt die Seite einheitlich als „wartet auf Freigabe“. Ein
Spamverdacht wird dem Absender bewusst nicht mitgeteilt.

Die Seite zeigt den eigenen Kommentar sofort als Prüfschein an, gerendert aus der Eingabe
per `v-text`. Sie lädt die Kommentarliste **nicht** neu: `/api/blog/**` liegt mit
`s-maxage` am CDN und käme veraltet zurück. Für alle sichtbar wird ein freigegebener
Kommentar, sobald der Inhalts-Webhook die Seite neu gebaut hat (Sekunden).

Fehler erkennt die Seite am `code` der WordPress-Antwort und übersetzt ihn selbst
(`commentErrorMessage`), der Meldungstext aus WordPress wird nicht angezeigt. `409
comment_duplicate` meldet sie als „ist bereits eingegangen“: Das ist auch die Antwort, wenn
nach einem Timeout ein zweites Mal gesendet wird.

Es wird nichts im Browser gespeichert (kein Cookie, kein localStorage für Name und E-Mail).
Die Datenschutzerklärung hat einen eigenen Abschnitt „Kommentare“.

### Reihenfolge beim Ausrollen

Für 1.3.1 ist die Reihenfolge egal: Das Plugin ignoriert ein fehlendes `form_opened_at`,
und Plugin 1.3.0 ignoriert das zusätzliche Feld. Für die Ersteinrichtung gilt:
Erst das Plugin (ab 1.3.0) in WordPress einspielen, dann die Nuxt-Seite deployen. Ohne das
Plugin antwortet WordPress mit `404 rest_no_route`; das Formular meldet dann „Kommentieren
ist gerade nicht möglich“.

## Wann ein neuer Kommentar auf der Seite erscheint (16.09.2026)

Sofort — weil WordPress die Änderung aktiv meldet und die Beitragsseite daraufhin neu
gebaut wird. Ohne diesen Weg dauerte es bis zu 19,5 Stunden, gemessen am 16.09.2026.

Zwei Dinge, die den Kommentarbereich davon betreffen:

- Kommentare laufen bewusst **nicht** durch `withWpCache`. Ein Eintrag dort hätte die
  Revalidierung ausgehebelt und den alten Stand für eine weitere ISR-Periode
  festgeschrieben.
- Die Payload-Datei eines Beitrags (`/blog/<slug>/_payload.json`) enthält den kompletten
  Kommentarbaum und ist ein eigener Cache-Eintrag. Sie muss mitrevalidiert werden, sonst
  bleibt sie für jeden veraltet, der aus der Übersicht auf den Beitrag klickt.

- Bis 28.11.2026 konnte ein neuer Kommentar nach dem Neuladen wieder verschwinden: Nuxts
  eigener Payload-Speicher lieferte dem Webhook eine alte Fassung. Seitdem abgeschaltet.

Vollständige Herleitung, Auslöser und Fehlerbilder: `docs/revalidierung.md`.
