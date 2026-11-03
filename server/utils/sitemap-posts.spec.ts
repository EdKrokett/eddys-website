import { describe, expect, it } from 'vitest'
import { wpPostsToSitemapUrls } from './sitemap-posts'

describe('wpPostsToSitemapUrls', () => {
  it('macht aus Slug und Änderungsdatum einen Eintrag unter /blog', () => {
    expect(wpPostsToSitemapUrls([
      { slug: 'halloween-run-bremen', modified_gmt: '2026-11-01T07:25:24' },
    ])).toEqual([
      { loc: '/blog/halloween-run-bremen', lastmod: '2026-11-01T07:25:24.000Z' },
    ])
  })

  it('übergibt Sonderzeichen dekodiert, damit das Modul nicht doppelt kodiert', () => {
    // Echter Slug aus WordPress.
    const [entry] = wpPostsToSitemapUrls([
      { slug: 'zwischenbericht-1-madeira-beine-%e2%88%925-kg', modified_gmt: '2026-10-20T10:00:00' },
    ])
    expect(entry!.loc).toBe('/blog/zwischenbericht-1-madeira-beine-−5-kg')
  })

  it('lässt Einträge ohne brauchbaren Slug weg', () => {
    expect(wpPostsToSitemapUrls([
      { slug: '' },
      { slug: '   ' },
      { slug: null },
      { slug: 42 },
      {},
      { slug: 'kaputt-%E2%8' },
      { slug: 'a%2Fb' },
      { slug: 'mit?frage' },
    ])).toEqual([])
  })

  it('lässt lastmod weg, wenn das Datum fehlt oder nicht passt', () => {
    expect(wpPostsToSitemapUrls([
      { slug: 'ohne-datum' },
      { slug: 'leeres-datum', modified_gmt: '' },
      { slug: 'falsches-format', modified_gmt: '01.11.2026' },
      { slug: 'unmoeglich', modified_gmt: '2026-13-45T99:00:00' },
    ])).toEqual([
      { loc: '/blog/ohne-datum' },
      { loc: '/blog/leeres-datum' },
      { loc: '/blog/falsches-format' },
      { loc: '/blog/unmoeglich' },
    ])
  })

  it('nimmt doppelte Slugs nur einmal auf', () => {
    expect(wpPostsToSitemapUrls([
      { slug: 'doppelt', modified_gmt: '2026-11-01T07:25:24' },
      { slug: 'doppelt', modified_gmt: '2026-11-02T07:25:24' },
    ])).toHaveLength(1)
  })
})
