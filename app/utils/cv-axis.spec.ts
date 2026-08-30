import type { CvStation } from '#shared/types/cv'
import { describe, expect, it } from 'vitest'
import { assignLanes, buildAxisModel, formatDuration, stationKey } from './cv-axis'

/** Referenzjahr aller Tests — fest, damit die Erwartungen nicht jedes Jahr kippen. */
const NOW = 2026

function station(overrides: Partial<CvStation> = {}): CvStation {
  return {
    period: '2010—2014',
    startYear: 2010,
    endYear: 2014,
    role: 'Project Manager',
    company: 'hmmh multimediahaus AG',
    description: 'Internationales Projektmanagement.',
    ...overrides,
  }
}

describe('formatDuration', () => {
  it('rechnet eine abgeschlossene Station in Jahre um', () => {
    expect(formatDuration(station({ startYear: 1991, endYear: 1999 }), NOW)).toBe('8 Jahre')
  })

  it('setzt den Singular bei genau einem Jahr', () => {
    expect(formatDuration(station({ startYear: 2015, endYear: 2016 }), NOW)).toBe('1 Jahr')
  })

  it('rechnet eine laufende Station gegen das Referenzjahr', () => {
    const laufend = station({ startYear: 2016, endYear: undefined, current: true })
    expect(formatDuration(laufend, NOW)).toBe('10 Jahre')
  })

  it('nennt einen Zeitraum unter einem Jahr beim Namen statt "0 Jahre"', () => {
    expect(formatDuration(station({ startYear: 2020, endYear: 2020 }), NOW)).toBe('unter einem Jahr')
  })

  it('fängt ein Endjahr vor dem Startjahr ab, statt negativ zu rechnen', () => {
    // Tippfehler in cv.ts: die Achse soll trotzdem etwas Sinnvolles zeigen.
    expect(formatDuration(station({ startYear: 2010, endYear: 2004 }), NOW)).toBe('unter einem Jahr')
  })
})

describe('assignLanes', () => {
  it('hält nahtlos aufeinanderfolgende Stationen in derselben Spur', () => {
    // Das ist der Kern: 1999 endet die eine, 1999 beginnt die nächste. Würde das als
    // Überlappung gelten, zickzackte der ganze Werdegang zwischen zwei Spuren.
    const stations = [
      station({ startYear: 1991, endYear: 1999 }),
      station({ startYear: 1999, endYear: 2006 }),
      station({ startYear: 2006, endYear: 2008 }),
    ]
    expect(assignLanes(stations, NOW)).toEqual([0, 0, 0])
  })

  it('schiebt eine echt überlappende Station in die zweite Spur', () => {
    const stations = [
      station({ startYear: 2016, endYear: undefined }),
      station({ startYear: 2018, endYear: undefined }),
    ]
    expect(assignLanes(stations, NOW)).toEqual([0, 1])
  })

  it('braucht für drei gleichzeitig laufende Stationen drei Spuren', () => {
    const stations = [
      station({ startYear: 2016, endYear: undefined }),
      station({ startYear: 2018, endYear: undefined }),
      station({ startYear: 2020, endYear: undefined }),
    ]
    expect(assignLanes(stations, NOW)).toEqual([0, 1, 2])
  })

  it('gibt eine frei gewordene Spur wieder frei', () => {
    const stations = [
      station({ startYear: 2000, endYear: 2010 }),
      station({ startYear: 2002, endYear: 2004 }), // parallel → Spur 1
      station({ startYear: 2006, endYear: 2008 }), // Spur 1 ist wieder frei
    ]
    expect(assignLanes(stations, NOW)).toEqual([0, 1, 1])
  })

  it('kommt mit einer leeren Liste aus', () => {
    expect(assignLanes([], NOW)).toEqual([])
  })
})

describe('buildAxisModel', () => {
  const stations = [
    station({ company: 'trusted blogs GmbH', startYear: 2016, endYear: undefined, current: true }),
    station({ company: 'Juwelier Andrae', startYear: 1991, endYear: 1999 }),
    station({ company: '1Apreis.de GmbH', startYear: 1999, endYear: 2006 }),
  ]

  it('rundet den Zeitraum nach außen auf volle fünf Jahre', () => {
    const model = buildAxisModel(stations, NOW)
    expect(model.minYear).toBe(1990)
    expect(model.maxYear).toBe(2030)
  })

  it('sortiert die Segmente nach Startjahr, unabhängig von der Eingabereihenfolge', () => {
    const model = buildAxisModel(stations, NOW)
    expect(model.segments.map(s => s.startYear)).toEqual([1991, 1999, 2016])
  })

  it('setzt das Ende laufender Stationen auf das Referenzjahr und markiert sie', () => {
    const laufend = buildAxisModel(stations, NOW).segments.at(-1)
    expect(laufend?.endYear).toBe(2026)
    expect(laufend?.current).toBe(true)
  })

  it('rechnet Offset und Breite als Prozent des Gesamtzeitraums', () => {
    // 1991 liegt 1 von 40 Jahren hinter 1990, die Station dauert 8 von 40 Jahren.
    const juwelier = buildAxisModel(stations, NOW).segments[0]
    expect(juwelier?.offsetPct).toBeCloseTo(2.5, 5)
    expect(juwelier?.widthPct).toBeCloseTo(20, 5)
  })

  it('hält eine Ein-Jahres-Station auf einer sichtbaren Mindestbreite', () => {
    // 1 von 40 Jahren wären 2,5 % — hier bewusst geprüft an einem noch kürzeren Zeitraum.
    const kurz = buildAxisModel(
      [station({ startYear: 2015, endYear: 2016 }), station({ startYear: 1900, endYear: 2000 })],
      NOW,
    )
    expect(kurz.segments[1]?.widthPct).toBeGreaterThanOrEqual(1.5)
  })

  it('setzt den Haupt-Tick alle fünf und das Jahrzehnt alle zehn Jahre', () => {
    const model = buildAxisModel(stations, NOW)
    expect(model.ticks[0]).toMatchObject({ year: 1990, major: true, decade: true, offsetPct: 0 })
    expect(model.ticks[1]).toMatchObject({ year: 1991, major: false, decade: false })
    // 1995 ist ein Haupt-Tick, aber kein Jahrzehnt — mobil fällt genau diese Zahl weg.
    expect(model.ticks[5]).toMatchObject({ year: 1995, major: true, decade: false })
    expect(model.ticks.at(-1)).toMatchObject({ year: 2030, decade: true, offsetPct: 100 })
  })

  it('beschriftet breite Balken und lässt schmale unbeschriftet', () => {
    // Der Firmenname passt in 20 % Breite, in 2,5 % nicht — dort stünde sonst
    // ein unlesbarer Stummel wie "t…" statt "team neusta".
    const model = buildAxisModel(
      [
        station({ startYear: 1991, endYear: 1999 }), // 8 von 40 Jahren = 20 %
        station({ startYear: 2015, endYear: 2016 }), // 1 von 40 Jahren = 2,5 %
        station({ startYear: 2016, endYear: undefined }),
      ],
      NOW,
    )
    expect(model.segments.map(s => s.showLabel)).toEqual([true, false, true])
  })

  it('meldet die tatsächliche Spurenzahl', () => {
    expect(buildAxisModel(stations, NOW).laneCount).toBe(1)
  })

  it('liefert für eine leere Stationsliste ein leeres Modell statt NaN', () => {
    // Division durch eine Zeitspanne von 0 wäre der stille Fehler an dieser Stelle.
    expect(buildAxisModel([], NOW)).toEqual({
      segments: [],
      ticks: [],
      minYear: NOW,
      maxYear: NOW,
      laneCount: 0,
    })
  })
})

describe('stationKey', () => {
  it('bildet den Schlüssel aus Firma und Startjahr', () => {
    expect(stationKey(station({ company: 'team neusta', startYear: 2018 }))).toBe('team neusta-2018')
  })

  it('unterscheidet zwei Stationen bei derselben Firma', () => {
    const po = stationKey(station({ company: 'team neusta', startYear: 2015 }))
    const sm = stationKey(station({ company: 'team neusta', startYear: 2018 }))
    expect(po).not.toBe(sm)
  })
})
