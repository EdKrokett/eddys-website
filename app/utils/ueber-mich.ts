import type { AboutPhoto, MapGeometry, MapPlace, MapPoint } from '#shared/types/ueber-mich'

/**
 * Inhalte und Kartenrechnung für den Einstieg der Über-mich-Seite.
 * Konzept: docs/ueber-mich-einstieg.md.
 */

/**
 * Die beiden Fotos aus der alten Seite blog.eduard-andrae.de/persoenliches.
 *
 * Neu kodiert ohne EXIF-Daten. Beim Austausch `width`/`height` mitziehen,
 * `ueber-mich.spec.ts` prüft beides gegen die echte Datei.
 */
export const ABOUT_PHOTOS = {
  colorRun: {
    src: '/images/ueber-mich/color-run-2013.jpg',
    width: 1041,
    height: 1498,
    alt:
      'Kathi und Eddy nach dem Color Run 2013, Arm in Arm und von Kopf bis Fuß mit bunter '
      + 'Farbe bepudert. Eddy trägt die Startnummer 35264 und eine Action-Cam in der Hand.',
    caption: 'Kathi & Eddy beim Color Run 2013',
  },
  karstadtMarathon: {
    src: '/images/ueber-mich/karstadt-marathon-2008.jpg',
    width: 603,
    height: 720,
    alt:
      'Eddy auf den letzten Metern des Karstadt-Marathons 2008: Startnummer 05560, beide '
      + 'Fäuste geballt, das Gesicht verzerrt vor Anstrengung und Freude.',
    caption: 'Karstadt-Marathon 2008',
  },
} as const satisfies Record<string, AboutPhoto>

/**
 * Beschriftete Orte auf dem Lageplan, in Karteneinheiten (siehe ARSTEN_MAP).
 *
 * Marktplatz und Weserstadion sind aus ihren echten Koordinaten projiziert; die
 * Gewässernamen sitzen dort, wo sie weder die Luftlinie noch deren Maß verdecken.
 * Der Flughafen ist bewusst nicht beschriftet: Er läge auf breiten Bildschirmen
 * unter der Texttafel.
 */
export const ARSTEN_MARKTPLATZ: MapPoint = { x: 464.2, y: 55.9 }

export const ARSTEN_PLACES: MapPlace[] = [
  { label: 'Bremen-Mitte', at: ARSTEN_MARKTPLATZ, primary: true },
  { label: 'Weserstadion', at: { x: 548.9, y: 99.8 } },
  { label: 'Weser', at: { x: 712, y: 318 }, water: true, primary: true },
  { label: 'Werdersee', at: { x: 588, y: 162 }, water: true },
]

/** Koordinaten des Arsten-Schwerpunkts (53,0284° N, 8,8462° O), gerundet. */
export const ARSTEN_COORDS = '53,03° N · 8,85° O'

/** Beschriftung des Gradnetzes, passend zu ARSTEN_MAP.gridX / gridY. */
export const MAP_GRID_LON_LABELS = ['8,70° O', '8,75° O', '8,80° O', '8,85° O', '8,90° O', '8,95° O']
export const MAP_GRID_LAT_LABELS = ['53,02° N', '53,04° N', '53,06° N', '53,08° N']

/**
 * Position eines Kartenpunkts in Prozent der Kartenfläche — für HTML-Beschriftung,
 * die über dem SVG liegt und deshalb nicht mitskaliert.
 *
 * PRE: geometry.width > 0, geometry.height > 0
 */
export function mapPercent(
  point: MapPoint,
  geometry: Pick<MapGeometry, 'width' | 'height'>,
): { left: string, top: string } {
  if (!(geometry.width > 0) || !(geometry.height > 0)) {
    throw new RangeError('Kartengröße muss positiv sein')
  }

  const round = (value: number) => Math.round(value * 100) / 100
  return {
    left: `${round((point.x / geometry.width) * 100)}%`,
    top: `${round((point.y / geometry.height) * 100)}%`,
  }
}

/** Luftlinie zwischen zwei Kartenpunkten in Kilometern. */
export function mapDistanceKm(
  a: MapPoint,
  b: MapPoint,
  geometry: Pick<MapGeometry, 'metersPerUnit'>,
): number {
  return (Math.hypot(b.x - a.x, b.y - a.y) * geometry.metersPerUnit) / 1000
}

/**
 * Kilometerangabe mit deutschem Dezimalkomma ("5,9 km").
 *
 * Von Hand statt über `toLocaleString('de-DE')`: Server und Browser können
 * unterschiedliche ICU-Daten haben, und eine abweichende Ausgabe wäre ein
 * Hydration-Mismatch.
 */
export function formatKm(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`
}
