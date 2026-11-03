import { describe, expect, it } from 'vitest'
import { canonicalUrl } from './canonical-url'

const SITE = 'https://eduard-andrae.de'

describe('canonicalUrl', () => {
  it('setzt Website und Pfad zusammen', () => {
    expect(canonicalUrl(SITE, '/blog/mein-beitrag')).toBe('https://eduard-andrae.de/blog/mein-beitrag')
  })

  it('gibt für die Startseite genau einen Schrägstrich aus', () => {
    expect(canonicalUrl(SITE, '/')).toBe('https://eduard-andrae.de/')
    expect(canonicalUrl(`${SITE}/`, '/')).toBe('https://eduard-andrae.de/')
    expect(canonicalUrl(SITE, '')).toBe('https://eduard-andrae.de/')
  })

  it('entfernt den abschließenden Schrägstrich', () => {
    expect(canonicalUrl(SITE, '/blog/')).toBe('https://eduard-andrae.de/blog')
    expect(canonicalUrl(`${SITE}/`, '/ueber-mich//')).toBe('https://eduard-andrae.de/ueber-mich')
  })

  it('lässt Query und Anker weg', () => {
    expect(canonicalUrl(SITE, '/blog?q=marathon')).toBe('https://eduard-andrae.de/blog')
    expect(canonicalUrl(SITE, '/blog/x?utm_source=fb#kommentare')).toBe('https://eduard-andrae.de/blog/x')
  })

  it('vereinheitlicht die Kodierung von Sonderzeichen auf große Hex-Ziffern', () => {
    // Echter Slug aus WordPress, der dort mit kleinen Hex-Ziffern steht.
    const expected = 'https://eduard-andrae.de/blog/zwischenbericht-1-madeira-beine-%E2%88%925-kg'
    expect(canonicalUrl(SITE, '/blog/zwischenbericht-1-madeira-beine-%e2%88%925-kg')).toBe(expected)
    expect(canonicalUrl(SITE, '/blog/zwischenbericht-1-madeira-beine-%E2%88%925-kg')).toBe(expected)
    expect(canonicalUrl(SITE, '/blog/zwischenbericht-1-madeira-beine-−5-kg')).toBe(expected)
  })

  it('wirft bei kaputter Kodierung nicht, sondern nennt den Pfad unverändert', () => {
    expect(canonicalUrl(SITE, '/blog/kaputt-%E2%8')).toBe('https://eduard-andrae.de/blog/kaputt-%E2%8')
  })
})
