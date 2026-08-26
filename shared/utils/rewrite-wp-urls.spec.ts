import { describe, expect, it } from 'vitest'
import { normalizeImageUrl, rewriteLegacyWpUrls } from './rewrite-wp-urls'

describe('rewriteLegacyWpUrls', () => {
  it('ersetzt die alte www-Domain in Bild-src', () => {
    expect(rewriteLegacyWpUrls('<img src="https://www.eduard-andrae.de/wp-content/uploads/a.png">'))
      .toBe('<img src="https://blog.eduard-andrae.de/wp-content/uploads/a.png">')
  })

  it('ersetzt die alte Domain auch ohne www', () => {
    expect(rewriteLegacyWpUrls('<a href="https://eduard-andrae.de/impressum/">x</a>'))
      .toBe('<a href="https://blog.eduard-andrae.de/impressum/">x</a>')
  })

  it('ersetzt http genauso wie https', () => {
    expect(rewriteLegacyWpUrls('http://www.eduard-andrae.de/bild.jpg'))
      .toBe('https://blog.eduard-andrae.de/bild.jpg')
  })

  it('ersetzt protokollrelative URLs', () => {
    expect(rewriteLegacyWpUrls('<img src="//www.eduard-andrae.de/b.png">'))
      .toBe('<img src="https://blog.eduard-andrae.de/b.png">')
  })

  it('ersetzt alle Vorkommen, auch in srcset-Listen', () => {
    const input = 'srcset="https://www.eduard-andrae.de/a.png 69w, https://www.eduard-andrae.de/b.png 138w"'
    expect(rewriteLegacyWpUrls(input))
      .toBe('srcset="https://blog.eduard-andrae.de/a.png 69w, https://blog.eduard-andrae.de/b.png 138w"')
  })

  // Invariante: darf nichts doppelt umschreiben
  it('lässt bereits korrekte blog-URLs unverändert', () => {
    const url = '<img src="https://blog.eduard-andrae.de/wp-content/x.png">'
    expect(rewriteLegacyWpUrls(url)).toBe(url)
  })

  it('erzeugt kein blog.blog aus gemischtem Inhalt', () => {
    const input = 'https://blog.eduard-andrae.de/a.png und https://www.eduard-andrae.de/b.png'
    const out = rewriteLegacyWpUrls(input)
    expect(out).not.toContain('blog.blog')
    expect(out).toBe('https://blog.eduard-andrae.de/a.png und https://blog.eduard-andrae.de/b.png')
  })

  it('fasst fremde Domains nicht an', () => {
    const url = '<a href="https://www.trusted-blogs.com/x">y</a>'
    expect(rewriteLegacyWpUrls(url)).toBe(url)
  })

  it('fasst ähnlich benannte Domains nicht an', () => {
    const url = 'https://eduard-andrae.de.example.com/x'
    expect(rewriteLegacyWpUrls(url)).toBe(url)
  })

  // Edge Cases
  it('gibt bei leerem String einen leeren String zurück', () => {
    expect(rewriteLegacyWpUrls('')).toBe('')
  })

  it('gibt bei undefined/null einen leeren String zurück', () => {
    expect(rewriteLegacyWpUrls(undefined)).toBe('')
    expect(rewriteLegacyWpUrls(null)).toBe('')
  })

  it('lässt Text ohne URLs unverändert', () => {
    const text = 'Ein Absatz ganz ohne Links.'
    expect(rewriteLegacyWpUrls(text)).toBe(text)
  })
})

describe('normalizeImageUrl', () => {
  it('schreibt die Alt-Domain um', () => {
    expect(normalizeImageUrl('https://www.eduard-andrae.de/wp-content/a.png'))
      .toBe('https://blog.eduard-andrae.de/wp-content/a.png')
  })

  it('lässt korrekte URLs unverändert', () => {
    const url = 'https://blog.eduard-andrae.de/wp-content/a.png'
    expect(normalizeImageUrl(url)).toBe(url)
  })

  // Der eigentliche Zweck: kein leerer String, sonst rendert v-if ein kaputtes <img>
  it('gibt undefined zurück, wenn kein Bild vorhanden ist', () => {
    expect(normalizeImageUrl(undefined)).toBeUndefined()
    expect(normalizeImageUrl(null)).toBeUndefined()
    expect(normalizeImageUrl('')).toBeUndefined()
  })
})
