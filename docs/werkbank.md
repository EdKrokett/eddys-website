# Werkbank: Konzept, Belege und Zahlen

Stand 12.09.2026. Beschreibt `app/pages/werkbank.vue` — die Seite über Eddys Arbeit mit KI
und Automatisierung.

## Warum es diese Seite gibt

KI und Automatisierung kamen auf der Website bis hierher nur in Nebensätzen vor: „KI-Overviews"
in der trusted-blogs-Station, „Statistik- und KI-Unterstützung" im Projekteintrag, „Oder über KI"
im Kontaktband, und das Zertifikat **Make Advanced (2025)** ohne jeden Kontext zwischen PRINCE2
und Uhrmachermeister. In den Skill-Gruppen fehlte das Thema ganz. Das Rohprofil in
`content-sammlung.md` führt sogar noch „Prozessautomatisierung 2/5" — eine team-neusta-Selbst\
einschätzung, die von der Realität überholt wurde.

## Der Kern: Beleg statt Behauptung

Die Seite behauptet nicht, dass Eddy KI kann. Sie zeigt drei Dinge, die es belegen — zwei davon
von außen bestätigt.

**Warum eigene Seite und nicht ein Kapitel auf /ueber-mich:** Die Über-mich-Seite ist Biografie,
chronologisch nach Stationen. KI ist keine Station, sondern die Arbeitsweise der letzten zwei
Jahre — das passt strukturell nicht hinein. Dazu war die Seite schon einmal „eine lange Tapete"
(siehe `ueber-mich-navigation.md`); ein fünftes Kapitel macht sie wieder länger. `/1apreis` ist
der Präzedenzfall: eigene Geschichte, eigene Seite.

**Warum „Werkbank":** Die Klammer zum Uhrmacher. `/ueber-mich` zeigt das Zifferblatt, die
Außenansicht. Die Werkbank ist die Rückseite — offenes Werk, sichtbare Mechanik. Und sie vermeidet,
dass auf einer Seite ohne ein einziges Buzzword plötzlich „KI & Automatisierung" als Überschrift
steht.

**Tonlage (Eddys Entscheidung, 12.09.2026):** Beleg mit leiser Tür am Ende. Erzählend, kein
Verkaufs-CTA; der Schluss öffnet eine Tür, statt etwas zu verkaufen.

## Die Belege

### 1. Das Buch

Manfred Wolff, *Software mit KI entwickeln — Das kanban-kit und das claude-workflow-kit in der
Praxis*, Version 1.5, August 2026, 178 Seiten. Quelle:
`https://mwolff.org/whitepapers/Softwareentwicklung-mit-ki-buch-v1.5.pdf`

Zwei Fundstellen:

- **Seite 6**, Kapitel „Warum dieses Buch" — beschreibt trusted blogs als „zweiseitigen
  Marktplatz" mit Rollen, Katalog, Buchungsstrecken, Honorarlogik, und hält fest: „Er hat sie
  2025 und 2026 vollständig neu gebaut, und zwar ausschließlich mit KI."
- **Seite 175**, Anhang F „Dank" — der Absatz trägt die Überschrift **„Für den Beweis, dass es
  geht."**

Auf Seite 6 steht außerdem, was daraus folgte: Wolff begann im Mai 2026, sein Wissen „in ein
System zu packen" — daraus entstand das claude-workflow-kit. Eddys Demo war der datierte Auslöser.

**Zitatrecht:** Kurzzitat als Beleg mit vollständiger Quellenangabe (§ 51 UrhG). Vor der
Veröffentlichung wird Wolff zusätzlich um Zustimmung gebeten — er hat Eddy im Dank genannt, das
ist Höflichkeit, keine Rechtsfrage.

### 2. Der Neubau von trusted blogs

Quelle: lokales Repo `~/tb26-code` (privat, nicht Teil dieses Repos), Stand 12.09.2026.
Auf der Seite erscheinen **nur aggregierte Kennzahlen**, kein Code und keine Inhalte.

| Kennzahl | Wert |
| --- | --- |
| Commits gesamt | 2.562 |
| davon Eduard Andrae | 2.450 |
| davon Hardy Kutzer | 112 |
| Zeitraum | 04.02.2026 — 12.09.2026 |
| Dateien | 1.477 |
| davon Python / TypeScript / Vue / Markdown | 642 / 475 / 151 / 103 |
| Merges | 333 |
| Dokumente in `docs/` | 62 |
| **Altsystem zum Vergleich** | **7.296 Commits, 19.02.2015 — 13.08.2025** |

**Hardys Rolle — wichtig für die Erzählung.** Seine 112 Commits liegen fast vollständig auf dem
4. bis 6. Februar 2026. Inhalt laut Commit-Nachrichten: Frontend initialisiert, GitLab-CI-Pipeline,
Docker/Coolify-Deployment, ESLint — und dann „Crafted and added claude-skill `backend-architect`",
„optimize nuxt4-architect, add AI-Log workflow", „Claude-Optimierungen (Frontend-Skills,
Claude.md, docs/)".

Hardy hat also nicht mitprogrammiert. Er hat die **Leitplanken** gebaut, in denen die KI danach
arbeiten konnte. Das ist die ehrliche und zugleich stärkste Version der Geschichte, weil sie
Wolffs zweiten Einwand (Seite 7: KI-Werkzeuge in ungeübten Händen sind gefährlich, das Prüfen
verlangt Erfahrung) nicht umgeht, sondern beantwortet.

**Die Pointe der Seite:** Wolff nennt auf Seite 5 die Bedingungen gelingender KI-Entwicklung —
„Test-First. Architekturregeln, die scheitern können. Kleine Einheiten. Ein zweiter Blick vor dem
Merge." In `tb26-code/ARCH_RULES.md` steht: „Bevor irgendein Code als 'fertig' deklariert wird,
MUSS das Audit-Skript fehlerfrei durchlaufen. Exit-Code muss 0 sein." Das sind Architekturregeln,
die scheitern können — mechanisch erzwungen, nicht als Vorsatz formuliert.

### 3. Die Make-Szenarien

Quelle: Make-Organisation „Eddys Automatisierungen", Team 1117283, abgerufen 12.09.2026 über die
Make-API.

| Szenario | Module | Läufe | Operationen |
| --- | ---: | ---: | ---: |
| Promotion erstellen | 115 | 482 | 13.321 |
| Promos: Kacheln erstellen + Mail senden | 26 | 152 | 3.515 |
| Content-Versand | 26 | 160 | 3.327 |
| KI-Blogpost erstellen | 87 | 49 | 1.437 |
| Publer-API (Pinterest ×2, Twitter, Facebook, LinkedIn) | je 40 | 589 | 5.303 |
| **Summe über alle 19 Szenarien** | | **1.665** | **29.110** |

**Auf der Seite stehen drei davon** (Eddys Auswahl, 12.09.2026): Promotion erstellen,
KI-Blogpost erstellen, Content-Versand. Die Beschriftung sagt „Drei der neunzehn Szenarien",
nicht „die drei größten" — nach Modulzahl stünde auf Platz drei „Pinterest:
Multi-PIN-Erstellung" mit 56 Modulen und **0 Läufen**, und ein gebautes, aber nie
gestartetes Szenario wirft in einer Tabelle, die zeigen soll was läuft, mehr Fragen auf als
es beantwortet.

Der Balken hinter jedem Namen rechnet gegen die größte Modulzahl **dieser Liste**, nicht
gegen alle neunzehn. Kommt eine Zeile dazu oder fällt eine weg, skalieren die Balken
entsprechend mit.

Angebundene Dienste (20): Google Sheets, HTTP, JSON, ai-tools, Placid, Cloudinary, OpenAI,
Anthropic Claude, Brevo/Sendinblue, Notion, Apify, Scraptio, WordPress, Data Store u. a.

**Die tragende Zahl ist nicht die Laufzahl, sondern 115 Module in einem Szenario.** Die Läufe
sind dreistellig, weil eine Promotion kein Massenprozess ist; die Komplexität eines einzelnen
Ablaufs ist das Bemerkenswerte, und der Screenshot zeigt sie auf einen Blick.

### 4. Diese Website

Quelle: dieses Repo, Stand 11.09.2026. 42 Commits, 15.08.2026 — 11.09.2026, 101 Dateien,
~8.955 Zeilen Vue und TypeScript. Gebaut mit Claude Code von jemandem, der selbst kein Vue
schreibt.

## Warum die Zahlen Konstanten sind und nicht aus git kommen

Die tb26-Kennzahlen stammen aus einem **anderen, privaten Repo**, das beim Vercel-Build nicht
existiert; die Make-Zahlen kommen aus einer API, die einen Token bräuchte. Beides zur Laufzeit zu
ziehen hieße, ein Geheimnis ins Deployment zu legen, um eine Zahl anzuzeigen, die sich monatlich
kaum ändert.

Deshalb: Konstanten in `app/utils/werkbank.ts`, jede mit Stichtag im Datenobjekt. Der Stichtag
steht sichtbar auf der Seite — eine Zahl ohne Datum wäre die unehrlichere Lösung. Beim
Aktualisieren gilt: **Stichtag mitziehen**, sonst behauptet die Seite Aktualität, die sie nicht hat.

## Seitenaufbau

| Abschnitt | Inhalt | Visuelles Element |
| --- | --- | --- |
| Auftakt | Das Zitat aus Anhang F | Faksimile: heller Papierblock, Fraunces, Seitenzahl |
| 01 Der Neubau | Wolffs Beschreibung, Kennzahlen | Balkenvergleich Altsystem / neues System |
| 02 Das Handwerk | Die Geigen-These, Hardys Rolle, Wolffs zweiter Einwand | Statement-Satzbild mit Teal-Pointe |
| 03 Die Maschinen | 19 Szenarien, 115 Module, 20 Dienste | Screenshot in der Vitrine + SVG-Kette |
| 04 Wo es klemmte | Lessons aus `tb26-code/docs/ai-lessons.md` | Werkzeugregal, typografisch |
| 05 Diese Seite | Colophon zu eduard-andrae.de | Kennzahlenleiste |
| Leise Tür | Werkzeugkasten-Link + Kontakt | — |

### Warum „Das Handwerk" ein eigenes Kapitel ist (seit 12.09.2026)

Der Abschnitt über Hardy Kutzer stand zuerst als Unterabschnitt am Ende von Kapitel 01 und
las sich dort wie eine Fußnote zum Neubau. Er beantwortet aber die Frage, die nach Kapitel 01
offen im Raum steht: Wie kann jemand, der keinen Code schreibt, so etwas bauen?

Eddys Antwort darauf ist die These der ganzen Seite, in seinen Worten: Wer KI für einen
Hammer hält, schlägt damit einen Nagel ins Brett; wer sie als Instrument begreift, muss darauf
spielen lernen. Auf der Seite steht sie erzählend statt als Zwillingsfigur (siehe
Schreibregeln), mit „KI ist eine Geige." als abgesetzter Pointe in Teal.

Das Statement bekommt ein eigenes Satzbild mit Linien oben und unten, **kein** Papier-Motiv:
Das Faksimile im Intro bleibt der einzige helle Block und das einzige Zitat der Seite. Hier
spricht Eddy selbst, und der Wechsel des Satzbildes soll das zeigen.

## Design-Richtung

Fortsetzung von „Präzisionswerk", aber im Modus Innenansicht:

- **Mono trägt mehr als sonst.** JetBrains Mono setzt hier ganze Datenblöcke, nicht nur Labels.
  Dies ist die Maschinenseite, das darf man lesen.
- **Die Kette ist das Leitmotiv.** Knoten auf einer Linie statt Karten im Raster — die Bauform
  eines Make-Szenarios, übersetzt in die Haarlinien-Sprache der Seite.
- **Teal führt, Messing tritt einmal auf.** Teal ist die Maschine, Messing das Papier: Es
  erscheint ausschließlich am Buch-Faksimile. Auf `/1apreis` ist Messing das Leitmotiv; hier
  bliebe es sonst ununterscheidbar.
- **Ein heller Block in einer dunklen Seite.** Das Faksimile ist die einzige helle Fläche der
  ganzen Site. Maximaler Kontrast an genau einer Stelle — der Moment, den man mitnimmt.

## Der Werkzeugkasten

Eddy hat eine Klick-für-Klick-Anleitung (GitLab, VS Code, Claude Code) geschrieben, ursprünglich
für **Carsten Meyer-Heder**, den Investor von trusted blogs, der sie nach Eddys Neubau angefragt
hatte. Für die öffentliche Fassung sind Widmung und der Vermerk „Internes Setup-Handbuch"
entfernt; das Original für Carsten bleibt unverändert unter seiner eigenen URL bestehen.

Öffentliche Fassung: `https://claude.ai/code/artifact/d767a008-a24c-47ef-8125-83b20d5e55e3`
(als Konstante in `app/utils/werkbank.ts`). Geändert gegenüber dem Original: Eyebrow und
Footer ohne „intern", Widmung durch die Zielgruppe ersetzt, Beispielprojekt und
Beispieldomain neutralisiert, und die vier Selbstnennungen in der dritten Person („Eddy")
in die Ich-Form gebracht.

**Frei verlinkt, nicht hinter einem Formular.** Der Werkzeugkasten ist kein Produkt, sondern ein
weiteres Beweisstück: Wer ihn öffnet und 50 Minuten ehrliche Klickanweisungen statt eines
Verkaufstrichters findet, glaubt der Seite den Rest. Ein Gate davor machte aus einem Beleg eine
Lead-Maschine und kippte den Ton, den die Seite bewusst hält. Die leise Tür ist der Kontaktlink
daneben, nicht das Schloss davor.

## Eingriffe an bestehenden Dateien

| Datei | Änderung |
| --- | --- |
| `app/utils/cv.ts` | Vierte Skill-Gruppe „KI & Automatisierung"; `story`-Links auf die Werkbank beim Make-Zertifikat und beim trusted-blogs-Projekt |
| `app/components/SkillMeters.vue` | Raster bei vier Gruppen 2×2 statt 3+1 |
| `app/components/Header.vue` | Vierter Navigationseintrag |
| `app/components/SiteFooter.vue` | „Bremen" wird „Bremen · Gebaut mit Claude Code" mit Link |
| `shared/types/cv.ts` | `CvCertificate` bekommt optionales `story` |

## Qualitäts-Check (Q1–Q6)

1. **Externe Werte?** Keine. Die Seite rendert ausschließlich Konstanten aus
   `app/utils/werkbank.ts`; kein `useFetch`, kein User-Input, kein URL-Parameter. Der einzige
   Fremdinhalt sind die Zitate, und die stehen als Literale im Repo.
2. **Fehlgeschlagener Request?** Entfällt — es gibt keinen. Einziges Netzwerkobjekt ist der
   Screenshot über `NuxtImg`; er bekommt `alt` und feste `width`/`height`, damit ein Ausfall kein
   Layout springen lässt.
3. **Leeres Ergebnis?** Entfällt: Die Arrays sind Literale. Eine leere Liste wäre ein
   Programmierfehler, kein Laufzeitzustand.
4. **Reaktive Kette?** Keine Reaktivität außer dem Lightbox-`ref` für den Screenshot. Kein
   `shallowRef`-Fallstrick.
5. **Test, der einen Bug fände?** Die einzige Logik ist `scenarioBarWidth()` in
   `app/utils/werkbank.ts` (Balkenbreite aus Modulzahl). Getestet in `werkbank.spec.ts`:
   Happy Path mit konkretem Wert, `0`, negative Zahl, Wert über Maximum.
6. **Pre/Postconditions** für `scenarioBarWidth(modules, max)`:
   ```
   PRE:  modules >= 0, max > 0
   POST: Ergebnis in [MIN_BAR_PERCENT, 100]
   INV:  modules === max  ⇒  Ergebnis === 100
   ```
   Verletzte Precondition (`max <= 0`) → `MIN_BAR_PERCENT`, kein `NaN`, keine Division durch Null.
