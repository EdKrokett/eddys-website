# Kooperationen: Übernahme der WordPress-Seite

Stand 08.11.2026. Beschreibt `app/pages/kooperationen.vue`, die Seite für Marken und
Agenturen, die mit Eddy zusammenarbeiten wollen.

## Herkunft

Übernommen von `blog.eduard-andrae.de/kooperationen/` (WordPress-Seite ID 17508, zuletzt
geändert 30.09.2026). Bis hierher hat die Catch-all-Route `app/pages/[...slug].vue`
`/kooperationen` per 301 dorthin weitergeleitet; mit der neuen Seite greift sie für diesen
Pfad nicht mehr, ohne dass irgendwo etwas nachgetragen werden muss.

Die Texte sind Eddys Wortlaut aus WordPress. Neu formuliert sind nur die Kurzbeschreibungen
unter den drei Bedingungen, der Vorspann der Referenzen und die Kontaktzeile unter dem
Auftragsschein. Die Seitentexte folgen denselben Schreibregeln wie der Blog (kein
Gedankenstrich als Satzverbinder, keine Antithesen-Paare).

## Aufbau

| Abschnitt | Inhalt | Anker |
| --- | --- | --- |
| Kopf | „Lust auf Kooperationen.“ plus Eddys Einleitung | — |
| Bedingungen | Thematischer Fit, Vergütung, rechtlich sauber; danach der ❤️-Satz | — |
| 01 Referenzen | Drei gekennzeichnete Beiträge, Link ins Werbung-Archiv | — |
| 02 Media-Kit | Vorschau-Screenshot plus Link auf das Media-Kit bei trusted blogs | `#mediakit` |
| 03 Buchung | Vier Vorteile von trusted blogs, Auftragsschein mit Buchungslink | `#trustedblogsbuchung` |

**Die beiden Anker heißen wie auf der WordPress-Seite** und dürfen nicht umbenannt werden:
Alte Links auf `/kooperationen/#mediakit` oder `#trustedblogsbuchung` landen nach dem Wechsel
auf dieser Seite und sollen ihr Ziel weiter treffen. Deshalb auch `useAnchorScroll()`, aus
demselben Grund wie auf `/trusted-blogs` (Schriftwechsel verschiebt das Ziel beim Direktaufruf).

## Entscheidungen

**Referenzen als Konstanten, nicht live aus WordPress.** Auf der alten Seite stand ein
„Neueste Beiträge“-Block, gefiltert auf die Kategorie `werbung` (ID 223). Die Kategorie hat
vier Beiträge, gezeigt wurden drei: Koasa Trail (2019), Tchibo (2015), BITburger (2015). Der
vierte (BMW, 2013) blieb draußen. Ein Live-Abruf bräuchte einen eigenen Kategorie-Filter in
`server/api/blog.get.ts` (`werbung` steht bewusst nicht in `BLOG_CATEGORIES`), einen Lade- und
Fehlerzustand und hätte den BMW-Beitrag sofort mit hineingeholt, sobald einer der drei aus der
Kategorie fällt. Die Auswahl ist kuratiert und ändert sich selten, also liegt sie in
`app/utils/kooperationen.ts`. Die Links führen auf `/blog/<slug>`, also auf diese Website.

Der „mehr“-Link der alten Seite zeigte auf das Schlagwort `werbung` (17 Beiträge, ID 73). Das
Schlagwort-Archiv gibt es auf `/blog` nicht, deshalb führt er weiter auf
`blog.eduard-andrae.de/tag/werbung/` (neuer Tab).

**Media-Kit liegt bei trusted blogs, nicht als PDF in WordPress.** Seit November 2026 pflegt
Eddy sein Media-Kit direkt bei trusted blogs: `trusted-blogs.com/mediakit/76` (dieselbe
Katalog-Nr. wie beim Buchungslink). Dort stehen Steckbrief, Themen, Kooperationsformate und
die von trusted blogs geprüften Kennzahlen (Quelle DataForSEO); die Schaltfläche „Als PDF
speichern“ erzeugt die Datei. Die Seite verlinkt deshalb nur noch dorthin, wie der
Buchungslink mit Eddys Referral-ID (`?ref=0000002D`). Das alte PDF (`EduardAndrae_MediaKit.pdf`, Stand 10.04.2025,
in der WordPress-Mediathek) wird nicht mehr verlinkt.

**Vorschau als lokaler Screenshot.** `public/images/kooperationen/mediakit-vorschau.jpg`
(1000×1360) zeigt die Media-Kit-Karte verkleinert. Eine Live-Einbettung (iframe) scheidet aus:
trusted-blogs.com sendet `X-Frame-Options: SAMEORIGIN`, und die Verbindung entstünde ohne
Klick (siehe nächster Punkt). Aufgenommen am 08.11.2026 mit Chrome headless, Fenster 1280×2400
bei doppelter Pixeldichte, Cookie-Banner nicht akzeptiert (es liegt außerhalb des Ausschnitts).
Danach auf die Karte beschnitten, 2 px innerhalb ihres Rands, damit keine hellen Ecken auf der
dunklen Seite stehen, und auf 1000 px Breite als JPEG (Fotos im Bild) verkleinert:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=2 --window-size=1280,2400 \
  --virtual-time-budget=15000 --screenshot=full2x.png https://www.trusted-blogs.com/mediakit/76
sips --cropOffset 124 436 -c 2296 1688 full2x.png
sips -Z 1360 -s format jpeg -s formatOptions 82 full2x.png --out mediakit-vorschau.jpg
```

Der Ausschnitt hängt am Layout der Media-Kit-Seite; ändert es sich, Versatz und Größe neu
bestimmen. Die Kennzahlen auf dem Bild altern: Bei größeren Änderungen am Media-Kit den
Screenshot neu aufnehmen und `KOOPERATION_MEDIAKIT.preview` (Maße, Aufnahmedatum) nachziehen.
**Vor dem Ersetzen ansehen:** Das Bild zeigt Eddys Fotos aus dem Media-Kit, darunter eines mit
einer zweiten Person. Alles öffentlich, aber ein Screenshot bleibt in der Git-Historie.

**Kein trusted-blogs-Banner.** Die alte Seite hat das Partnerbild direkt von
`trusted-blogs.com/banners/…` geladen. Hier wäre das eine automatische Verbindung zu einem
Drittanbieter, und die Datenschutzerklärung sagt zu, dass eine Verbindung zu verlinkten
Angeboten erst beim Klick entsteht. Den Platz übernimmt der Auftragsschein.

**Buchungslink** `trusted-blogs.com/marktplatz/katalog/76?ref=0000002D`: Katalog-Nr. 76 ist
Eddys Blog, `0000002D` seine Partner-Referral-ID. Beides gehört zusammen in die URL. Die ID
steht einmal als `TRUSTED_BLOGS_REF` in `app/utils/kooperationen.ts`; Buchungs- und
Media-Kit-Link setzen sie daraus zusammen.

**Navigation.** Kein fünfter Eintrag im Header: Die Seite richtet sich an eine bestimmte
Gruppe (Marken, Agenturen), die über einen direkten Link, über trusted blogs oder über die
Kontaktseite kommt. Sie steht im Footer unter „Seiten“, und auf `/kontakt` verlinkt das Wort
„Blog-Kooperation“ hierher.

## Design-Richtung

„Präzisionswerk“, Modus Auftragsannahme: die Theke der Werkstatt, an der Aufträge
angenommen werden.

- **Prüfprotokoll** für die drei Bedingungen: nummerierte Zeilen mit Haarlinien, vor jeder
  ein Index-Häkchen in Teal.
- **Ausgeführte Arbeiten** für die Referenzen: Bildstreifen mit Jahreszahl in Mono. Die
  Beitragsbilder sind extrem breite Banner (bis 5:1), deshalb ein gemeinsamer Ausschnitt.
- **Auftragsschein** als einziges auffälliges Element: Schein mit Abrisskante und
  Katalog-Nr. 76 als Auftragsnummer, darauf der Buchungslink als Teal-Fläche mit dunkler
  Schrift (Kontrastregel aus `main.css`).
- **Datenblatt auf der Prüfplatte** für das Media-Kit: Der Screenshot liegt gedämpft auf einer
  Platte mit vier Passermarken in Teal, die beim Hover nach außen fahren. Daneben die Eckdaten
  als Spezifikationszeilen in Mono. Der Link ist nur umrandet, die Teal-Fläche bleibt dem
  Auftragsschein.
- Nur Teal, kein Messing. Messing ist auf `/trusted-blogs` dem Ausgestellten vorbehalten.

## Qualitäts-Check (Q1–Q6)

1. **Externe Werte?** Keine zur Laufzeit. Alle Texte und URLs sind Konstanten, die
   Media-Kit-Vorschau ist eine lokale Datei mit festen Maßen. Die Beitragsbilder kommen per `NuxtImg` von `blog.eduard-andrae.de` (in `image.domains`
   freigegeben) und haben feste Maße, ein Ausfall lässt nichts springen.
2. **Fehlgeschlagener Request?** Entfällt, die Seite holt keine Daten.
3. **Leeres Ergebnis?** Entfällt, die Listen sind Literale.
4. **Reaktive Kette?** Keine Reaktivität.
5. **Test?** Keine neue Logik, nur Daten. Kein Spec nötig.
6. **Pre/Postconditions?** Entfällt aus demselben Grund.

## Offen

- Die WordPress-Seite `blog.eduard-andrae.de/kooperationen/` besteht weiter und ist damit
  doppelt vorhanden. Sinnvoll wäre eine Weiterleitung von dort hierher, sobald diese Seite live
  ist (Eddys Entscheidung, Änderung in WordPress).
- Das alte Media-Kit-PDF liegt weiter in der WordPress-Mediathek und ist unter seiner Adresse
  erreichbar. Löschen oder behalten ist Eddys Entscheidung (Änderung in WordPress).
