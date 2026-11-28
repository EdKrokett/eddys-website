import { describe, expect, it, vi } from 'vitest'

// Nitro-Auto-Imports gibt es in Vitest nicht; parseArchivPosts braucht sie nicht, das
// Modul referenziert sie nur in fetchBlogArchiv.
vi.stubGlobal('withWpCache', vi.fn())
vi.stubGlobal('fetchAllWpPosts', vi.fn())

const { parseArchivPosts } = await import('./blog-archiv')

function roh(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: 'der-new-york-marathon-ist-besonders',
    title: { rendered: 'New York Marathon &#8211; ein MUSS' },
    date: '2011-11-10T08:30:00',
    categories: [1],
    ...overrides,
  }
}

describe('parseArchivPosts', () => {
  it('übernimmt einen gültigen Beitrag mit dekodiertem Titel', () => {
    expect(parseArchivPosts([roh()])).toEqual([{
      slug: 'der-new-york-marathon-ist-besonders',
      title: 'New York Marathon – ein MUSS',
      date: '2011-11-10T08:30:00',
      categoryIds: [1],
    }])
  })

  it('sortiert neueste zuerst, egal in welcher Reihenfolge WordPress liefert', () => {
    const result = parseArchivPosts([
      roh({ slug: 'alt', date: '2006-03-01T10:00:00' }),
      roh({ slug: 'neu', date: '2026-11-01T10:00:00' }),
      roh({ slug: 'mitte', date: '2014-05-01T10:00:00' }),
    ])
    expect(result.map(e => e.slug)).toEqual(['neu', 'mitte', 'alt'])
  })

  it('dekodiert prozentkodierte Slugs, wie der Router sie liefert', () => {
    expect(parseArchivPosts([roh({ slug: 'lauf-%e2%88%92-test' })])[0]!.slug).toBe('lauf-−-test')
  })

  it('entfernt HTML aus dem Titel und setzt bei leerem Titel einen Ersatz', () => {
    expect(parseArchivPosts([roh({ title: { rendered: '<em>Kursiv</em> &amp; fett' } })])[0]!.title)
      .toBe('Kursiv & fett')
    expect(parseArchivPosts([roh({ title: { rendered: '' } })])[0]!.title).toBe('Ohne Titel')
    expect(parseArchivPosts([roh({ title: null })])[0]!.title).toBe('Ohne Titel')
  })

  it('verwirft Einträge ohne brauchbaren Slug oder ohne gültiges Datum', () => {
    const result = parseArchivPosts([
      roh({ slug: '' }),
      roh({ slug: undefined }),
      roh({ slug: 'a/b' }),
      roh({ slug: 'ohne-datum', date: '' }),
      roh({ slug: 'kaputtes-datum', date: '2011-13-45T99:00:00' }),
      roh({ slug: 'datum-mit-zone', date: '2011-11-10T08:30:00Z' }),
      null,
      'kein objekt',
      roh({ slug: 'bleibt' }),
    ])
    expect(result.map(e => e.slug)).toEqual(['bleibt'])
  })

  it('behält bei doppeltem Slug nur den ersten Eintrag', () => {
    const result = parseArchivPosts([roh({ title: { rendered: 'Erster' } }), roh({ title: { rendered: 'Zweiter' } })])
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Erster')
  })

  it('übernimmt nur ganzzahlige Kategorie-IDs', () => {
    expect(parseArchivPosts([roh({ categories: [1, '224', null, 94.5, 94] })])[0]!.categoryIds).toEqual([1, 94])
    expect(parseArchivPosts([roh({ categories: undefined })])[0]!.categoryIds).toEqual([])
  })

  it('liefert für alles außer einer Liste ein leeres Archiv', () => {
    expect(parseArchivPosts(undefined)).toEqual([])
    expect(parseArchivPosts(null)).toEqual([])
    expect(parseArchivPosts({ code: 'rest_error' })).toEqual([])
    expect(parseArchivPosts([])).toEqual([])
  })
})
