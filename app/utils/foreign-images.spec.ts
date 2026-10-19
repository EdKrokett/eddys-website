import { describe, expect, it } from 'vitest'
import { proxyForeignImages } from './foreign-images'

const proxy = (url: string) => `/_ipx/w_640/${url}`

describe('proxyForeignImages', () => {
  it('leitet ein Blogspot-Bild über den Proxy und hebt http auf https', () => {
    const html = '<a href="http://3.bp.blogspot.com/x/s1600-h/malle_e2.jpg"><img style="cursor:pointer" src="http://3.bp.blogspot.com/__toYYm_iWSA/RyiHx5CV-MI/AAAAAAAAARQ/fl43T6G9X48/s200/malle_e2.jpg" border="0" alt="" /></a>'

    expect(proxyForeignImages(html, proxy)).toBe(
      '<a href="http://3.bp.blogspot.com/x/s1600-h/malle_e2.jpg"><img style="cursor:pointer" src="/_ipx/w_640/https://3.bp.blogspot.com/__toYYm_iWSA/RyiHx5CV-MI/AAAAAAAAARQ/fl43T6G9X48/s200/malle_e2.jpg" border="0" alt="" /></a>',
    )
  })

  it('entfernt srcset und sizes, damit der Browser keine Variante direkt lädt', () => {
    const html = '<img src="https://lh4.ggpht.com/a/s400/b.jpg" srcset="https://lh4.ggpht.com/a/s800/b.jpg 2x" sizes="400px" width="400" height="300">'

    expect(proxyForeignImages(html, proxy))
      .toBe('<img src="/_ipx/w_640/https://lh4.ggpht.com/a/s400/b.jpg" width="400" height="300">')
  })

  it('dekodiert Entities in der Quelle und kodiert das Ergebnis wieder', () => {
    const html = '<img src="http://lh4.ggpht.com/a/s400/b.jpg?imgmax=400&amp;crop=1" />'

    expect(proxyForeignImages(html, proxy)).toBe(
      '<img src="/_ipx/w_640/https://lh4.ggpht.com/a/s400/b.jpg?imgmax=400&amp;crop=1" />',
    )
  })

  it('entfernt Bilder nicht freigegebener Server, statt sie dem Proxy zu übergeben', () => {
    // useImage() gäbe für diese Hosts die Original-URL zurück, der Browser lüde direkt.
    const calls: string[] = []
    const html = '<p>Vorher<img src="http://www.assoc-amazon.de/e/ir?t=eddysprivatbl-21&amp;l=ur2&amp;o=3" width="1" height="1" />nachher</p>'
      + '<a href="http://tiger-balm-team.de/"><img title="Tiger Balm Team beim Nordseelauf" src="http://tiger-balm-team.de/blog/wp-content/uploads/nordseelauf-teilnehmer.png" alt=""></a>'

    const result = proxyForeignImages(html, (url) => {
      calls.push(url)
      return proxy(url)
    })

    expect(result).toBe('<p>Vorhernachher</p><a href="http://tiger-balm-team.de/"></a>')
    expect(calls).toEqual([])
  })

  it('prüft den exakten Hostnamen, nicht nur die Domain', () => {
    const html = '<img src="https://1.bp.blogspot.com/a.jpg">'

    expect(proxyForeignImages(html, proxy)).toBe('')
  })

  it('löst protokoll-relative Quellen auf und liest einfache Anführungszeichen', () => {
    const html = '<img alt=\'Emoji\' src=\'//static.xx.fbcdn.net/images/emoji.php/v9/t80/1/16/1f64f.png\'>'

    expect(proxyForeignImages(html, proxy))
      .toBe('<img alt=\'Emoji\' src="/_ipx/w_640/https://static.xx.fbcdn.net/images/emoji.php/v9/t80/1/16/1f64f.png">')
  })

  it('lässt Bilder der eigenen Domain samt srcset unverändert', () => {
    const html = '<img src="https://blog.eduard-andrae.de/wp-content/uploads/2015/07/bit1.jpg" srcset="https://blog.eduard-andrae.de/wp-content/uploads/2015/07/bit1-600x141.jpg 600w">'

    expect(proxyForeignImages(html, proxy)).toBe(html)
  })

  it('lässt relative Pfade unverändert', () => {
    const html = '<img src="../wp-content/uploads/2010/08/sabine.png">'

    expect(proxyForeignImages(html, proxy)).toBe(html)
  })

  it.each([
    'file:///C:/Users/Eddy/AppData/Local/Temp/moz-screenshot.png',
    'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  ])('lässt %s unverändert, weil dabei kein Server angefragt wird', (src) => {
    const html = `<img src="${src}">`

    expect(proxyForeignImages(html, proxy)).toBe(html)
  })

  it('verwechselt data-src nicht mit src', () => {
    const html = '<img data-src="https://3.bp.blogspot.com/a.jpg" src="https://blog.eduard-andrae.de/a.jpg">'

    expect(proxyForeignImages(html, proxy)).toBe(html)
  })

  it('übersteht ein > in einem Attributwert', () => {
    const html = '<img alt="Ziel > Start" src="https://3.bp.blogspot.com/a.jpg">'

    expect(proxyForeignImages(html, proxy))
      .toBe('<img alt="Ziel > Start" src="/_ipx/w_640/https://3.bp.blogspot.com/a.jpg">')
  })

  it('lässt Bilder ohne src und HTML ohne Bilder unverändert', () => {
    const html = '<p>Text</p><img alt="leer">'

    expect(proxyForeignImages(html, proxy)).toBe(html)
  })

  it.each([undefined, null, ''])('gibt bei %s einen leeren String zurück', (input) => {
    expect(proxyForeignImages(input, proxy)).toBe('')
  })
})
