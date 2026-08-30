# Über mich: Kapitelmodell, Scrollspy und Jahresachse

Stand 30.08.2026. Beschreibt, wie `app/pages/ueber-mich.vue` navigierbar gemacht wurde.

## Problem

Die Seite ist die inhaltsreichste der Site und lief als ein einziger, undurchbrochener
Scroll: Intro → Werdegang (8 Stationen mit voller Beschreibung, ~3 Bildschirme) →
Kompetenzen + Datenblatt → Projekte → Outro. Wer oben ankam, sah nicht, was noch kommt; wer
in der Mitte war, wusste nicht, wo er ist. Eddys Formulierung: „eine lange Tapete".

## Kapitelmodell

Die Seite hat **vier** benannte Kapitel — die Vierteilung stammt aus Eddys eigener Anfrage:

| ID           | Titel             | Inhalt                                     |
| ------------ | ----------------- | ------------------------------------------ |
| `werdegang`  | Werdegang         | `CV_STATIONS`                              |
| `kompetenzen`| Was ich kann      | `CV_SKILL_GROUPS`                          |
| `datenblatt` | Datenblatt        | `CV_CERTIFICATES`, `CV_EDUCATION`, `CV_LANGUAGES` |
| `projekte`   | Was ich gebaut habe | `CV_PROJECTS`                            |

Das Datenblatt saß vorher **innerhalb** der Kompetenzen-Sektion. Es ist herausgelöst worden,
weil es sonst kein eigenes Kapitel sein kann — und weil Zertifikate, Ausbildung und Sprachen
inhaltlich Nachweise sind, keine Selbsteinschätzungen.

Die Kapiteldaten (`CV_CHAPTERS`) entstehen in der Seite als `computed` aus den Datenlängen.
Die Metriken („8 Stationen", „5 Projekte") sind deshalb **nie** von Hand gezählt — sonst
veralten sie beim nächsten Eintrag in `app/utils/cv.ts` still.

## Zwei Darstellungen desselben Modells

- `CvChapters.vue` — die Übersicht direkt nach dem Intro. Vier Kacheln im Haarlinien-Raster,
  reine Anker-Links, kein JavaScript. Beantwortet „was kommt noch?".
- `CvChapterBar.vue` — die Sticky-Leiste unter dem Header. Beantwortet „wo bin ich?".

Die Leiste klebt bei `top: 4rem`, direkt unter dem `h-16`-Header aus `Header.vue`, mit
`z-index` unter dessen 50. Ändert sich die Headerhöhe, muss beides mitwandern: die
`top`-Position der Leiste und das `scroll-margin-top` der Sektionen.

### Warum die Leiste ohne eigenen Sentinel auskommt

Sie wird eingeblendet, sobald `activeId` gesetzt ist. `activeId` wird gesetzt, sobald die
erste Kapitel-Sektion das Aktivierungsband am oberen Rand erreicht — also genau dann, wenn
die Übersicht nach oben herausgescrollt ist. Ein zusätzliches Beobachtungselement für „Intro
vorbei" wäre eine zweite Wahrheit über denselben Zustand.

Beim Zurückscrollen bleibt `activeId` gesetzt (Regel 2 unten), die Leiste also „an". Sie
verschwindet trotzdem aus dem Blick, weil sie ihre Ruheposition am Ende des Intros hat und
mit dem Inhalt nach unten wandert — sichtbar ist sie dort nur in dem schmalen Fenster, in
dem sie noch nicht wieder angedockt ist, und liest sich als beschrifteter Sektionstrenner.

### Lesefortschritt

Der Balken in der Leiste ist reines CSS über `animation-timeline: scroll(root block)` — kein
Scroll-Listener, kein Layout-Thrashing, gleiche Bauart wie die `reveal`-Utility in
`main.css`. Firefox kann das (Stand 2026) nicht: dort fehlt schlicht der Balken, alles andere
funktioniert. Das ist der akzeptierte Ausfall, nicht ein zu behebender Fehler.

## Scrollspy

`app/composables/useScrollSpy.ts` ist ein dünner IntersectionObserver-Wrapper. Die
Entscheidungslogik liegt bewusst daneben als pure Funktion in `app/utils/scroll-spy.ts`
(`pickActiveChapter`), damit sie ohne DOM-Umgebung testbar ist — `vitest.config.ts` läuft
im Node-Environment, ohne `happy-dom`.

Zwei Regeln in `pickActiveChapter`:

1. **Erste sichtbare ID in Dokumentreihenfolge** gewinnt, nicht die zuletzt gemeldete. Die
   Reihenfolge der IntersectionObserver-Callbacks ist keine Dokumentreihenfolge.
2. **Ist nichts sichtbar, bleibt der vorige Wert stehen.** Ohne diese Regel flackert die
   Markierung an jeder Sektionsgrenze und verschwindet im Outro ganz.

## Werdegang: aufklappbare Stationen

Alle 8 Stationen bleiben als kompakte Zeilen sichtbar (Zeitraum · Dauer · Rolle · Firma ·
Ort); die Beschreibungen klappen auf Klick auf. Die laufenden Stationen sind offen
vorbelegt, dazu gibt es „Alle aufklappen".

Bewusst **kein** `<details>`/`<summary>`: dessen Inhalt lässt sich weder sauber animieren
noch zuverlässig ausdrucken. Stattdessen `<button aria-expanded aria-controls>` plus ein
Panel mit `grid-template-rows: 0fr → 1fr`. Der Text steht damit **immer** im DOM — für
Suchmaschinen, Vorlesesoftware und den Druck ändert sich gegenüber vorher nichts.

Bewusst **verworfen**: „nur die 4 jüngsten Stationen zeigen, Rest nachladen". Das hätte
ausgerechnet den Uhrmacher versteckt — den roten Faden der ganzen Seite.

## Jahresachse

`CvYearAxis.vue` zeichnet 1991—heute als Chronografen-Skala: Jahres-Ticks (Haupt-Tick alle
5 Jahre, wie die Indexe auf dem Zifferblatt im Intro), Stationen als Balken. Klick auf einen
Balken scrollt zur Station **und** klappt sie auf.

### Spuren statt einer Reihe

Die Stationen **überlappen**: trusted blogs läuft seit 2016, team neusta seit 2018, und
2015—2016 lief die Product-Owner-Station parallel zum Aufbau. In einer Reihe würden sie sich
überzeichnen. `buildAxisModel` in `app/utils/cv-axis.ts` verteilt sie deshalb per
Greedy-First-Fit auf Spuren: jede Station kommt in die erste Spur, deren letzter Balken
**spätestens am Startjahr** endet.

Das `<=` ist die entscheidende Stelle. Mit `<` gälte jede nahtlose Übergabe (1991—1999 →
1999—2006) als Überlappung, und die sequenziellen Stationen würden über die ganze Achse
zwischen zwei Spuren zickzacken — an den echten Daten nachgerechnet. So bleibt der
Werdegang eine durchgehende Linie in Spur 0, und nur die eine echte Parallel-Station
(team neusta seit 2018 neben trusted blogs seit 2016) rückt nach unten. Die Komponente
rechnet ihre Höhe aus der tatsächlichen Spurenzahl, damit eine dritte Parallel-Station in
Zukunft nicht aus dem Rahmen fällt.

### Endjahre gehören ins Datenmodell

`CvStation.endYear` ist ergänzt worden, statt das Ende aus der Folgestation abzuleiten.
Ableiten wäre bei überlappenden Stationen schlicht falsch. `endYear: undefined` heißt
„läuft" und ist die einzige Quelle für die laufend-Markierung auf der Achse.

## Referenzjahr: nur über `useState`

Dauer („10 Jahre") und das Achsenende hängen am aktuellen Jahr. Es wird **einmal** in der
Seite über `useState('cv-year', () => new Date().getFullYear())` bestimmt. `useState`
serialisiert den Serverwert in den Payload; der Client übernimmt ihn, statt neu zu rechnen.

Ein direktes `new Date().getFullYear()` im Template wäre über den Jahreswechsel ein
Hydration-Mismatch — derselbe Fehlertyp, an dem auf dieser Seite schon die Uhrzeiger
gescheitert sind (Kommentar in `ueber-mich.vue`, Eintrag in `docs/error-catalog.md`).

## Druck

Der Lebenslauf ist die Seite, die jemand ausdruckt. Der Print-Block in `main.css` erzwingt
deshalb `grid-template-rows: 1fr` auf allen Panels und blendet Sticky-Leiste und Achse aus.
Ohne die erste Regel käme der Werdegang ohne Beschreibungen aus dem Drucker.

## Bewusst nicht gebaut

- **Three.js** (Eddys Vorschlag, 30.08.2026). ~150 KB gzip Runtime, nicht SSR-fest, und es
  bricht das Prinzip, das die ganze Seite trägt: Das Zifferblatt im Intro ist reines SVG,
  ohne Netzwerk-Request. Vor allem löst 3D das benannte Problem — die Länge — nicht.
- **Skills-Vollprofil** (~70 Einzelbewertungen aus `docs/content-sammlung.md` per Umschalter).
  Von Eddy in derselben Rückfrage abgewählt. Die Rohdaten liegen weiter dort bereit.
- **Druck-Button, Fakten-Hover-Details.** Ebenfalls abgewählt.
