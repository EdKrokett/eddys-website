import { describe, expect, it } from 'vitest'
import { barWidth, MIN_BAR_PERCENT } from './werkbank'

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
