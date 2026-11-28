import { describe, expect, it } from 'vitest'
import type { BlogArchivEntry } from '#shared/types/wordpress'
import { archivSkala, findNachbarn, groupArchivByYear, hauptKategorie } from './blog-archiv'

const LAUFEN = 1
const REISEN = 224
const BLOGGEN = 94
const WERBUNG = 223

function eintrag(slug: string, date: string, categoryIds: number[] = [LAUFEN]): BlogArchivEntry {
  return { slug, title: `Titel ${slug}`, date, categoryIds }
}

/** Neueste zuerst, wie parseArchivPosts sie liefert. */
const LISTE: BlogArchivEntry[] = [
  eintrag('h', '2026-05-01T10:00:00'),
  eintrag('g', '2026-01-01T10:00:00', [REISEN]),
  eintrag('f', '2014-07-01T10:00:00'),
  eintrag('e', '2011-09-01T10:00:00'),
  eintrag('d', '2011-04-01T10:00:00', [BLOGGEN]),
  eintrag('c', '2011-02-01T10:00:00'),
  eintrag('b', '2010-06-01T10:00:00'),
  eintrag('a', '2010-01-01T10:00:00', [WERBUNG]),
]

describe('groupArchivByYear', () => {
  it('fasst je Jahr zusammen, Jahre absteigend, Reihenfolge im Jahr unverändert', () => {
    const groups = groupArchivByYear(LISTE)
    expect(groups.map(g => g.year)).toEqual([2026, 2014, 2011, 2010])
    expect(groups[2]!.entries.map(e => e.slug)).toEqual(['e', 'd', 'c'])
  })

  it('liefert bei leerer Liste ein leeres Ergebnis', () => {
    expect(groupArchivByYear([])).toEqual([])
  })
})

describe('archivSkala', () => {
  it('zeigt jedes Jahr lückenlos aufsteigend, leere Jahre mit 0', () => {
    const skala = archivSkala(groupArchivByYear(LISTE))
    expect(skala.map(s => s.year)).toEqual(
      [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    )
    expect(skala.find(s => s.year === 2012)).toEqual({ year: 2012, count: 0, ratio: 0 })
  })

  it('misst die Höhe am stärksten Jahr', () => {
    const skala = archivSkala(groupArchivByYear(LISTE))
    expect(skala.find(s => s.year === 2011)).toEqual({ year: 2011, count: 3, ratio: 1 })
    expect(skala.find(s => s.year === 2014)!.ratio).toBeCloseTo(1 / 3)
  })

  it('liefert bei leerer Liste keine Striche', () => {
    expect(archivSkala([])).toEqual([])
  })
})

describe('hauptKategorie', () => {
  it('nimmt die erste Kategorie der kuratierten Liste, nicht die erste aus WordPress', () => {
    expect(hauptKategorie([BLOGGEN, LAUFEN])?.slug).toBe('laufen')
  })

  it('kennt Werbung und leere Listen nicht als Hauptkategorie', () => {
    expect(hauptKategorie([WERBUNG])).toBeNull()
    expect(hauptKategorie([])).toBeNull()
  })
})

describe('findNachbarn', () => {
  it('findet die chronologischen Nachbarn', () => {
    const n = findNachbarn(LISTE, 'd')
    expect(n.newer?.slug).toBe('e')
    expect(n.older?.slug).toBe('c')
    expect(n.total).toBe(8)
  })

  it('verlinkt verwandte Beiträge ohne sich selbst und ohne die Nachbarn, zeitlich nächste zuerst gewählt', () => {
    // c: Nachbarn d (bloggen) und b. Laufen-Kandidaten nach Abstand: e (2), f (3), h (5).
    const n = findNachbarn(LISTE, 'c')
    expect(n.related.map(e => e.slug)).toEqual(['h', 'f', 'e'])
    expect(n.category).toEqual({ slug: 'laufen', label: 'Laufen' })
  })

  it('hält sich an die gewünschte Anzahl', () => {
    expect(findNachbarn(LISTE, 'c', 1).related.map(e => e.slug)).toEqual(['e'])
    expect(findNachbarn(LISTE, 'c', 0).related).toEqual([])
  })

  it('hat beim neuesten keinen neueren und beim ältesten keinen älteren Beitrag', () => {
    expect(findNachbarn(LISTE, 'h').newer).toBeNull()
    expect(findNachbarn(LISTE, 'a').older).toBeNull()
  })

  it('liefert ohne Hauptkategorie Nachbarn, aber keine verwandten Beiträge', () => {
    const n = findNachbarn(LISTE, 'a')
    expect(n.newer?.slug).toBe('b')
    expect(n.related).toEqual([])
    expect(n.category).toBeNull()
  })

  it('liefert bei unbekanntem Slug leere Nachbarn statt eines Fehlers', () => {
    expect(findNachbarn(LISTE, 'gibt-es-nicht')).toEqual({
      newer: null,
      older: null,
      related: [],
      category: null,
      total: 8,
    })
    expect(findNachbarn([], '')).toEqual({ newer: null, older: null, related: [], category: null, total: 0 })
  })
})
