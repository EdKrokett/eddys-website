import { describe, expect, it } from 'vitest'
import { isValidDatum, parseLauf, parseZeit } from './lauf'

function roh(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 17,
    titel: 'AOK Halbmarathon Bremen',
    datum: '2026-09-13',
    distanzKm: 21.1,
    zeit: '02:03:46',
    art: 'wettkampf',
    ergebnis: 'finish',
    wertung: 'einzel',
    notiz: '',
    links: [{ label: 'Urkunde', url: 'https://drive.google.com/file/d/abc/view' }],
    ...overrides,
  }
}

describe('parseZeit', () => {
  it('rechnet HH:MM:SS in Sekunden um', () => {
    expect(parseZeit('02:03:46')).toBe(7426)
  })

  it('akzeptiert einstellige Stunden', () => {
    expect(parseZeit('3:42:29')).toBe(13349)
  })

  it('gibt null für leer, kaputt und Null zurück', () => {
    expect(parseZeit('')).toBeNull()
    expect(parseZeit('n.a.')).toBeNull()
    expect(parseZeit('1:75:00')).toBeNull()
    expect(parseZeit('00:00:00')).toBeNull()
    expect(parseZeit(undefined)).toBeNull()
    expect(parseZeit(7426)).toBeNull()
  })
})

describe('isValidDatum', () => {
  it('erkennt ein echtes Datum', () => {
    expect(isValidDatum('2026-10-31')).toBe(true)
  })

  it('weist unmögliche Daten und fremde Formate ab', () => {
    expect(isValidDatum('2026-02-30')).toBe(false)
    expect(isValidDatum('2026|09|13')).toBe(false)
    expect(isValidDatum('')).toBe(false)
    expect(isValidDatum(null)).toBe(false)
  })
})

describe('parseLauf', () => {
  it('übernimmt einen vollständigen Lauf mit konkreten Werten', () => {
    expect(parseLauf(roh())).toEqual({
      id: 17,
      titel: 'AOK Halbmarathon Bremen',
      datum: '2026-09-13',
      jahr: 2026,
      distanzKm: 21.1,
      sekunden: 7426,
      art: 'wettkampf',
      ergebnis: 'finish',
      wertung: 'einzel',
      notiz: null,
      links: [{ label: 'Urkunde', url: 'https://drive.google.com/file/d/abc/view' }],
    })
  })

  it('setzt leere Enum-Felder auf den Default', () => {
    const lauf = parseLauf(roh({ art: '', ergebnis: undefined, wertung: null }))
    expect(lauf?.art).toBe('wettkampf')
    expect(lauf?.ergebnis).toBe('finish')
    expect(lauf?.wertung).toBe('einzel')
  })

  it('verwirft einen Lauf mit unbekannter Art, statt ihn falsch zu zählen', () => {
    expect(parseLauf(roh({ art: 'ultra' }))).toBeNull()
    expect(parseLauf(roh({ wertung: 'Staffel' }))).toBeNull()
  })

  it('verwirft Einträge ohne ID, Titel oder gültiges Datum', () => {
    expect(parseLauf(roh({ id: 0 }))).toBeNull()
    expect(parseLauf(roh({ id: '17' }))).toBeNull()
    expect(parseLauf(roh({ titel: '   ' }))).toBeNull()
    expect(parseLauf(roh({ datum: '2026-13-01' }))).toBeNull()
    expect(parseLauf(null)).toBeNull()
    expect(parseLauf('Lauf')).toBeNull()
  })

  it('behält den Lauf, wenn nur die Zeit unlesbar ist', () => {
    const lauf = parseLauf(roh({ zeit: '2h03' }))
    expect(lauf?.titel).toBe('AOK Halbmarathon Bremen')
    expect(lauf?.sekunden).toBeNull()
  })

  it('gibt einem Meilenstein weder Distanz noch Zeit', () => {
    const lauf = parseLauf(roh({ art: 'meilenstein', distanzKm: 21.1, zeit: '01:00:00' }))
    expect(lauf?.distanzKm).toBeNull()
    expect(lauf?.sekunden).toBeNull()
  })

  it('gibt einem DNS keine Zeit, auch wenn eine eingetragen ist', () => {
    expect(parseLauf(roh({ ergebnis: 'dns', zeit: '02:00:00' }))?.sekunden).toBeNull()
  })

  it('rundet die Distanz auf eine Stelle und verwirft unsinnige Werte', () => {
    expect(parseLauf(roh({ distanzKm: 42.195 }))?.distanzKm).toBe(42.2)
    expect(parseLauf(roh({ distanzKm: 0 }))?.distanzKm).toBeNull()
    expect(parseLauf(roh({ distanzKm: -5 }))?.distanzKm).toBeNull()
    expect(parseLauf(roh({ distanzKm: '21,1' }))?.distanzKm).toBeNull()
  })

  it('nimmt nur http(s) als Link-URL und behält die Beschriftung', () => {
    const lauf = parseLauf(roh({
      links: [
        { label: 'Böse', url: 'javascript:alert(1)' },
        { label: 'Polar', url: '' },
        { label: 'Relativ', url: '/mein-beitrag/' },
        { label: '', url: 'https://example.org' },
        'Müll',
      ],
    }))

    expect(lauf?.links).toEqual([
      { label: 'Böse', url: null },
      { label: 'Polar', url: null },
      { label: 'Relativ', url: null },
    ])
  })

  it('hebt Links der alten Domain auf blog.eduard-andrae.de und https', () => {
    const lauf = parseLauf(roh({
      links: [
        { label: 'Urkunde', url: 'http://www.eduard-andrae.de/wp-content/uploads/2016/08/urkunde.pdf' },
        { label: 'Garmin', url: 'http://connect.garmin.com/activity/177559010' },
      ],
    }))

    expect(lauf?.links).toEqual([
      { label: 'Urkunde', url: 'https://blog.eduard-andrae.de/wp-content/uploads/2016/08/urkunde.pdf' },
      { label: 'Garmin', url: 'http://connect.garmin.com/activity/177559010' },
    ])
  })

  it('lässt Beitragslinks auf diese Seite unverändert', () => {
    const url = 'https://eduard-andrae.de/blog/halloween-run-bremen-der-letzte-kilometer-ist-immer-der-laengste'
    expect(parseLauf(roh({ links: [{ label: 'Blogpost', url }] }))?.links).toEqual([{ label: 'Blogpost', url }])
  })

  it('kürzt überlange Titel, statt das Layout zu sprengen', () => {
    expect(parseLauf(roh({ titel: 'x'.repeat(500) }))?.titel).toHaveLength(200)
  })
})
