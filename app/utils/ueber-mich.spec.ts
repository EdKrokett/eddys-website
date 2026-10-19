import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { ARSTEN_MAP } from './arsten-map'
import {
  ABOUT_PHOTOS,
  ARSTEN_MARKTPLATZ,
  ARSTEN_PLACES,
  formatKm,
  MAP_GRID_LAT_LABELS,
  MAP_GRID_LON_LABELS,
  mapDistanceKm,
  mapPercent,
} from './ueber-mich'

/**
 * `mapPercent` setzt die HTML-Beschriftung über das Karten-SVG.
 *
 * PRE:  width > 0, height > 0
 * POST: Punkt im Rahmen ⇒ beide Werte in [0 %, 100 %]
 */
describe('mapPercent', () => {
  it('rechnet einen Punkt in Prozent der Kartenfläche um', () => {
    expect(mapPercent({ x: 250, y: 100 }, { width: 1000, height: 400 }))
      .toEqual({ left: '25%', top: '25%' })
  })

  it('rundet auf zwei Nachkommastellen, damit kein 33.333333333%-Rauschen im HTML steht', () => {
    expect(mapPercent({ x: 1, y: 2 }, { width: 3, height: 3 }))
      .toEqual({ left: '33.33%', top: '66.67%' })
  })

  it('liefert für den Ursprung 0 %', () => {
    expect(mapPercent({ x: 0, y: 0 }, { width: 1000, height: 400 }))
      .toEqual({ left: '0%', top: '0%' })
  })

  it('wirft bei einer Kartengröße von 0 statt Infinity% ins Layout zu schreiben', () => {
    expect(() => mapPercent({ x: 1, y: 1 }, { width: 0, height: 400 })).toThrow(RangeError)
    expect(() => mapPercent({ x: 1, y: 1 }, { width: 1000, height: Number.NaN })).toThrow(RangeError)
  })
})

describe('mapDistanceKm', () => {
  it('misst die Luftlinie über den Maßstab der Karte', () => {
    // 3-4-5-Dreieck: 500 Einheiten à 10 m sind 5 km.
    expect(mapDistanceKm({ x: 0, y: 0 }, { x: 300, y: 400 }, { metersPerUnit: 10 })).toBe(5)
  })

  it('ist 0 für denselben Punkt', () => {
    expect(mapDistanceKm({ x: 7, y: 7 }, { x: 7, y: 7 }, { metersPerUnit: 24 })).toBe(0)
  })

  it('ergibt für Arsten bis zum Marktplatz die nachgemessenen 5,9 km', () => {
    // Gegenprobe zur Projektion: Die Haversine-Formel auf den Originalkoordinaten
    // (53,0284/8,8462 → 53,0759/8,8071) ergibt ebenfalls 5,9 km.
    expect(formatKm(mapDistanceKm(ARSTEN_MAP.center, ARSTEN_MARKTPLATZ, ARSTEN_MAP))).toBe('5,9 km')
  })
})

describe('formatKm', () => {
  it('setzt ein deutsches Dezimalkomma mit genau einer Nachkommastelle', () => {
    expect(formatKm(5.8932)).toBe('5,9 km')
    expect(formatKm(2)).toBe('2,0 km')
  })
})

describe('ARSTEN_PLACES', () => {
  it.each(ARSTEN_PLACES.map(place => [place.label, place] as const))(
    '%s liegt innerhalb der Karte',
    (_label, place) => {
      expect(place.at.x).toBeGreaterThan(0)
      expect(place.at.x).toBeLessThan(ARSTEN_MAP.width)
      expect(place.at.y).toBeGreaterThan(0)
      expect(place.at.y).toBeLessThan(ARSTEN_MAP.height)
    },
  )

  it('hat für jede Gradnetzlinie genau eine Beschriftung', () => {
    expect(MAP_GRID_LON_LABELS).toHaveLength(ARSTEN_MAP.gridX.length)
    expect(MAP_GRID_LAT_LABELS).toHaveLength(ARSTEN_MAP.gridY.length)
  })

  it('Arsten selbst liegt innerhalb der Karte', () => {
    expect(ARSTEN_MAP.center.x).toBeGreaterThan(0)
    expect(ARSTEN_MAP.center.x).toBeLessThan(ARSTEN_MAP.width)
    expect(ARSTEN_MAP.center.y).toBeLessThan(ARSTEN_MAP.height)
  })
})

/**
 * Wie bei den Werkbank-Vitrinen: falscher Pfad = Lücke im Layout, falsche Maße =
 * Sprung beim Nachladen. Beides fällt im Browser nicht auf, hier schon.
 */
const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url))

describe.each(Object.entries(ABOUT_PHOTOS))('ABOUT_PHOTOS.%s', (_name, photo) => {
  it('zeigt auf eine Datei, die es in public/ wirklich gibt', async () => {
    expect(photo.src.startsWith('/')).toBe(true)
    await expect(access(join(PUBLIC_DIR, photo.src))).resolves.toBeUndefined()
  })

  it('trägt die Maße der echten Datei', async () => {
    const { width, height } = await sharp(join(PUBLIC_DIR, photo.src)).metadata()

    expect(width).toBe(photo.width)
    expect(height).toBe(photo.height)
  })

  it('enthält keine EXIF-Daten mehr', async () => {
    const { exif } = await sharp(join(PUBLIC_DIR, photo.src)).metadata()

    expect(exif).toBeUndefined()
  })

  it('hat einen Alternativtext, der mehr sagt als die Bildunterschrift', () => {
    expect(photo.alt.length).toBeGreaterThan(photo.caption.length + 40)
  })
})
