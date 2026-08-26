import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities } from './html-entities'

describe('decodeHtmlEntities', () => {
  it('dekodiert das typografische Apostroph aus echten WordPress-Titeln', () => {
    expect(decodeHtmlEntities('Projekt Marathon mit 60: Jetzt wird&#8217;s ernst!'))
      .toBe('Projekt Marathon mit 60: Jetzt wird’s ernst!')
  })

  it('dekodiert benannte Entities', () => {
    expect(decodeHtmlEntities('Laufen &amp; Wandern')).toBe('Laufen & Wandern')
    expect(decodeHtmlEntities('&quot;Zitat&quot;')).toBe('"Zitat"')
    expect(decodeHtmlEntities('&lt;nicht als Tag&gt;')).toBe('<nicht als Tag>')
  })

  it('dekodiert hexadezimale Entities', () => {
    expect(decodeHtmlEntities('Gedanken&#x2026;')).toBe('Gedanken…')
  })

  it('dekodiert mehrere Entities im selben String', () => {
    expect(decodeHtmlEntities('&#8220;Los&#8221; &#8211; sagte er'))
      .toBe('“Los” – sagte er')
  })

  it('wandelt &nbsp; in ein normales Leerzeichen, damit Umbrüche funktionieren', () => {
    expect(decodeHtmlEntities('15&nbsp;Kilo')).toBe('15 Kilo')
  })

  // Edge Cases
  it('lässt Text ohne Entities unverändert (Invariante)', () => {
    const text = 'Der Halbmarathon klappt noch'
    expect(decodeHtmlEntities(text)).toBe(text)
  })

  it('gibt bei leerem String einen leeren String zurück', () => {
    expect(decodeHtmlEntities('')).toBe('')
  })

  it('gibt bei undefined/null einen leeren String zurück, nie "undefined"', () => {
    expect(decodeHtmlEntities(undefined)).toBe('')
    expect(decodeHtmlEntities(null)).toBe('')
  })

  // Fehlerfälle: dürfen nicht werfen und nichts kaputtmachen
  it('lässt unbekannte Entities unangetastet stehen', () => {
    expect(decodeHtmlEntities('&kaputt; bleibt')).toBe('&kaputt; bleibt')
  })

  it('lässt kaputte numerische Entities stehen, statt zu werfen', () => {
    expect(decodeHtmlEntities('&#; und &#x;')).toBe('&#; und &#x;')
  })

  it('lässt Codepoints außerhalb des Unicode-Bereichs stehen, statt zu werfen', () => {
    expect(decodeHtmlEntities('&#1114112;')).toBe('&#1114112;')
  })

  it('dekodiert nur eine Ebene, erzeugt also keine neuen Entities aus &amp;', () => {
    expect(decodeHtmlEntities('&amp;#8217;')).toBe('&#8217;')
  })
})
