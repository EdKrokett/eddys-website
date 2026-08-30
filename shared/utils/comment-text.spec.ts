import { describe, expect, it } from 'vitest'
import { commentHtmlToParagraphs } from './comment-text'

describe('commentHtmlToParagraphs', () => {
  it('macht aus zwei WP-Absätzen zwei Text-Absätze', () => {
    // Echtes Beispiel aus blog.eduard-andrae.de (Kommentar 107897)
    const html = '<p>Ja, das ist richtig.</p>\n<p>Liebe Gr&#252;&#223;e! </p>\n'
    expect(commentHtmlToParagraphs(html)).toEqual(['Ja, das ist richtig.', 'Liebe Grüße!'])
  })

  it('behält den Zeilenumbruch aus <br /> innerhalb eines Absatzes', () => {
    const html = '<p>Erste Zeile<br />\nZweite Zeile</p>'
    expect(commentHtmlToParagraphs(html)).toEqual(['Erste Zeile\nZweite Zeile'])
  })

  it('dekodiert Entities zu echten Zeichen', () => {
    expect(commentHtmlToParagraphs('<p>&#8220;laufend erlebe&#8221;</p>')).toEqual(['“laufend erlebe”'])
  })

  it('entfernt <script> samt Inhalt statt nur des Tags', () => {
    const html = '<p>Hallo</p><script>alert(1)</script>'
    expect(commentHtmlToParagraphs(html)).toEqual(['Hallo'])
  })

  it('lässt kein Markup aus einem Injektionsversuch übrig', () => {
    const html = '<p>Text <img src=x onerror=alert(1)> Ende</p>'
    const result = commentHtmlToParagraphs(html)
    expect(result).toEqual(['Text Ende'])
    expect(result.join('')).not.toContain('<')
  })

  it('gibt kodiertes Markup als reinen Text zurück, nicht als Tag', () => {
    // Wird per v-text gerendert, deshalb ist der wörtliche Text ungefährlich.
    expect(commentHtmlToParagraphs('<p>&lt;script&gt;boese()&lt;/script&gt;</p>'))
      .toEqual(['<script>boese()</script>'])
  })

  it('behält den Link als lesbaren Text, wenn ein <a> vorkommt', () => {
    const html = '<p>Siehe <a href="https://runomatic.de">runomatic.de</a> dazu.</p>'
    expect(commentHtmlToParagraphs(html)).toEqual(['Siehe runomatic.de dazu.'])
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['leerer String', ''],
  ])('gibt bei %s ein leeres Array zurück', (_label, input) => {
    expect(commentHtmlToParagraphs(input)).toEqual([])
  })

  it('gibt bei reinem Markup ohne Text ein leeres Array zurück', () => {
    expect(commentHtmlToParagraphs('<p></p>\n<p>   </p>')).toEqual([])
  })
})
