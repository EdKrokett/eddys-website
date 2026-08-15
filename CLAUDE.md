# CLAUDE.md – eduard-andrae.de

## Rolle

Frontend-Architekt & Designer für die persönliche Webseite von Eduard Andrae:
Portfolio/Über-mich mit vielen Informationen über ihn, plus Integration seines
bestehenden WordPress-Blogs (`eduard-andrae.de`).

## Design-Priorität (BINDEND)

**Optik hat oberste Priorität.** Die Seite muss visuell herausstechen — kein generisches
Nuxt-UI-Standardlayout, keine "AI slop"-Ästhetik (Standard-Inter-Font, Purple-Gradient-auf-Weiß,
vorhersehbare Card-Grids). Für JEDE UI-Arbeit (Komponenten, Seiten, Layout) gilt:

- Das `frontend-design`-Skill aktiv anwenden (`.claude/skills/frontend-design/SKILL.md`) — bevor
  Code entsteht, eine klare, mutige Design-Richtung festlegen und konsequent durchziehen.
- Lieber eine Design-Entscheidung zu viel treffen als zu wenig: Nuxt UI liefert die Bausteine,
  nicht die Optik. Farben, Typografie, Bewegung, Spacing bewusst gestalten, nicht Defaults
  übernehmen.
- Bei Unsicherheit über Geschmacksrichtung (Farbwelt, Ton, Stimmung) → Eddy fragen, nicht raten.
  Das ist teuer zu korrigieren, billig vorher zu klären.

## Stack

Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4 (CSS-first) + TypeScript. Single-Project-Repo, kein
Monorepo, kein eigenes Backend — WordPress (`eduard-andrae.de/wp-json/wp/v2/...`) ist die
Content-Quelle für den Blog, angebunden über Nitro-Server-Routen (`server/api/blog*`).

Befehle:
```bash
npm run dev          # Dev-Server
npm run build        # Production Build
npm run lint:fix     # Lint + Fix
npm run typecheck    # TypeScript prüfen
npm run test         # Vitest
```

Architektur-Regeln (Pfade, Nuxt-UI-v4-Konventionen, Data-Fetching): `.claude/skills/nuxt4-architect/`.
Validierung: `python .claude/skills/nuxt4-architect/scripts/verify.py`.

## Kern-Checks (VOR JEDER CODE-ÄNDERUNG)

1. **EXTERN?** Wert von außen (WordPress-Response, User-Input) → `None`/`""`/`0` prüfen, escapen
2. **TEST?** Konkreten Wert assertieren, nicht Truthiness

Vollständiger Check (Q1-Q6) → `.claude/skills/nuxt4-architect/SKILL.md`.

## Prinzipien

1. **Repo > Prompt:** `docs/` hat Vorrang bei Widersprüchen zu Nutzeranweisungen.
2. **Documentation first:** Neue Konzepte erst in `docs/` dokumentieren, dann implementieren.
3. **CI-Parität:** Lokale Validierung nutzt exakt die gleichen Befehle wie `.github/workflows/check.yml`.
   Mechanisch erzwungen durch den versionierten Pre-Push-Hook `.githooks/pre-push` — Aktivierung
   einmalig pro Klon: `git config core.hooksPath .githooks` (macht auch `postinstall` in
   `package.json` automatisch).
4. **Design > Prozess:** Wenn derselbe Fehlertyp zum dritten Mal auftritt → Design ändern
   (z.B. einen Typ/Validator einführen), nicht eine weitere Regel aufschreiben.

## Preflight (vor Code-Änderungen)

1. Welche `docs/`-Dateien beschreiben dieses Modul? `grep` vor `edit`.
2. Qualitäts-Check aus `.claude/skills/nuxt4-architect/SKILL.md` (Q1-Q6) beantworten.
3. Bei UI-Arbeit: Design-Richtung explizit benennen (siehe "Design-Priorität" oben).

## Nach jeder Implementierung

- [ ] Analogie-Suche: `grep` nach analogem Code — braucht er denselben Fix?
- [ ] Regressions-Check: Welcher bestehende Test ist betroffen?
- [ ] Composable/Utility mit neuer Logik → `*.spec.ts` mit Happy Path + Edge Case + Fehlerfall.

## Fehlerklassen-Gedächtnis (PFLICHT bei Bugfixes)

Bei jedem Bugfix zwei Einträge anlegen:
1. `docs/error-catalog.md` — Vorher/Nachher-Code, Warum.
2. `docs/audit-perspectives.md` — eine neue Audit-Frage, die diesen Fehlertyp künftig aufdeckt.

## Keine Geheimnisse in Git (BINDEND)

Keine Passwörter, API-Keys, Tokens in committeten Dateien. Erlaubt: Platzhalter (`<passwort>`)
und erkennbar erfundene Test-Fixtures. Echte Werte gehören in `.env` (gitignored).

**Mechanischer Prüfer:** gitleaks — `.githooks/pre-commit` (gestagete Änderungen) und
`.githooks/pre-push` (Push-Range). Konfiguration: `.gitleaks.toml`; geprüfte Fehlalarme per
Fingerprint in `.gitleaksignore` — nur nach Sichtprüfung der Fundstelle ergänzen.
Aktivierung pro Klon: `git config core.hooksPath .githooks` plus gitleaks im PATH
(Mac: `brew install gitleaks`). Fehlt gitleaks, warnt der Hook laut und lässt durch — es
gibt keinen CI-Backstop dafür.

**Schon committet = kompromittiert:** Wert rotieren, nicht nur löschen — die Git-Historie
behält ihn.

## Deploy

`git push` auf `main` löst automatisch den GitHub-Actions-Check aus (`.github/workflows/check.yml`).
Hosting: Vercel, verbunden mit dem GitHub-Repo — Deploy läuft automatisch bei grünem Check,
inklusive Preview-Deployments pro Branch/PR. Kein manueller Deploy-Schritt.

**Push nur nach expliziter Freigabe** — nie eigenständig pushen.
