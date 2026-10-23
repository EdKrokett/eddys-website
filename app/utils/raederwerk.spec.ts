import { describe, expect, it } from 'vitest'
import {
  centerDistance,
  gearPath,
  meshCenter,
  meshPhase,
  MIN_TEETH,
  pitchRadius,
  tipRadius,
  turnSeconds,
} from './raederwerk'

/** Abstand eines Winkels zum nächsten Vielfachen der Teilung, in Teilungen (0 … 0,5). */
function offsetInPitches(angle: number, phase: number, teeth: number): number {
  const steps = (angle - phase) / (360 / teeth)
  const fraction = steps - Math.floor(steps)

  return Math.min(fraction, 1 - fraction)
}

describe('pitchRadius / tipRadius / centerDistance', () => {
  it('rechnet den Teilkreis als m · z / 2', () => {
    expect(pitchRadius(72, 5)).toBe(180)
  })

  it('legt den Kopfkreis ein Modul über den Teilkreis', () => {
    expect(tipRadius(18, 5)).toBe(50)
  })

  it('rechnet den Achsabstand als Summe der Teilkreise', () => {
    expect(centerDistance(72, 18, 5)).toBe(225)
  })

  it('lehnt zu wenige Zähne ab', () => {
    expect(() => pitchRadius(MIN_TEETH - 1, 5)).toThrow(RangeError)
  })

  it('lehnt eine gebrochene Zähnezahl ab', () => {
    expect(() => pitchRadius(12.5, 5)).toThrow(RangeError)
  })

  it('lehnt Modul 0, negativ und NaN ab', () => {
    expect(() => pitchRadius(20, 0)).toThrow(RangeError)
    expect(() => pitchRadius(20, -1)).toThrow(RangeError)
    expect(() => pitchRadius(20, Number.NaN)).toThrow(RangeError)
  })
})

describe('meshCenter', () => {
  it('legt den Mittelpunkt im Uhrzeigersinn ab der x-Achse (SVG zählt y nach unten)', () => {
    const point = meshCenter({ x: 100, y: 100 }, 50, 90)

    expect(point.x).toBeCloseTo(100, 6)
    expect(point.y).toBeCloseTo(150, 6)
  })
})

describe('meshPhase', () => {
  it('setzt bei zwei gleichen Rädern die Lücke genau gegenüber dem Zahn', () => {
    // Treibendes Rad hat bei 0° einen Zahn; das getriebene berührt bei 180°. Seine Zähne
    // liegen bei 171° und 189°, die Lücke also genau bei 180°.
    expect(meshPhase({ teeth: 20, phase: 0 }, 20, 0)).toBe(171)
  })

  it('rechnet die Phase für das Ritzel am großen Rad des Intros', () => {
    expect(meshPhase({ teeth: 72, phase: 0 }, 18, -50)).toBeCloseTo(280, 6)
  })

  it('setzt am Berührpunkt Zahn gegen Lücke, auch bei krummen Winkeln', () => {
    const driver = { teeth: 36, phase: 13 }
    const angle = 40
    const phase = meshPhase(driver, 15, angle)

    // Was beim Treibenden vom Zahn entfernt ist, muss beim Getriebenen von der Lücke
    // gleich weit entfernt sein: Die beiden Abstände ergänzen sich zu einer halben Teilung.
    const driverOffset = offsetInPitches(angle, driver.phase, driver.teeth)
    const drivenOffset = offsetInPitches(angle + 180, phase, 15)
    expect(driverOffset + drivenOffset).toBeCloseTo(0.5, 6)
  })

  it('bleibt im Eingriff, wenn beide Räder im Übersetzungsverhältnis weiterdrehen', () => {
    const before = meshPhase({ teeth: 72, phase: 0 }, 18, -50)
    const rotation = 37
    const after = meshPhase({ teeth: 72, phase: rotation }, 18, -50)
    // Das Ritzel dreht gegenläufig und um den Faktor 72/18 schneller.
    const expected = before - rotation * (72 / 18)
    const pitch = 360 / 18
    const drift = (((after - expected) % pitch) + pitch) % pitch

    expect(Math.min(drift, pitch - drift)).toBeCloseTo(0, 6)
  })

  it('liefert immer einen Winkel in [0, 360)', () => {
    const phase = meshPhase({ teeth: 40, phase: -725 }, 12, -400)

    expect(phase).toBeGreaterThanOrEqual(0)
    expect(phase).toBeLessThan(360)
  })
})

describe('turnSeconds', () => {
  it('lässt das kleinere Rad im Verhältnis der Zähne schneller drehen', () => {
    expect(turnSeconds(720, 72, 18)).toBe(180)
  })
})

describe('gearPath', () => {
  /** Alle Koordinatenpaare aus einem Pfad, ohne Bogen-Parameter. */
  function radii(path: string): number[] {
    return [...path.matchAll(/[MLQ] (-?[\d.]+) (-?[\d.]+)(?: (-?[\d.]+) (-?[\d.]+))?/g)]
      .flatMap(match => [[match[1], match[2]], [match[3], match[4]]])
      .filter(([x, y]) => x !== undefined && y !== undefined)
      .map(([x, y]) => Math.hypot(Number(x), Number(y)))
  }

  it('zeichnet pro Zahn genau zwei Kopfbögen', () => {
    const path = gearPath({ teeth: 30, module: 5 })

    expect(path.match(/Q /g)).toHaveLength(60)
  })

  it('bleibt innerhalb des Kopfkreises', () => {
    const path = gearPath({ teeth: 30, module: 5 })

    expect(Math.max(...radii(path))).toBeLessThanOrEqual(tipRadius(30, 5) + 0.01)
  })

  it('schneidet pro Speiche ein Fenster und eine Bohrung aus', () => {
    const path = gearPath({ teeth: 72, module: 5, spokes: 5, hubRadius: 30, boreRadius: 8 })

    // Zahnkranz + 5 Fenster + Bohrung = 7 Teilpfade.
    expect(path.match(/M /g)).toHaveLength(7)
  })

  it('lässt die Fenster weg, wenn die Nabe nicht in den Kranz passt', () => {
    const path = gearPath({ teeth: 12, module: 5, spokes: 4, hubRadius: 40 })

    expect(path.match(/M /g)).toHaveLength(1)
  })

  it('wirft bei ungültiger Zähnezahl, statt einen kaputten Pfad zu liefern', () => {
    expect(() => gearPath({ teeth: 3, module: 5 })).toThrow(RangeError)
  })
})
