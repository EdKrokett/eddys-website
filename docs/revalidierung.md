# Revalidierung: WordPress meldet, die Seite baut neu

Wie eine Änderung in WordPress auf eduard-andrae.de sichtbar wird, und warum sie es ohne
diesen Weg stundenlang nicht wurde. Stand: 16.09.2026.

## Das Problem

`/blog` und `/blog/**` liegen per ISR am Edge (`nuxt.config.ts`, siehe
`docs/performance.md` Schicht 4). ISR aktualisiert **auf Abruf, nicht nach Uhrzeit**:
Nach Ablauf der Frist liefert Vercel weiter die alte Fassung aus und regeneriert erst im
Hintergrund. Der Besucher, der die Regeneration anstößt, sieht noch den alten Stand; erst
der nächste sieht den neuen. Ohne Besucher passiert gar nichts.

Gemessen am 16.09.2026 an einem Beitrag mit frischen Kommentaren:

```
age: 70253          # 19,5 Stunden alt
x-vercel-cache: STALE
```

Die Seite zeigte 5 Kommentare, die API lieferte 6.

Eine kürzere TTL ist nicht die Antwort — sie ließe jeden Beitrag ständig neu bauen, um
einen Fall abzudecken, der pro Beitrag ein paar Mal im Jahr eintritt.

## Die Lösung

WordPress meldet jede Änderung aktiv an `server/api/revalidate.post.ts`. Die Route lässt
Vercel genau die betroffenen Pfade verwerfen und neu rendern, über einen `GET` mit dem
Header `x-prerender-revalidate: <bypassToken>`.

| Auslöser in WordPress | `scope` | Was neu gebaut wird |
|---|---|---|
| Kommentar kommt dazu, wird freigegeben, gelöscht, Spam | `comment` | Beitragsseite |
| Beitrag veröffentlicht, bearbeitet, zurückgezogen, gelöscht | `post` | Beitragsseite **und** Übersicht |

Der `bypassToken` wird über `nitro.vercel.config.bypassToken` gesetzt und stammt aus
`VERCEL_BYPASS_TOKEN`. Die Variable muss zur **Build-Zeit** in Vercel gesetzt sein — sie
landet in `.vercel/output/config.json`, nicht erst zur Laufzeit.

## Jede Seite liegt in zwei Fassungen am Edge

Der Punkt, der am leichtesten übersehen wird und beim ersten Bau übersehen wurde.

Eine Nuxt-Seite existiert am Edge **zweimal**:

| Pfad | Wer ihn bekommt |
|---|---|
| `/blog/mein-beitrag` | wer die URL direkt aufruft oder neu lädt |
| `/blog/mein-beitrag/_payload.json` | wer innerhalb der Seite dorthin klickt |

Beide sind eigene Cache-Einträge, und beide enthalten dieselben Daten. Nachgewiesen am
16.09.2026: Die Payload eines Beitrags enthält den kompletten Kommentarbaum samt
Autorennamen.

Wer nur das HTML revalidiert, repariert die Seite für Direktaufrufe und lässt sie für
jeden Klick aus der Übersicht veraltet — ein Fehlerbild, das ausgerechnet beim normalen
Navigieren auftritt und beim Nachprüfen per Direktaufruf verschwindet.

`server/utils/revalidate-paths.ts` erzeugt deshalb immer beide Pfade zusammen
(`postPaths`, `blogIndexPaths`).

## Warum Kommentare nicht durch `withWpCache` laufen

Vorher lag auf `blog-comments` eine TTL von 900 Sekunden. Diese Schicht **hätte den
Webhook unzuverlässig gemacht**, und zwar nicht nur verzögert:

Der Revalidate-Render ruft serverseitig `/api/blog/[slug]/comments` auf. Trifft er eine
Function-Instanz mit einem noch gültigen Eintrag, baut Vercel die Seite mit der alten
Kommentarliste neu — und diese falsche Fassung liegt danach wieder eine volle ISR-Periode
als frisch am Edge. Der Webhook hätte den Zustand zementiert statt behoben.

Ein `delete` im Handler löst das **nicht**: Der Cache ist modul-global, lebt also pro
Function-Instanz. Der Handler löscht in der Instanz, die den Webhook bearbeitet; der
Seiten-Render kann in einer anderen laufen. Der `storage`-Mount scheidet als geteilte
Schicht aus, weil das Vercel-Filesystem read-only ist (siehe `error-catalog.md`).

Der Verzicht kostet rund zwei WordPress-Anfragen pro Beitrag und Stunde. Dafür wirkt der
Webhook garantiert.

**Regel:** Was per Webhook sofort stimmen soll, darf nicht hinter einem instanzlokalen
Cache liegen.

## Die Post-ID ist der Ausweis, der Slug nur die Rückfallebene

Der Handler akzeptiert `postId` als positive Ganzzahl und fragt Slug und Status damit bei
WordPress ab. Ein aus dem Body übernommener Slug wäre ein Fremdwert, der direkt in die URL
wandert, die der Server anschließend selbst aufruft.

Für **gelöschte und zurückgezogene** Beiträge gibt es diesen Weg aber nicht: Die REST-API
antwortet dann mit 404 beziehungsweise 401, und gerade dann muss die Seite aus dem Cache.
Deshalb schickt das Plugin den Slug immer mit, und `parseWpSlug` lässt nur durch, was
`sanitize_title()` erzeugt: Kleinbuchstaben, Ziffern, Bindestrich, Unterstrich,
Prozent-Kodierung. Kein `/`, kein `.`, kein `?`, kein `:` — der Wert kann die Pfadebene
nicht verlassen.

## Warum der Webhook nicht nur an der Freigabe hängt

Naheliegend wäre, nur bei der Moderations-Freigabe zu revalidieren. Das würde die Mehrheit
der Fälle verpassen. Stand 16.09.2026 ist die Moderationswarteschlange leer
(`x-wp-total: 0` auf `?status=hold`), und bei einem frischen Beitrag standen alle sechs
Kommentare auf `approved`, ohne dass je ein Freigabeklick nötig war:

| Grund | Anteil |
|---|---|
| Eddys eigene Antworten, eingeloggt | 3 von 6 |
| Stammleser mit früher freigegebenem Kommentar | 2 von 6 |

Das Plugin hört deshalb auf `comment_post`, `transition_comment_status` und
`deleted_comment`, für Beiträge auf `transition_post_status` und `deleted_post`.

## Ein 200 ist kein Beweis

Drei verschiedene Fehlschläge antworten mit 200: ein fehlender Token, ein ignorierter
Header, ein Cache-Treffer. Der Handler prüft deshalb `x-vercel-cache` und lässt einen
`HIT` als 502 durchschlagen — ein HIT heißt, Vercel hat die gecachte Fassung ausgeliefert,
statt neu zu bauen. Genau das passierte beim ersten Testlauf, bevor der Token im Build
stand.

Erfolgssignal ist `REVALIDATED`. Ein `404` gilt als Erfolg: Bei einem gelöschten Beitrag
soll genau das in den Cache.

## Was der Webhook nicht abdeckt

Die **Startseite** lädt ihre drei jüngsten Beiträge clientseitig
(`useBlog({ limit: 3, lazy: true })`) über den CDN-Cache auf `/api/blog`. Ein neuer Beitrag
erscheint dort deshalb nach bis zu 30 Minuten (`s-maxage=1800`), nicht sofort. Das ist kein
ISR-Eintrag und mit `x-prerender-revalidate` nicht erreichbar; Vercel bietet für
header-basierte CDN-Antworten keine gezielte Invalidierung.

Ebenfalls nicht abgedeckt: Wird der **Slug eines Beitrags geändert**, bleibt die alte URL
bis zum ISR-Ablauf im Cache. Das Redirection-Plugin in WordPress legt dafür eine
Weiterleitung an, der Fall ist selten und die Folge harmlos.

## WordPress-Seite

Das Gegenstück liegt in `wordpress/eddy-comment-revalidate/` und wird als Plugin im
WP-Backend hochgeladen. Endpoint und Secret trägt man dort unter *Einstellungen →
Inhalts-Webhook* ein; nichts davon steht im Code. Installation, Fehlerbilder und
Paketbau: `wordpress/README.md`.
