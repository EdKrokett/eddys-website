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
