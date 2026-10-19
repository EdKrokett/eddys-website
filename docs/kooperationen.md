# Kooperationen: Übernahme der WordPress-Seite

Stand 19.10.2026. Beschreibt `app/pages/kooperationen.vue`, die Seite für Marken und
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
| 02 Media-Kit | Datenblatt-Link auf das PDF | `#mediakit` |
| 03 Buchung | Vier Vorteile von trusted blogs, Auftragsschein mit Buchungslink | `#trustedblogsbuchung` |

**Die beiden Anker heißen wie auf der WordPress-Seite** und dürfen nicht umbenannt werden:
Alte Links auf `/kooperationen/#mediakit` oder `#trustedblogsbuchung` landen nach dem Wechsel
auf dieser Seite und sollen ihr Ziel weiter treffen. Deshalb auch `useAnchorScroll()`, aus
demselben Grund wie auf `/werkbank` (Schriftwechsel verschiebt das Ziel beim Direktaufruf).

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

**Media-Kit wird verlinkt, nicht ins Repo kopiert.** Das PDF enthält Postanschrift und
Handynummer. Beides ist auf der WordPress-Seite schon öffentlich, im Git-Verlauf wäre es aber
dauerhaft, auch nach einem Austausch. Der Link zeigt direkt auf
`blog.eduard-andrae.de/wp-content/…`. Die alte Adresse über `www.eduard-andrae.de` ginge über
zwei Weiterleitungen (308 auf die Apex-Domain, dann 301 der Catch-all-Route).

Das Datenblatt nennt den Stand aus dem PDF (10.04.2025). Wird das PDF ersetzt, bekommt es in
WordPress eine neue Adresse: `KOOPERATION_MEDIAKIT` in `app/utils/kooperationen.ts` mit URL,
Größe und Stand nachziehen.

**Kein trusted-blogs-Banner.** Die alte Seite hat das Partnerbild direkt von
`trusted-blogs.com/banners/…` geladen. Hier wäre das eine automatische Verbindung zu einem
Drittanbieter, und die Datenschutzerklärung sagt zu, dass eine Verbindung zu verlinkten
Angeboten erst beim Klick entsteht. Den Platz übernimmt der Auftragsschein.

**Buchungslink** `trusted-blogs.com/marktplatz/katalog/76?ref=0000002D`: Katalog-Nr. 76 ist
Eddys Blog, `0000002D` seine Partner-Referral-ID. Beides gehört zusammen in die URL.

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
- Nur Teal, kein Messing. Messing ist auf `/werkbank` dem Ausgestellten vorbehalten.

## Qualitäts-Check (Q1–Q6)

1. **Externe Werte?** Keine zur Laufzeit. Alle Texte und URLs sind Konstanten. Die
   Beitragsbilder kommen per `NuxtImg` von `blog.eduard-andrae.de` (in `image.domains`
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
