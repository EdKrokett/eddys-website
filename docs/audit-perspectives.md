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
