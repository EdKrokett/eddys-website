import { describe, expect, it } from 'vitest'
import { guardEmbeds } from './embed-consent'

const options = {
  youtubeThumbnail: (id: string) => `/_ipx/w_640/https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
}

/** Liest ein Attribut aus dem ersten Platzhalter im Ergebnis. */
function attr(html: string, name: string): string | undefined {
  return html.match(new RegExp(`${name}="([^"]*)"`))?.[1]
}

describe('guardEmbeds', () => {
  it('ersetzt ein YouTube-iframe aus dem klassischen Editor durch einen Platzhalter mit nocookie-URL', () => {
    const html = '<p><iframe loading="lazy" src="//www.youtube.com/embed/Je4tgOK4_0c" width="560" height="315" frameborder="0" allowfullscreen="allowfullscreen"></iframe></p>'

    const result = guardEmbeds(html, options)

    expect(result).not.toContain('<iframe')
    expect(result.startsWith('<p><span class="embed-consent embed-consent--video"')).toBe(true)
    expect(result.endsWith('</span></p>')).toBe(true)
    expect(attr(result, 'data-embed-src')).toBe('https://www.youtube-nocookie.com/embed/Je4tgOK4_0c?autoplay=1')
    expect(result).toContain('src="/_ipx/w_640/https://i.ytimg.com/vi/Je4tgOK4_0c/hqdefault.jpg"')
    expect(result).toContain('Video von YouTube laden')
    expect(attr(result, 'style')).toBe('aspect-ratio: 16 / 9')
  })

  it('übernimmt den Startzeitpunkt eines YouTube-Videos', () => {
    const html = '<iframe src="https://www.youtube-nocookie.com/embed/jBMFIWD-yHA?start=42&amp;rel=0"></iframe>'

    expect(attr(guardEmbeds(html, options), 'data-embed-src'))
      .toBe('https://www.youtube-nocookie.com/embed/jBMFIWD-yHA?autoplay=1&amp;start=42')
  })

  it('behält bei Vimeo die Original-URL samt Query und hängt autoplay an', () => {
    const html = '<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe title="LBC 2019" src="https://player.vimeo.com/video/350000000?h=abc123&amp;dnt=1" width="1280" height="720"></iframe></div></figure>'

    const result = guardEmbeds(html, options)

    expect(attr(result, 'data-embed-src'))
      .toBe('https://player.vimeo.com/video/350000000?h=abc123&amp;dnt=1&amp;autoplay=1')
    expect(attr(result, 'data-embed-title')).toBe('LBC 2019')
    expect(result).toContain('Video von Vimeo laden')
    expect(result).not.toContain('<img')
  })

  it('macht aus anderen Anbietern einen Platzhalter mit Namen und Seitenverhältnis aus den Attributen', () => {
    const html = '<iframe loading="lazy" src="http://www.facebook.com/video/embed?video_id=3140611009610" width="600" height="450" frameborder="0"></iframe>'

    const result = guardEmbeds(html, options)

    expect(result).toContain('embed-consent--other')
    expect(result).toContain('Inhalt von Facebook laden')
    // http wird auf https gehoben, sonst blockierte der Browser das iframe als Mixed Content.
    expect(attr(result, 'data-embed-src')).toBe('https://www.facebook.com/video/embed?video_id=3140611009610')
    expect(attr(result, 'style')).toBe('aspect-ratio: 600 / 450')
  })

  it('liest Attribute auch in einfachen Anführungszeichen', () => {
    const html = '<iframe width=\'465\' height=\'548\' frameborder=\'0\' src=\'http://connect.garmin.com:80/activity/embed/63680470\'></iframe>'

    const result = guardEmbeds(html, options)

    expect(result).toContain('Inhalt von Garmin Connect laden')
    expect(attr(result, 'data-embed-src')).toBe('https://connect.garmin.com/activity/embed/63680470')
    expect(attr(result, 'style')).toBe('aspect-ratio: 465 / 548')
  })

  it('fällt ohne brauchbare Maße auf 16:9 zurück', () => {
    const html = '<iframe src="https://www.gpsies.com/mapOnly.do?fileId=x" width="100%" height="0"></iframe>'

    expect(attr(guardEmbeds(html, options), 'style')).toBe('aspect-ratio: 16 / 9')
  })

  it('macht aus einem YouTube-Flash-Objekt einen normalen YouTube-Platzhalter', () => {
    const html = '<p><object width="500" height="405"><param name="src" value="http://www.youtube-nocookie.com/v/jBMFIWD-yHA?fs=1&amp;hl=de_DE" /><embed type="application/x-shockwave-flash" src="http://www.youtube-nocookie.com/v/jBMFIWD-yHA?fs=1" width="500" height="405" /></object></p>'

    const result = guardEmbeds(html, options)

    expect(result).not.toContain('<object')
    expect(result).not.toContain('<embed')
    expect(attr(result, 'data-embed-src')).toBe('https://www.youtube-nocookie.com/embed/jBMFIWD-yHA?autoplay=1')
  })

  it('lässt Flash-Objekte anderer Anbieter unverändert', () => {
    const html = '<object width="640" height="360"><param name="src" value="http://www.facebook.com/v/2669721317662" /><embed type="application/x-shockwave-flash" src="http://www.facebook.com/v/2669721317662" /></object>'

    expect(guardEmbeds(html, options)).toBe(html)
  })

  it('lässt iframes der eigenen Domain unverändert', () => {
    const html = '<iframe src="https://blog.eduard-andrae.de/statistik/" width="600" height="400"></iframe>'

    expect(guardEmbeds(html, options)).toBe(html)
  })

  it('lässt iframes ohne src unverändert', () => {
    const html = '<iframe width="600" height="400"></iframe>'

    expect(guardEmbeds(html, options)).toBe(html)
  })

  it('blockiert YouTube mit ungültiger ID trotzdem, als allgemeinen Platzhalter', () => {
    const html = '<iframe src="https://www.youtube.com/embed/videoseries?list=PL123"></iframe>'

    const result = guardEmbeds(html, options)

    expect(result).not.toContain('<iframe')
    expect(result).toContain('Inhalt von YouTube laden')
  })

  it('maskiert Anführungszeichen und spitze Klammern in übernommenen Werten', () => {
    const html = '<iframe title=\'Ein "Test" <b>\' src="https://player.vimeo.com/video/123"></iframe>'

    expect(attr(guardEmbeds(html, options), 'data-embed-title')).toBe('Ein &quot;Test&quot; &lt;b&gt;')
  })

  it('ersetzt mehrere iframes unabhängig voneinander', () => {
    const html = '<iframe src="https://www.youtube.com/embed/AAAAAAAAAAA"></iframe><p>Text</p><iframe src="https://www.youtube.com/embed/BBBBBBBBBBB"></iframe>'

    const result = guardEmbeds(html, options)

    expect(result.match(/class="embed-consent /g)).toHaveLength(2)
    expect(result).toContain('<p>Text</p>')
    expect(result).toContain('/vi/AAAAAAAAAAA/')
    expect(result).toContain('/vi/BBBBBBBBBBB/')
  })

  it('lässt HTML ohne Einbettungen Zeichen für Zeichen unverändert', () => {
    const html = '<p>Ein Absatz mit <a href="https://www.youtube.com/watch?v=Je4tgOK4_0c">Link</a>.</p>'

    expect(guardEmbeds(html, options)).toBe(html)
  })

  it.each([undefined, null, ''])('gibt bei %s einen leeren String zurück', (input) => {
    expect(guardEmbeds(input, options)).toBe('')
  })
})
