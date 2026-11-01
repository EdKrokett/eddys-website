# Laufstatistik: Datenmodell, Pflege und Seite `/statistik`

Stand 01.11.2026. Beschreibt das WordPress-Plugin `wordpress/eddy-laufstatistik/`, die
Server-Route `server/api/statistik.get.ts` und die Seite `app/pages/statistik.vue`.

## Warum es das gibt

Bis 01.11.2026 lag Eddys Laufstatistik als TablePress-Tabelle (`[table id=1 /]`) auf der
WordPress-Seite `blog.eduard-andrae.de/statistik/` (Page 5067). Drei Probleme:

1. **Kein Zugriff von außen.** TablePress hat keine REST-Schnittstelle. Neue Läufe musste Eddy
   von Hand abtippen, auch wenn Claude sie beim Schreiben des Laufberichts schon kannte.
2. **Text statt Daten.** „DNS“ stand in der Spalte Zeit, „Staffel“ nur im Namen der
   Veranstaltung, Meilensteine hatten „n.a.“ als Zeit. Daran ist die Marathon-Zählung
   gescheitert: 11 Zeilen über 42,2 km, aber nur 10 Marathons, weil Köln 2011 eine Staffel war.
   Das Marathon-Diagramm darunter war ein handgepflegtes PNG von 2012.
3. **Optik.** Eine Standardtabelle im WordPress-Theme, nicht im Design der Seite.

Eddys Entscheidung (01.11.2026): Daten in WordPress mit eigenem Formular, Anzeige auf
`eduard-andrae.de/statistik` (Option A). Die alte WordPress-Seite leitet dorthin weiter.

## Datenmodell

Eigener Inhaltstyp `lauf` im Plugin. Jeder Lauf ist ein Eintrag.

| Feld | Speicherort | Typ | Bedeutung |
|---|---|---|---|
| Veranstaltung | `post_title` | Text | Name, wie er in der Liste steht |
| `datum` | Meta | `YYYY-MM-DD` | Pflicht |
| `distanz_km` | Meta | Zahl, eine Nachkommastelle | leer bei Meilensteinen |
| `zeit` | Meta | `H:MM:SS` oder `HH:MM:SS` | leer bei DNS, Meilenstein |
| `art` | Meta | `wettkampf` \| `training` \| `meilenstein` | Default `wettkampf` |
| `ergebnis` | Meta | `finish` \| `dns` \| `dnf` | Default `finish` |
| `wertung` | Meta | `einzel` \| `staffel` \| `triathlon` | Default `einzel` |
| `notiz` | Meta | Text | z. B. „ausgefallen (Corona)“ |
| `links` | Meta | Liste aus `{ label, url }` | Urkunde, Blogpost, Polar … |

**Warum `wertung`:** Staffel und Triathlon-Laufanteil sind echte Läufe und bleiben in der Liste.
Sie zählen aber nicht als Marathon und nicht für Bestzeiten auf ihrer Distanz. Ein eigenes Feld
macht diese Regel prüfbar, statt sie aus dem Namen zu erraten (CLAUDE.md, „Design > Prozess“).

**Warum `art` und `ergebnis` getrennt:** Ein Meilenstein hat kein Ergebnis, ein DNS ist trotzdem
ein Wettkampf. Zusammengelegt bräuchte man Kombinationen wie „Wettkampf-DNS“.

## Pflege in WordPress

WP-Admin → **Läufe**. Liste mit Spalten Datum, Distanz, Zeit, Ergebnis; Standard-Sortierung nach
Datum absteigend. Die Bearbeitungsmaske hat für jedes Feld ein eigenes Eingabefeld und sechs
Link-Zeilen (Bezeichnung + URL); leere Zeilen werden beim Speichern verworfen.

Beim Speichern prüft das Plugin jedes Feld (Datum gültig, Zeit im Format, Enums aus der festen
Liste, URLs mit `esc_url_raw`). Ungültige Werte werden nicht gespeichert, sondern als
Admin-Hinweis gemeldet.

## Schnittstellen

- **Lesen (öffentlich):** `GET /wp-json/eddy-laufstatistik/v1/laeufe` liefert alle
  veröffentlichten Läufe in einer Antwort, nach Datum absteigend. Eigene Route statt
  `wp/v2/laeufe`, weil `wp/v2` höchstens 100 Einträge pro Seite liefert und die Felder im
  `meta`-Objekt verschachtelt.
- **Schreiben (authentifiziert):** `wp/v2/laeufe` mit Application Password, Felder in `meta`.
  So trägt Claude einen Lauf beim Anlegen eines Laufberichts direkt ein.

## Aktualisierung der Seite

`/statistik` liegt per ISR am Edge (`nuxt.config.ts`). Damit eine Änderung sofort sichtbar wird,
meldet das Plugin jeden gespeicherten, veröffentlichten oder gelöschten Lauf über den
bestehenden Inhalts-Webhook (`docs/revalidierung.md`) mit `scope: 'statistik'`. Die Route
`server/api/revalidate.post.ts` baut dann `/statistik` und `/statistik/_payload.json` neu, ohne
die Post-ID bei WordPress nachzuschlagen (ein Lauf ist kein Beitrag).

Das Laufstatistik-Plugin hat dafür keine eigene Webhook-Logik. Es ruft `eddy_cr_queue()` aus dem
Webhook-Plugin auf, wenn es vorhanden ist. Fehlt das Webhook-Plugin, greift nur die ISR-Frist.

## Server-Route und Validierung

`server/api/statistik.get.ts` holt die Läufe, prüft jeden Eintrag mit `parseLauf()`
(`shared/utils/lauf.ts`) und verwirft ungültige Einträge einzeln, statt die ganze Seite
scheitern zu lassen. Abgeleitete Werte (Anzahl Marathons, Bestzeiten, Diagrammreihen) rechnet
`app/utils/statistik.ts`, getestet in `statistik.spec.ts`.

Regeln für abgeleitete Werte:

- **Marathon:** `distanz_km` 42,2, `ergebnis` `finish`, `wertung` `einzel`, `art` `wettkampf`.
- **Halbmarathon-Reihe:** `distanz_km` 21,1 und `ergebnis` `finish`. Trainingsläufe gehören
  dazu (so steht es auch in Eddys Laufberichten), werden aber anders markiert.
- **Bestzeit je Distanz:** schnellste Zeit unter den Einträgen mit `finish` und `einzel`.
  Immer über die vollständige Liste, nie aus einem Ausschnitt (eigener Fehler beim
  Berlin-Beitrag, siehe Gedächtnis).

## Seite `/statistik`: Design „Gangbuch“

Ein Chronometer bekommt beim Uhrmacher ein Prüfprotokoll, in dem seine Messwerte über die
Zeit stehen. Die Seite ist Eddys Gangbuch als Läufer.

0. **Zifferblatt im Kopf** (`StatistikZifferblatt.vue`, ab 1100 px): derselbe Zeitstrahl als
   Kreis, 2006 bei 12 Uhr, im Uhrzeigersinn bis heute. Läufe als Striche nach außen, Meilensteine
   innen, der Zeiger auf dem jüngsten Lauf. Rein dekorativ (`aria-hidden`), die Daten stehen
   zugänglich weiter unten. Beim Laden wachsen die Striche nacheinander, der Zeiger läuft ein.
1. **Prüfschein:** Kernwerte in großen Mono-Ziffern: Marathons, Bestzeit Marathon und
   Halbmarathon, längster Lauf, Wettkämpfe im Ziel, Wettkampf-Kilometer.
2. **Zeitstrahl:** 2006 bis heute; jeder Lauf ein Indexstrich, Länge proportional zur Distanz.
   Meilensteine als Messing-Rauten, DNS/DNF als hohle Striche.
3. **Die zehn Marathons:** Balken je Marathon, Bestzeit in Messing. Ersetzt das PNG von 2012.
4. **Halbmarathon-Verlauf:** Zeiten über die Jahre mit der Zwei-Stunden-Linie.
5. **Protokoll:** vollständige Liste nach Jahr gruppiert, Filter (Alle, Marathon, Halbmarathon,
   Meilensteine) und Suche. Der Suchbegriff wird nur clientseitig gelesen, nie im SSR-Pfad
   (ISR-Regel in `nuxt.config.ts`).
6. **Schluss:** das Motto „Es ist nicht die Zeit, die zählt, es ist deine Leidenschaft.“

**Farben in den Diagrammen:** Teal `accent-500` für Messwerte, Messing `--color-brass-mark`
(#bd8b30) für Bestzeit und Meilenstein. Das Paar ist mit dem Paletten-Validator des
dataviz-Skills gegen Grafit geprüft (alle Prüfungen bestanden, auch Farbsehschwäche).
`brass-400` fiel durch und ist deshalb hier nicht verwendet. Typen unterscheiden sich
zusätzlich in der Form (Strich, hohler Strich, Raute; gefüllter und hohler Punkt), nie nur
in der Farbe.

**Links im Protokoll:** Ein Link auf einen Blogbeitrag (Domain plus genau ein Pfadsegment)
wird zu `/blog/<slug>` (`internerBlogPfad`). Alte `www.eduard-andrae.de`-Adressen hebt
`parseLauf` über `rewriteLegacyWpUrls` auf blog.eduard-andrae.de und https. Am 01.11.2026
geprüft: 27 von 28 Beitragslinks und alle 13 Urkunden-Dateien erreichbar.

## Umzug aus TablePress

`scripts/import-laufstatistik.py` liest die Tabelle aus dem veröffentlichten HTML der alten
Seite, übersetzt sie ins neue Modell und legt die Läufe über `wp/v2/laeufe` an. Übersetzungen:

- `2026|09|13` → `2026-09-13`; `06,5 km` → `6.5`
- `DNS`/`DNF` in der Zeitspalte → `ergebnis`; `n.a.` ohne Distanz → `art: meilenstein`
- Beschreibung „Trainingslauf“ → `art: training`
- „Staffel“ im Namen → `wertung: staffel`; „Triathlon“ im Namen → `wertung: triathlon`
- Text in der Notizspalte ohne Link → `notiz`, Links → `links`

Korrektur beim Umzug: Die Zeile vom 13.09.2026 verlinkte als „Blogpost“ den Beitrag von 2025.
Neu dazu: Halloween Run Bremen, 31.10.2026, 25,0 km, 2:23:30.

**Ergebnis (01.11.2026):** 68 Läufe in WordPress, 10 Marathons (Bestzeit 3:42:29, Essen 2008),
Halbmarathon-Bestzeit 1:48:25 (Cuxhaven 2011). Ein zweiter Skriptlauf meldet alle 68 als
„vorhanden“ und legt nichts an.

Was das Skript dabei gelernt hat (Einzelheiten in `error-catalog.md`):
- **Nur IPv4.** Über IPv6 hängt jede Anfrage aus Python rund 20 s.
- **Echo prüfen statt Status.** WordPress antwortet 201, auch wenn es `meta` verworfen hat.
- **Abgleich über den Rohtitel** aus `wp/v2` (`context=edit`), nicht über die öffentliche Liste:
  Die gibt Titel mit typografischem Apostroph aus, der Vergleich verfehlte „Runner's World“.
- **Leere Distanz weglassen**, nicht als `null` senden (`rest_invalid_stored_value`).
- Das Plugin brauchte zwei Nachbesserungen: 1.0.1 (`custom-fields`, klassische Maske) und
  1.0.2 (Emojis in Notizen und Link-Bezeichnungen, Meta-Tabelle ist utf8).

**Offen nach dem Deploy** (Reihenfolge wichtig):
1. Inhalts-Webhook 1.2 einspielen (erst jetzt, sonst kennt die Gegenstelle `statistik` nicht).
2. Redirection-Regel `blog.eduard-andrae.de/statistik/` → `https://eduard-andrae.de/statistik` (301).
3. TablePress deaktivieren, nicht löschen, bis die neue Seite eine Woche läuft.
4. Toter Link beim AOK-Halbmarathon 2009: `5-swb-marathon-in-bremen-2` gibt es nicht mehr, auch
   nicht im Blog. Kandidat ist `5-swb-marathon-in-bremen` vom 03.08.2009; ob das der Bericht
   ist, entscheidet Eddy.

Der Link auf `/ueber-mich` zeigt seit 01.11.2026 auf `/statistik`.
