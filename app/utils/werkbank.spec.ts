import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  barWidth,
  MIN_BAR_PERCENT,
  sumParts,
  WERKBANK_MAKE_METRIKEN,
  WERKBANK_PROMOTION_SUMME,
  WERKBANK_PROMOTION_TEILE,
  WERKBANK_SCREENSHOT,
  WERKBANK_STARTSEITE_SHOT,
  WERKBANK_SZENARIEN,
} from './werkbank'

/**
 * `barWidth` rechnet die Balkenlänge der Kennzahlen-Vergleiche auf der Werkbank.
 *
 * PRE:  value >= 0, max > 0
 * POST: Ergebnis in [MIN_BAR_PERCENT, 100]
 * INV:  value === max  ⇒  Ergebnis === 100
 */
describe('barWidth', () => {
  it('rechnet einen Anteil in Prozent um', () => {
    expect(barWidth(2562, 7296)).toBeCloseTo(35.115, 2)
  })

  it('gibt dem größten Wert der Reihe die volle Breite', () => {
    expect(barWidth(7296, 7296)).toBe(100)
  })

  it('deckelt einen Wert über dem Maximum bei 100 statt über den Rand zu laufen', () => {
    // Kann passieren, wenn jemand das Maximum von Hand setzt statt es zu berechnen.
    expect(barWidth(9000, 7296)).toBe(100)
  })

  it('hält einen sehr kleinen Anteil auf der Mindestbreite sichtbar', () => {
    // 1 von 13.321 wären 0,0075% — ein Balken, den niemand sieht.
    expect(barWidth(1, 13321)).toBe(MIN_BAR_PERCENT)
  })

  it('gibt bei value = 0 die Mindestbreite zurück, nicht 0', () => {
    expect(barWidth(0, 7296)).toBe(MIN_BAR_PERCENT)
  })

  it('fängt max = 0 ab, statt durch null zu teilen', () => {
    expect(barWidth(115, 0)).toBe(MIN_BAR_PERCENT)
  })

  it('fängt ein negatives Maximum ab', () => {
    expect(barWidth(115, -10)).toBe(MIN_BAR_PERCENT)
  })

  it('fängt einen negativen Wert ab, statt einen Balken nach links zu rechnen', () => {
    expect(barWidth(-5, 100)).toBe(MIN_BAR_PERCENT)
  })

  it('fängt NaN ab, statt ein ungültiges width ins Stylesheet zu schreiben', () => {
    expect(barWidth(Number.NaN, 100)).toBe(MIN_BAR_PERCENT)
    expect(barWidth(100, Number.NaN)).toBe(MIN_BAR_PERCENT)
  })

  it('fängt Infinity ab', () => {
    expect(barWidth(Number.POSITIVE_INFINITY, 100)).toBe(MIN_BAR_PERCENT)
  })
})

/**
 * Die beiden Vitrinen der Seite.
 *
 * Diese Tests prüfen keine Logik, sondern eine Zusage: `docs/werkbank.md` verlangt beim
 * Austausch eines Screenshots, `width` und `height` mitzuziehen. Eine Regel in einem
 * Dokument wird vergessen; ein Test nicht. Beides geht still schief — ein falscher Pfad
 * ergibt eine Lücke im Layout, falsche Maße einen Sprung beim Nachladen.
 */
const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url))

const SHOTS = [
  ['WERKBANK_SCREENSHOT', WERKBANK_SCREENSHOT],
  ['WERKBANK_STARTSEITE_SHOT', WERKBANK_STARTSEITE_SHOT],
] as const

describe.each(SHOTS)('%s', (_name, shot) => {
  it('ist gesetzt — sonst fehlt die Vitrine auf der Seite', () => {
    expect(shot).not.toBeNull()
  })

  it('zeigt auf eine Datei, die es in public/ wirklich gibt', async () => {
    expect(shot!.src.startsWith('/')).toBe(true)
    await expect(access(join(PUBLIC_DIR, shot!.src))).resolves.toBeUndefined()
  })

  it('trägt die Maße der echten Datei, damit das Layout beim Nachladen nicht springt', async () => {
    const { width, height } = await sharp(join(PUBLIC_DIR, shot!.src)).metadata()

    expect(width).toBe(shot!.width)
    expect(height).toBe(shot!.height)
  })

  it('hat einen Alternativtext, der die Bildunterschrift nicht nur wiederholt', () => {
    expect(shot!.alt.length).toBeGreaterThan(40)
  })
})

describe('WERKBANK_STARTSEITE_SHOT.href', () => {
  it('ist eine absolute https-Adresse — die Vitrine öffnet sie in einem neuen Tab', () => {
    // Ein relativer Pfad würde mit target="_blank" einen zweiten Tab derselben Seite
    // aufmachen, statt zum Beleg zu führen.
    expect(WERKBANK_STARTSEITE_SHOT?.href).toBe('https://trusted-blogs.com/')
  })
})

/**
 * `sumParts` rechnet aus der Stückliste von „Promotion erstellen“ Modulsumme und
 * Szenarienzahl.
 *
 * PRE:  `modules` ist, wo gesetzt, eine ganze Zahl > 0
 * POST: modules = Summe aller gesetzten `modules`; scenarios = Anzahl Teile mit `modules`
 * INV:  Ein Teil ohne `modules` (die Freigabe) zählt in keiner Summe
 */
describe('sumParts', () => {
  it('addiert die Module und zählt die Teile mit Modulen', () => {
    expect(sumParts([
      { pos: '01', name: 'A', text: 'a', modules: 10 },
      { pos: '02', name: 'B', text: 'b', modules: 5 },
    ])).toEqual({ modules: 15, scenarios: 2 })
  })

  it('lässt einen Teil ohne Module aus beiden Summen heraus', () => {
    // Die Freigabe ist ein Mensch, kein Szenario. Zählte sie mit, stünde „7 Szenarien“.
    expect(sumParts([
      { pos: '01', name: 'A', text: 'a', modules: 10 },
      { pos: '02', name: 'Freigabe', text: 'von Hand' },
    ])).toEqual({ modules: 10, scenarios: 1 })
  })

  it('gibt für eine leere Liste null und null zurück, nicht NaN', () => {
    expect(sumParts([])).toEqual({ modules: 0, scenarios: 0 })
  })
})

/**
 * Die Zahlen zum Umbau vom 13.11.2026 stehen an drei Stellen der Seite: Stückliste,
 * Tabelle, Kennzahlenleiste. Diese Tests halten sie an den Fakten aus Make fest.
 */
describe('Promotion erstellen nach dem Umbau', () => {
  it('kommt auf 129 Module in 6 Szenarien', () => {
    expect(WERKBANK_PROMOTION_SUMME).toEqual({ modules: 129, scenarios: 6 })
  })

  it('nummeriert die Stückliste wie die Zeichnung, lückenlos von 01 bis 07', () => {
    expect(WERKBANK_PROMOTION_TEILE.map(part => part.pos))
      .toEqual(['01', '02', '03', '04', '05', '06', '07'])
  })

  it('hat genau eine Position ohne Module, und das ist die Freigabe', () => {
    const manual = WERKBANK_PROMOTION_TEILE.filter(part => part.modules === undefined)

    expect(manual.map(part => part.name)).toEqual(['Freigabe'])
  })

  it('zeigt in der Tabelle dieselbe Summe wie die Stückliste', () => {
    const row = WERKBANK_SZENARIEN.find(scenario => scenario.name === 'Promotion erstellen')

    expect(row?.modules).toBe(129)
    expect(row?.scenarios).toBe(6)
    expect(row?.note).toBe('umgebaut 11/2026')
  })

  it('zeigt in der Kennzahlenleiste dieselbe Summe wie die Stückliste', () => {
    expect(WERKBANK_MAKE_METRIKEN[1]).toEqual({
      value: '129',
      label: 'Module in „Promotion erstellen“, verteilt auf sechs Szenarien',
      accent: true,
    })
  })

  it('nennt 25 aktive Szenarien', () => {
    expect(WERKBANK_MAKE_METRIKEN[0]?.value).toBe('25')
  })
})
