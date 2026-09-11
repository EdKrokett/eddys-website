/**
 * Inhalte der Gedenkseite `/1apreis` (app/pages/1apreis.vue).
 *
 * Dateiname `onepreis` statt `1apreis`, weil die Seite zwar so heißen darf, ein
 * TypeScript-Bezeichner aber nicht mit einer Ziffer beginnen kann — die Konstante
 * `ONEPREIS_EXHIBITS` und der Dateiname bleiben so beieinander.
 *
 * Hintergrund und inhaltliche Entscheidungen: docs/1apreis-gedenkseite.md.
 */

/** Eine archivierte Ansicht des alten Shops, aufgenommen aus der Wayback Machine. */
export interface OnepreisExhibit {
  /** Jahr der Aufnahme. Zugleich der Dateiname unter `public/images/1apreis/`. */
  year: string
  /** Kurze Überschrift der Bildunterschrift, eine Zeile. */
  title: string
  /** Was auf dieser Ansicht konkret zu sehen ist. */
  caption: string
  /** Alternativtext des Screenshots. */
  alt: string
  /**
   * ANZEIGEmaße bei 640 px Spaltenbreite, nicht die Originalmaße des PNG.
   * Das Seitenverhältnis ist identisch, die Originalgrößen stehen in
   * docs/1apreis-gedenkseite.md.
   *
   * Zwei Gründe für die Angabe:
   *
   * 1. Ohne sie kennt der Browser das Seitenverhältnis vor dem Laden nicht und die
   *    Zeitachse springt beim Nachladen jedes Schaukastens. Die vier Screenshots
   *    haben bewusst unterschiedliche Formate (quer, quadratisch, hoch) — ein
   *    gemeinsames `aspect-ratio` im CSS wäre deshalb falsch.
   * 2. `width` ist für `NuxtImg` zugleich die ANGEFORDERTE Breite. Stünden hier die
   *    Originalbreiten (803—1105), würde der Vercel-Provider auf den nächsten
   *    erlaubten Wert aufrunden (1280) und das Bild über seine eigene Auflösung
   *    hinaus hochrechnen. Siehe den `screens`-Kommentar in nuxt.config.ts.
   */
  width: number
  height: number
}

/** Eine Eckdaten-Angabe im Seitenkopf: große Mono-Zahl über kleiner Beschriftung. */
export interface OnepreisFact {
  value: string
  label: string
}
