# Über mich: der Einstieg mit Text, Fotos und Lageplan

Stand 19.10.2026. Beschreibt den oberen Teil von `app/pages/ueber-mich.vue` bis zur
Fakten-Leiste. Alles ab den Fakten (Kapitelübersicht, Werdegang, Kompetenzen, Datenblatt,
Projekte) steht in `ueber-mich-navigation.md` und ist davon unberührt.

## Auftrag

Eddy (19.10.2026): Der Einstieg soll neu werden. Die animierte Uhr entfällt. Stattdessen
kommt der Text seiner alten Seite [blog.eduard-andrae.de/persoenliches](https://blog.eduard-andrae.de/persoenliches/)
hierher, dazu die Fotos vom Color Run und vom Karstadt-Marathon und „vielleicht auch die
Karte". Der Einstieg nutzt die volle Breite statt einer schmalen Textspalte.

## Welcher Text, welche Änderungen

Übernommen sind die ersten beiden Teile der alten Seite: „Wer schreibt hier? Und warum?"
(Herkunft, Beruf, Bremen, Einladung zum Mitlaufen) und „Laufen + Bloggen". Genau zu diesen
beiden Teilen gehören die drei genannten Bilder.

Nicht übernommen sind „Leidenschaft" (Tiger Balm Team, Eddycam) und die Linklisten am Ende.
Das Motto aus „Leidenschaft" steht bereits im Abschluss der Seite; Tiger-Eddy- und
Eddycam-Foto hat Eddy nicht genannt. Wenn er die Teile doch will, passen sie als dritter
Block in dasselbe Raster.

Der Wortlaut ist Eddys eigener und bleibt so. Geändert ist nur, was auf der neuen Seite nicht
mehr stimmt:

| Alt | Neu | Warum |
| --- | --- | --- |
| „mehr Details in meinem LinkedIn-Profil" | „weiter unten im Werdegang und in meinem LinkedIn-Profil" | Der Werdegang steht jetzt auf derselben Seite. |
| Link „Kathi" auf ein Facebook-Profil | ohne Link | Profil einer Privatperson, keine eigene Seite von Eddy. |
| „melde Dich einfach bei mir" (ohne Link) | Link auf `/kontakt` | Die Einladung soll einen direkten Weg haben. |
| „aus meinen Körper" | „aus meinem Körper" | Tippfehler. |
| Blog-Links auf `www.eduard-andrae.de/<slug>/` | `/blog/<slug>` | Beiträge laufen über die eigene Blogansicht. |
| Statistik-Link | `blog.eduard-andrae.de/statistik/` | WordPress-Seite, keine Nuxt-Route. |

Die durchgestrichenen Stellen („zwei Perserkatern") bleiben als `<del>`: Das ist Eddys
eigener Stil, die Korrektur sichtbar stehen zu lassen.

## Design: Tafeln und Lageplan

Richtung bleibt „Präzisionswerk" (dunkel, Haarlinien, Mono-Zahlen, ein Teal-Akzent). Die
Fotos sind farbig und laut, gerade der Color Run. Damit sie nicht wie eingeklebte Urlaubsbilder
wirken, stehen sie als **Tafeln** im Raster: Haarlinienrahmen, Passermarken an den Ecken,
darunter eine Mono-Bildunterschrift. Das ist die Sprache eines technischen Tafelwerks und
passt zum Uhrmacher. Abbildungsnummern („Abb. 1") standen anfangs davor und sind auf
Eddys Wunsch entfallen (19.10.2026).

Raster auf breiten Bildschirmen (12 Spalten):

1. Überschrift und Herkunftstext links (7 Spalten), Color-Run-Tafel rechts (5 Spalten),
   nach oben bis zur Überschrift gezogen.
2. Lageplan über die volle Containerbreite; die Einladung zum Mitlaufen liegt als Tafel
   links unten auf der Karte, wo nur Ochtum-Niederung und Flughafen zu sehen sind.
3. Karstadt-Tafel links (5 Spalten), „Laufen + Bloggen" rechts (7 Spalten). Gespiegelt zu
   Block 1, damit das Auge im Zickzack geführt wird.

Unter 1024 px fällt alles in eine Spalte; die Tafeln stehen dann jeweils **hinter** ihrem
Text und höchstens 26rem breit. Ein Hochformatfoto vor dem Text würde auf dem Telefon den
ganzen ersten Bildschirm füllen, bevor ein Wort zu lesen ist.

Auf dem Telefon trägt die Karte nur Bremen-Mitte, Weser, Arsten und die Luftlinie; mehr
Beschriftung stand dort übereinander. Der Flughafen ist gar nicht beschriftet, weil er auf
breiten Bildschirmen unter der Texttafel läge.

## Karte: warum nicht der alte Screenshot

Die alte Seite zeigt einen Google-Maps-Screenshot von 2013 (`arsten.png`). Der wird **nicht**
übernommen:

1. **Rechte.** Kartenkacheln von Google dürfen nicht als Bild weiterverbreitet werden, und der
   Screenshot trägt nicht einmal die Quellenangabe.
2. **Optik.** Eine helle Straßenkarte ist auf der dunklen Seite ein Fremdkörper.

Stattdessen ist die Karte ein eigenes SVG aus OpenStreetMap-Daten (ODbL; Pflicht ist der
Hinweis „© OpenStreetMap-Mitwirkende", er steht unter der Karte). Gezeichnet sind nur die
Elemente, die zur Orientierung nötig sind: Weser, Werdersee und kleine Flüsse, Autobahnen und
Zubringer, die Ortsteilgrenze von Arsten. Dazu Gradnetz mit Mono-Beschriftung, ein Maßstab,
und am Arsten-Schwerpunkt ein Fadenkreuz mit Indexring, dasselbe Motiv wie die Indexe der
Jahresachse. Eine gestrichelte Linie misst die Luftlinie zum Marktplatz.

Bewusst markiert ist der **Schwerpunkt des Ortsteils**, nicht Eddys Haus. Die Adresse gehört
nicht auf die Karte.

### Daten erzeugen

`app/utils/arsten-map.ts` ist generiert. Abfrage (Overpass, z. B. über
`overpass.private.coffee`, weil `overpass-api.de` oft ausgelastet ist):

```
[out:json][timeout:90];
(
  relation["boundary"="administrative"]["name"="Arsten"];
  way["waterway"="river"](52.99,8.60,53.10,9.04);
  way["highway"~"^(motorway|trunk)$"](52.99,8.60,53.10,9.04);
  relation["natural"="water"]["name"~"Weser|Werdersee"](52.99,8.60,53.10,9.04);
  way["natural"="water"]["name"~"Weser|Werdersee"](52.99,8.60,53.10,9.04);
);
out geom;
```

Projektion auf den Ausschnitt 8,64–9,00° O × 53,006–53,088° N, 1000 Einheiten breit, Längen
mit cos(53,05°) gestaucht (bei 8 km Höhe genau genug). Linien per Douglas-Peucker mit
0,5–1,4 Einheiten Toleranz vereinfacht. Achtung bei geschlossenen Ringen: Anfang und Ende
sind derselbe Punkt, die Bezugsgerade hat also die Länge 0; der Ring muss vorher geteilt
werden, sonst schrumpft jedes Polygon auf zwei Punkte.

### Beschriftung als HTML, nicht als SVG-Text

Ortsnamen liegen als absolut positionierte HTML-Elemente über dem SVG (Position in Prozent der
Kartenfläche, `mapPercent` in `app/utils/ueber-mich.ts`). SVG-Text würde mit der Karte
skalieren und auf dem Telefon auf 6 px schrumpfen. So bleiben die Labels bei jeder Breite in
der Typo-Skala.

Auf schmalen Bildschirmen ist die Karte doppelt so breit wie ihr Rahmen und so verschoben,
dass Arsten in der Mitte liegt. Weil Beschriftung und SVG in derselben Fläche stecken, wandern
die Prozentpositionen ohne Umrechnung mit.

## Fotos

Liegen in `public/images/ueber-mich/`, neu kodiert ohne EXIF-Daten (die Originale aus
WordPress tragen Kamera-Metadaten). Pfade, Maße und Alternativtexte stehen in
`ABOUT_PHOTOS` (`app/utils/ueber-mich.ts`); `ueber-mich.spec.ts` prüft, dass die Dateien
existieren und die Maße stimmen, wie bei den Werkbank-Vitrinen.
