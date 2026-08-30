# Audit-Perspektiven

Spezifische Fragen für Code-Reviews und Audits. Jede Perspektive beleuchtet einen anderen blinden Fleck. „Prüfe auf Fehler" findet nach Runde 3 nichts. Eine SPEZIFISCHE Frage findet in Runde 5 noch Bugs.

**Pflicht:** Bei jedem Bugfix (siehe `error-catalog.md`) eine neue Perspektive ableiten.
**Anwendung:** Pro Review EINE Perspektive wählen und konsequent durchziehen, nicht alle auf einmal.

---

## Baseline-Perspektiven (allgemeine Best Practices)

### Datenintegrität

- Kann ein Wert von der WordPress-API `null`/`undefined`/leerer String sein, wo der Code einen Wert annimmt?
- Ist das gecachte Ergebnis (`wpCache.ts`) noch konsistent mit dem, was WordPress gerade liefert, oder zeigt die Seite veraltete Inhalte, wo Frische erwartet wird?

### Fehlerbehandlung

- Wird der Fehlerfall **sichtbar**? Oder wird er stillschweigend verschluckt?
- Was passiert, wenn `eduard-andrae.de` nicht erreichbar ist oder einen unerwarteten Status liefert?
- Gibt es ein `try/catch` das zu breit fängt?

### Tests

- Können Test-Assertions **falsch-positiv matchen**? (`assert result` statt eines konkreten Werts)
- Gibt es einen Testfall mit Sonderzeichen, der die echte Welt simuliert? (`Ö`, `<script>`, `"`)

### Optik/Design

- Ist die Umsetzung noch die BOLD-Aussage aus der Design-Entscheidung, oder ist sie im Weg des geringsten Widerstands in Richtung generischer Nuxt-UI-Defaults zurückgerutscht?
- Funktioniert die Seite auch ohne JavaScript-Hydration (Loading-Flash, Layout-Shift)?

---

## Projektspezifische Perspektiven

### SSR/Hydration (abgeleitet 2026-08-26)

- Liest dieser Code `useFetch`-Daten zu einem Zeitpunkt, zu dem sie noch der Default sein
  können? Watcher mit `immediate: true` und Code direkt nach dem `useFetch`-Aufruf laufen
  serverseitig **vor** dem Auflösen — abgeleitete Werte gehören in ein `computed`.
- Kann eine Bedingung im Template auf Server und Client zu unterschiedlichen Zweigen führen?
  (Zeit, Zufall, Reihenfolge von Effekten, Locale-abhängige Formatierung.)

### Duplizierte Wahrheit (abgeleitet 2026-08-26)

- Dupliziert diese Liste/Konstante Wissen, das das Framework oder eine andere Quelle schon
  hat? Handgepflegte Routen-, Feld- oder Seiten-Listen laufen dem Original zwangsläufig
  hinterher — gibt es einen Mechanismus, der dieselbe Information aus erster Hand liefert?

### Migration & Altbestand (abgeleitet 2026-08-26)

- Welche Daten wurden VOR einer Umstellung erzeugt und tragen den alten Zustand noch in sich?
  Konfigurationsänderungen (WP_HOME, Env-Vars, Feature-Flags) wirken meist nur auf **neu**
  erzeugte Inhalte, nicht rückwirkend auf gespeicherte.
- Was an dieser Änderung funktioniert nur deshalb, weil eine Übergangslösung (Redirect,
  Alias, Weiterleitung) noch aktiv ist — und bricht, sobald sie abgeschaltet wird?

### Styling-Kollisionen (abgeleitet 2026-08-26)

- Setzt eine Scoped-Regel dieselbe CSS-Property wie eine Tailwind-Utility am selben Element?
  Bei gleicher Spezifität gewinnt das später eingebundene Stylesheet — Scoped Styles schlagen
  Utilities, responsive Utility-Präfixe wirken dann nicht mehr.
- Welche CSS-Klassen liefert eine Fremdquelle (WordPress-Blöcke, eingebettete Widgets) mit,
  für die wir keine Regeln definiert haben? Fehlendes Layout-CSS sieht aus wie ein Bug im
  Inhalt, nicht wie eine Lücke im Stylesheet.

### Farbe & Kontrast (abgeleitet 2026-08-26)

- Ist der Kontrast jeder Farbkombination nachgerechnet statt geschätzt? WCAG AA verlangt
  4,5:1 für Fließtext und 3:1 für große Schrift. Besonders prüfen: Akzentfarben auf dunklem
  Grund und Text auf farbigen Flächen — weiße Schrift auf einer mittelhellen Fläche ist
  fast immer zu schwach.
- Wird eine Farbe, die nur als Dekoration gedacht war, irgendwo doch für kleine Schrift
  verwendet (Meta-Zeilen, Labels, Zeitangaben)?

### Effekte ohne Scroll-Kontext (abgeleitet 2026-08-26)

- Was passiert mit diesem Effekt, wenn nicht gescrollt werden kann — Druckansicht,
  Vollseiten-Screenshot, Reader-Modus, sehr hohes Viewport?
- Startet eine Animation bei `opacity: 0` oder `visibility: hidden`? Dann ist der
  Ausfallmodus „Inhalt komplett unsichtbar" — gibt es einen Reset, der das auffängt?

### Animation & Transformationen (abgeleitet 2026-08-26)

- Ist bei einer Rotation der Drehpunkt **gemessen** worden, oder wurde nur das Standbild
  betrachtet? Ein falscher `transform-origin` sieht im ersten Frame korrekt aus und fällt
  erst im Lauf auf. Prüfmethode: Bounding-Box-Mittelpunkt des bewegten Elements über
  mehrere Zeitpunkte protokollieren und gegen den erwarteten Drehpunkt halten.
- Bei SVG: Stimmt das Zusammenspiel aus `transform-box` und `transform-origin`?
  Prozentwerte beziehen sich auf die GRÖSSE der viewBox, wirken aber im
  Nutzerkoordinatensystem — bei einer auf `0 0` zentrierten viewBox ist `center` falsch.
- Verdeckt ein anderes Element den bewegten Teil? Eine Animation, die hinter einem Bild
  läuft, ist genauso kaputt wie eine, die gar nicht läuft.

### Caching & Laufzeitumgebung (abgeleitet 2026-08-27)

- Überlebt die Cache-Schicht den Prozess, der sie hält? Ein modul-globaler In-Memory-Cache
  ist auf Serverless nach jedem Cold Start leer — er verdeckt das Problem im Test (warm)
  und zeigt es im Betrieb (kalt). Prüfmethode: `x-vercel-cache` und die Streuung der TTFB
  über mehrere Aufrufe ansehen, nicht den Mittelwert.
- Ist der kalte Pfad **wirklich kalt** gemessen worden? Ein Cache-Buster als Query-Parameter
  wirkt nur, wenn er auch im Cache-Key landet. Bei `withWpCache` besteht der Key aus
  `limit`/`page` — jeder andere Parameter wird ignoriert und die Messung ist stillschweigend
  warm. Prüfmethode: einen bis dahin unbenutzten Wert der schlüsselbildenden Parameter nehmen.
- Wo läuft die Function geografisch, gemessen an ihrem Origin? `x-vercel-id: fra1::iad1::…`
  heißt Edge in Frankfurt, Ausführung in US-Ost. Liegt die Datenquelle in Europa, kostet
  jeder Cache-Miss zwei Atlantiküberquerungen.
- Fordert der Fremd-API-Aufruf nur die Felder an, die danach auch gemappt werden? WordPress
  liefert ohne `_fields` jedes `content.rendered` voll mit — bei 24 Posts 743 KB statt 226 KB.
  Achtung: `_fields` filtert auch bei gesetztem `_embed`, `_embedded` muss also explizit in
  der Liste stehen.
- Lässt sich die Optik-Referenz aus einem anderen Repo überhaupt übertragen, oder hängt ihre
  Performance an der Laufzeitumgebung (langlebiger Container vs. Serverless)? Erst die
  Deployment-Form vergleichen, dann den Code.

### Bilder & sich wiederholende Layouts (abgeleitet 2026-08-27)

- Stimmt die tatsächlich geladene Bildbreite mit der Anzeigegröße überein — auf der
  **Live-Plattform** gemessen, nicht lokal? Lokal läuft IPX und bedient jede Breite exakt;
  auf Vercel rundet der Provider auf `image.screens` auf und liefert still zu große
  Dateien. Prüfmethode: `naturalWidth` gegen `getBoundingClientRect().width` im Browser,
  oder das `srcset` der Live-Seite ansehen.
- Zeigen die Einträge eines `srcset` überhaupt auf verschiedene Dateien? Rundet der
  Provider 1x und 2x auf denselben Wert auf, ist die zweite Dichte wirkungslos und
  verdoppelt nur die Markup-Größe.
- Bei einer per Verdopplung (`[...items, ...items]`) gebauten Endlosschleife: Passen mehr
  Elemente gleichzeitig ins Sichtfenster, als es einzigartige gibt? Dann ist die
  Wiederholung permanent sichtbar. Prüfmethode: Sichtfensterhöhe durch (Elementhöhe + gap).
- Ist der Bedarf gegenläufig zur Elementgröße? Bei Kachelwänden braucht der KLEINE Screen
  mehr Bilder, nicht weniger — feste Mobile-/Desktop-Werte treffen dann beides daneben.
- Spiegelt eine JS-Konstante einen CSS-Wert (gap, inset, aspect-ratio, min-height)? Dann
  gehört an beide Stellen ein Verweis auf die jeweils andere — sonst rechnet die Logik
  nach der nächsten Layout-Änderung an der Realität vorbei.

### SSR-Konsistenz & aufklappbare Inhalte (abgeleitet 2026-08-30)

- Hängt ein gerenderter Wert an `Date`, `Math.random` oder `window`? Dann läuft er zwischen
  Server- und Client-Render auseinander, sobald sich die Quelle dazwischen ändert — bei
  Jahreszahlen einmal pro Jahreswechsel, also selten genug, um jeden Test zu überleben.
  Prüfmethode: nach `new Date(`, `Date.now(`, `Math.random(` in `app/` greppen und für jeden
  Treffer fragen, ob er im Template landet. Fix ist nicht „im Client neu rechnen", sondern
  den Serverwert per `useState` in den Payload serialisieren.
- Ist ein eingeklappter Inhalt wirklich nur eingeklappt — oder gar nicht im DOM? `v-if`
  entfernt ihn für Suchmaschinen, Vorlesesoftware, „Auf Seite suchen" und den Drucker.
  Für Inhalte, die zum Seitenzweck gehören (ein Lebenslauf ist keine Zusatzinfo), gehört
  die Höhe per CSS auf 0, nicht der Knoten aus dem Baum.
- Deckt die Druckansicht auch die **neuen** Zuklapp-Zustände ab? Der Print-Block muss jeden
  Mechanismus einzeln aufheben (`opacity`, `transform`, `grid-template-rows`, `max-height`).
  Ein bestehender Block ist kein Beweis, dass er den zuletzt gebauten Mechanismus kennt.
  Prüfmethode: Cmd+P, nicht Code lesen.
- Beobachtet eine Scroll-/Sichtbarkeitslogik mehrere Elemente? Dann ist die Reihenfolge der
  Callbacks **nicht** die Dokumentreihenfolge — wer „zuletzt gemeldet" als „aktuell" nimmt,
  bekommt beim schnellen Scrollen die falsche Markierung. Und für „nichts sichtbar" braucht
  es eine ausdrückliche Regel, sonst flackert die Anzeige an jeder Grenze.
- Zeichnet eine Zeitachse Einträge, die sich überlappen können? Überlappung ist bei
  Lebensläufen der Normalfall (Nebentätigkeit, Übergabephase), nicht die Ausnahme. Eine
  einzeilige Achse überzeichnet sie still. Prüfmethode: das Datenmodell nach zwei Einträgen
  ohne Endwert durchsuchen.

### Suche, Filter & Cache-Schlüssel (abgeleitet 2026-08-30)

- Gibt es einen zweiten Filter derselben Bauart daneben? Suche und Kategorie hatten
  denselben Fehler, aber nur die Suche fiel auf — der Chip zeigte plausible 2 Treffer
  statt der 5 aus dem Archiv. Ein Filter, der zu wenig zeigt, sieht nie kaputt aus.
- Entscheidet eine Liste anhand der geladenen Daten, welche **Bedienelemente** überhaupt
  erscheinen? Dann verschwindet ein Chip, sobald der geladene Ausschnitt gerade nichts
  dazu enthält. Für eine kuratierte Liste ist das eine Prüfung am falschen Ort.

- Kennt der Filter die Grundgesamtheit, über die er urteilt? Ein clientseitiger Filter über
  eine paginierte Liste beurteilt nur den nachgeladenen Ausschnitt und meldet für den Rest
  „keine Treffer" — bei 30 von 242 Beiträgen also für 88 % des Archivs. Prüfmethode: nach
  einem Begriff suchen, der nachweislich nur im ältesten Teil des Archivs vorkommt.
- Wird ein Serverergebnis danach noch einmal clientseitig gefiltert? Wenn die Serversuche
  mehr Felder kennt (WordPress durchsucht den Volltext), wirft der zweite Filter genau die
  Treffer weg, für die man auf den Server gegangen ist — und stellt den Bug still wieder her.
- Geht ein Wert von außen in einen Cache-Key, Dateinamen oder Storage-Pfad? `:` wird von
  unstorage zu einer Verzeichnisebene, `/` erst recht. Ein variables Segment gehört an eine
  feste Position und kodiert oder gehasht dorthin, sonst bestimmt der Besucher die
  Pfadstruktur. Prüfmethode: nach `withWpCache(` greppen und je Aufruf fragen, welcher Teil
  des Keys vom Besucher stammt.
- Wird ein Schreibfehler nur geloggt? Dann fällt sein Ausfall im Betrieb niemandem auf.
  Nach jeder Änderung an Cache-Keys einmal ins Dev-Log sehen, statt auf einen roten Test zu
  warten, den es für „hat leider nichts gespeichert" nicht gibt.
- Liest eine per ISR gecachte Seite Query-Parameter? Dann teilen sich alle Varianten einen
  Edge-Eintrag und der nächste Besucher bekommt das Ergebnis des vorigen. Suche und Filter
  gehören hinter die Hydration.
