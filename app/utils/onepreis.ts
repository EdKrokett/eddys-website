import type { OnepreisExhibit, OnepreisFact } from '#shared/types/onepreis'

/**
 * Statische Inhalte der Gedenkseite `/1apreis`.
 *
 * Quelle des Fließtextes ist die alte WordPress-Seite `blog.eduard-andrae.de/1apreis/`;
 * die drei bewussten Abweichungen davon stehen in docs/1apreis-gedenkseite.md.
 *
 * Reine Daten, keine Logik: deshalb ohne eigene *.spec.ts (wie app/utils/cv.ts).
 */

/**
 * Eckdaten im Seitenkopf.
 *
 * Die beiden Zeiträume meinen bewusst Verschiedenes und werden deshalb getrennt
 * ausgewiesen: Der Shop lief über zwei Eigentümer hinweg von 2000 bis 2012, Eddys
 * eigene Zeit endete 2006. Siehe docs/1apreis-gedenkseite.md, Abschnitt „Datierung“.
 */
export const ONEPREIS_FACTS: OnepreisFact[] = [
  { value: '2000—2012', label: 'war der Shop online' },
  { value: '1999—2006', label: 'war es meiner' },
  { value: 'Steinhagen', label: 'bei Gütersloh' },
]

/**
 * Die vier archivierten Ansichten, in zeitlicher Folge.
 *
 * Die Reihenfolge ist die Anzeigereihenfolge auf der Zeitachse — hier umsortieren,
 * nicht im Template.
 */
export const ONEPREIS_EXHIBITS: OnepreisExhibit[] = [
  {
    year: '2000',
    title: 'Der Anfang',
    caption:
      'Rahmenlayout mit schwarzer Navigationsspalte: Warenkorb, Kundenforum, Partnerprogramm und das Anmeldefeld für „die 1A news“. In der Mitte die Quick-Suche nach Rubrik, Marke oder Stichwort, darunter zweispaltig die Top-Angebote. Die After-Sun-Kur von L’Oréal für 2,69, das Ferrari-Poloshirt für 29,90.',
    alt: 'Startseite von 1Apreis.de im Jahr 2000: schwarze Navigationsspalte links, zweispaltige Angebotsliste mit Streichpreisen rechts.',
    width: 640,
    height: 462,
  },
  {
    year: '2003',
    title: 'Mehr als 2.500 Schnäppchen',
    caption:
      'Die Rahmen sind weg, das Orange ist geblieben. Jedes Angebot trägt jetzt einen Rabattstempel neben dem Streichpreis, rechts stehen Werbeplätze, ein Gewinnspiel und der Wochen-Newsletter. Versace-Ohrclips minus 47 Prozent, Gillette-Rasierschaum minus 21.',
    alt: 'Startseite von 1Apreis.de im Jahr 2003: dreispaltige Angebotsliste mit Rabattstempeln, rechts eine Spalte mit Werbung und Newsletter-Anmeldung.',
    width: 640,
    height: 615,
  },
  {
    year: '2006',
    title: 'Unser letztes Jahr',
    caption:
      'Sechs Warenreiter von der Drogerieabteilung bis zu den Restposten, der Warenkorbstand oben rechts, in der Seitenspalte die Top-Seller der letzten 24 Stunden. Oben sitzt der Fuchs, der in unserer Zeit dazugekommen ist. Im Fuß steht die Zeile, die den ganzen Bogen datiert: 1Apreis.de GmbH 2000 bis 2006.',
    alt: 'Startseite von 1Apreis.de im Jahr 2006: Reiternavigation mit sechs Abteilungen, Fuchs-Maskottchen im Kopf, große Angebotsflächen mit Produktfotos.',
    width: 640,
    height: 932,
  },
  {
    year: '2012',
    title: 'Unter neuer Führung',
    caption:
      'Der Fuchs ist geblieben, der Slogan nicht: Aus „Markenartikel zu Hammerpreisen“ wurde „Gutes kann sooo günstig sein“. Vom Sortiment quer durch alle Bereiche waren vier Rubriken übrig, Möbel, Gartenmöbel, Elektro/Technik und Haushalt. Das Spitzenangebot der Woche war ein Gartenset für 199 statt 690 Euro.',
    alt: 'Startseite von 1Apreis.de im Jahr 2012: handgeschriebener Slogan neben dem Fuchs-Maskottchen, vier Rubriken in der Navigation, Gartenmöbel als Spitzenangebot.',
    width: 640,
    height: 731,
  },
]
