# Blog-Kommentare: Anzeige aus WordPress

Wie die 5.190 WordPress-Kommentare auf der Nuxt-Seite erscheinen — und warum sie
anders behandelt werden als Beitragsinhalte. Stand: 30.08.2026.

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

## Grenze: 100 Kommentare pro Beitrag

`per_page=100` ist WordPress' Maximum. Beiträge darüber zeigen einen Hinweis mit Link auf
den WordPress-Beitrag. Bei durchschnittlich 21 Kommentaren pro Beitrag ist das ein
seltener Randfall — Nachladen wäre Aufwand ohne realen Nutzen.

## Neue Kommentare schreiben: geht (noch) nicht

Gemessen am 30.08.2026:

```
POST /wp-json/wp/v2/comments  →  401 rest_comment_login_required
```

WordPress verbietet anonyme Kommentare über die REST-API per Default. Die Anzeige ist
deshalb bewusst **nur lesend**. Unter jedem Kommentarbereich steht ein Link auf den
WordPress-Beitrag, wo das native Formular funktioniert — kein toter Weg für den Leser.

Was ein Schreibpfad zusätzlich bräuchte, siehe `docs/known-debt.md` KD-005.

## Wann ein neuer Kommentar auf der Seite erscheint (16.09.2026)

Ohne Zutun: **frühestens nach einer Stunde, praktisch deutlich später.** Gemessen am
16.09.2026 an `/blog/projekt-marathon-mit-60-warum-es-in-bremen-der-halbe-wurde`:

```
age: 70253          # 19,5 Stunden alt
x-vercel-cache: STALE
```

Die Seite zeigte 5 Kommentare, die API lieferte 6. Grund ist die Kette aus
`docs/performance.md`, Schicht 4: `'/blog/**': { isr: 3600 }` hält das HTML eine Stunde
als frisch, danach liefert Vercel weiter die alte Fassung aus und regeneriert erst im
Hintergrund. Der Besucher, der die Regeneration anstößt, sieht noch die alte Zahl; erst
der nächste sieht die neue. ISR arbeitet **auf Abruf, nicht nach Uhrzeit** — ohne
Besucher passiert gar nichts.

### Die Lösung: WordPress meldet sich, statt dass die Seite wartet

`server/api/revalidate-comments.post.ts` nimmt einen Webhook aus WordPress entgegen und
lässt genau die betroffene Beitragsseite sofort neu bauen. Ablauf:

1. WordPress feuert bei `comment_post` und `transition_comment_status`.
2. Der Handler prüft das Shared Secret, holt sich den Slug **selbst** bei WordPress
   (siehe unten) und schickt einen `GET` auf `/blog/<slug>` mit dem Header
   `x-prerender-revalidate: <bypassToken>`.
3. Vercel verwirft den Edge-Eintrag und rendert frisch. Der nächste Besucher, egal wann
   er kommt, sieht die richtige Zahl.

Der `bypassToken` wird über `nitro.vercel.config.bypassToken` in `nuxt.config.ts` gesetzt
und stammt aus `VERCEL_BYPASS_TOKEN`. Die Variable muss zur **Build-Zeit** in Vercel
gesetzt sein — sie landet in `.vercel/output/config.json`, nicht erst zur Laufzeit.

### Warum der Webhook auf `comment_post` hört und nicht nur auf die Freigabe

Naheliegend wäre, nur bei der Moderations-Freigabe zu revalidieren. Das würde die
Mehrheit der Fälle verpassen. Stand 16.09.2026 ist die Moderationswarteschlange leer
(`x-wp-total: 0` auf `?status=hold`), und bei dem oben genannten Beitrag stehen alle
sechs Kommentare auf `approved`, ohne dass je ein Freigabeklick nötig war:

| Grund | Beispiel |
|---|---|
| Eddys eigene Antworten, eingeloggt | 3 von 6 Kommentaren |
| Stammleser mit früher freigegebenem Kommentar | Martin, Reinhard |

`transition_comment_status` deckt zusätzlich Löschen und Spam-Markieren ab — auch dann
muss die Seite neu gebaut werden, sonst bleibt ein entfernter Kommentar sichtbar.

### Warum Kommentare nicht mehr durch `withWpCache` laufen

Vorher lag auf `blog-comments` eine TTL von 900 Sekunden. Diese Schicht **hätte den
Webhook unzuverlässig gemacht**, und zwar nicht nur verzögert:

Der Revalidate-Render ruft serverseitig `/api/blog/[slug]/comments` auf. Trifft er eine
Function-Instanz mit einem noch gültigen Eintrag, baut Vercel die Seite mit der alten
Kommentarliste neu — und diese falsche Fassung liegt danach wieder eine volle Stunde als
frisch am Edge. Der Webhook hätte den Zustand zementiert statt behoben.

Ein `delete` im Handler löst das **nicht**: Der Cache ist modul-global, lebt also pro
Function-Instanz. Der Handler löscht in der Instanz, die den Webhook bearbeitet; der
Seiten-Render kann in einer anderen laufen. Der `storage`-Mount scheidet als geteilte
Schicht aus, weil das Vercel-Filesystem read-only ist (siehe `error-catalog.md`).

Der Verzicht kostet fast nichts: Der SSR-Pfad ist durch ISR gedeckt, der Client-Pfad
durch den CDN-Cache auf `/api/blog/**` (`s-maxage=3600`). Übrig bleiben rund zwei
WordPress-Anfragen pro Beitrag und Stunde. Dafür wirkt der Webhook garantiert.

**Regel:** Was per Webhook sofort stimmen soll, darf nicht hinter einem instanzlokalen
Cache liegen.

### Der Slug kommt aus WordPress, nicht aus dem Webhook

Der Handler akzeptiert nur `postId` als positive Ganzzahl und fragt den Slug damit bei
WordPress ab. Ein aus dem Body übernommener Slug wäre ein Fremdwert, der direkt in eine
URL wandert. Nebeneffekt: Der Handler merkt dabei, ob der Beitrag überhaupt `publish`
ist, und antwortet sonst mit 409, statt eine nicht existierende Seite zu revalidieren.

### WordPress-Seite

Das Gegenstück liegt in `wordpress/eddy-comment-revalidate/` und wird als Plugin im
WP-Backend hochgeladen. Endpoint und Secret trägt man dort unter *Einstellungen →
Kommentar-Webhook* ein; nichts davon steht im Code.
