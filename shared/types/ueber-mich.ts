/**
 * Typen für den Einstieg der Über-mich-Seite: Foto-Tafeln und Lageplan.
 * Konzept: docs/ueber-mich-einstieg.md.
 */

/** Ein Foto als Tafel im Raster, mit Bildunterschrift. */
export interface AboutPhoto {
  /** Pfad unter public/, beginnt mit "/". */
  src: string
  /** Maße der echten Datei: verhindern den Layoutsprung beim Nachladen. */
  width: number
  height: number
  alt: string
  /** Sichtbare Bildunterschrift, kurz. Der Alternativtext beschreibt, sie benennt. */
  caption: string
}

/** Punkt im Koordinatensystem der Karte (viewBox-Einheiten, y nach unten). */
export interface MapPoint {
  x: number
  y: number
}

/** Generierte Kartengeometrie, siehe app/utils/arsten-map.ts. */
export interface MapGeometry {
  width: number
  height: number
  /** Meter pro viewBox-Einheit — Grundlage für Maßstab und Luftlinie. */
  metersPerUnit: number
  /** Flächenschwerpunkt von Arsten. Bewusst nicht Eddys Adresse. */
  center: MapPoint
  /** x-Positionen der Längengrade 8,70° … 8,95° O (Schritt 0,05°). */
  gridX: number[]
  /** y-Positionen der Breitengrade 53,02° … 53,08° N (Schritt 0,02°). */
  gridY: number[]
  /** SVG-Pfaddaten je Ebene. */
  paths: {
    arsten: string
    lakes: string
    weser: string
    rivers: string
    motorways: string
    feeders: string
  }
}

/** Beschrifteter Ort auf der Karte. */
export interface MapPlace {
  label: string
  at: MapPoint
  /** Wichtige Orte bleiben auch auf dem Telefon beschriftet. */
  primary?: boolean
  /** Gewässernamen werden kursiv gesetzt, wie auf gedruckten Karten. */
  water?: boolean
}
