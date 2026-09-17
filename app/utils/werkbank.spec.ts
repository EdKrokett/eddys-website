import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { barWidth, MIN_BAR_PERCENT, WERKBANK_SCREENSHOT, WERKBANK_STARTSEITE_SHOT } from './werkbank'

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
