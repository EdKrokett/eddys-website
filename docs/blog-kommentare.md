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
