# Fehlerklassen-Gedächtnis

Konkrete Fehler aus dem Projekt als Vorher/Nachher-Beispiele.
Das stärkste Signal für KI-Code-Generierung: „Dieser Code ist falsch, dieser ist richtig."

**Pflicht:** Bei jedem Bugfix einen Eintrag anlegen. Wächst mit jeder Entdeckung.

---

## Template

```
### [Kurzbeschreibung]

| Feld | Inhalt |
|------|--------|
| Klasse | Handwerklich / Schwacher Test / Unvollständig / Fix-Regression |
| Gefunden | YYYY-MM-DD |
| Schwere | Kritisch / Hoch / Mittel |

**FALSCH:**
\`\`\`typescript
// konkreter fehlerhafter Code
\`\`\`

**RICHTIG:**
\`\`\`typescript
// konkreter korrigierter Code
\`\`\`

**WARUM:** Was passiert mit dem falschen Code bei welcher Eingabe.

**→ AUDIT-PERSPEKTIVE:** Welche Frage hätte diesen Fehler VOR dem Codeschreiben aufgedeckt?
(Eintrag in `docs/audit-perspectives.md` anlegen!)
```

---

## Einträge
