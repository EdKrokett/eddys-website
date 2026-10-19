import { decodeHtmlEntities } from '#shared/utils/html-entities'

/**
 * Zwei-Klick-Lösung für Einbettungen in Blogbeiträgen.
 *
 * Fremde iframes (YouTube, Vimeo, Facebook, …) werden durch einen Platzhalter ersetzt;
 * erst ein Klick setzt das iframe ein. Hintergrund, Zählung und Entscheidungen:
 * `docs/blog-einbettungen.md`.
 *
 * Bewusst Regex statt DOM-Parser: läuft beim SSR ohne `document` und schleppt keine
 * Abhängigkeit ein. Das HTML stammt aus der eigenen WordPress-Instanz.
 */

export interface EmbedConsentOptions {
  /** URL des Vorschaubilds für ein YouTube-Video, bereits über den eigenen Bild-Proxy. */
  youtubeThumbnail: (videoId: string) => string
}

type Embed
  = | { kind: 'youtube', id: string, start: string | null }
    | { kind: 'vimeo', src: string }
    | { kind: 'other', src: string, provider: string }

const OWN_HOSTS = ['eduard-andrae.de']

const YOUTUBE_HOSTS = ['youtube.com', 'youtube-nocookie.com']
const YOUTUBE_ID = /^[\w-]{11}$/
/**
 * Playlist-Einbettungen (`/embed/videoseries?list=…`). Das Wort hat zufällig genau elf
 * Zeichen und ginge sonst als Video-ID durch, mit kaputtem Vorschaubild.
 */
const YOUTUBE_PLAYLIST = 'videoseries'
const VIMEO_PATH = /^\/video\/\d+\/?$/

/** Anzeigenamen nach Domain. Unbekannte Anbieter erscheinen mit ihrem Hostnamen. */
const PROVIDER_NAMES: Record<string, string> = {
  'youtube.com': 'YouTube',
  'youtube-nocookie.com': 'YouTube',
  'vimeo.com': 'Vimeo',
  'facebook.com': 'Facebook',
  'gpsies.com': 'GPSies',
  'garmin.com': 'Garmin Connect',
}

/**
 * Attribute dürfen `>` enthalten, wenn es in Anführungszeichen steht (`title="a > b"`).
 * Ein schlichtes `[^>]*` endete dort und ließe den Rest des Tags im HTML stehen.
 */
const IFRAME = /<iframe\b((?:[^>"']|"[^"]*"|'[^']*')*)>(?:[\s\S]*?<\/iframe>)?/gi
const FLASH_OBJECT = /<object\b[\s\S]*?<\/object>/gi
const FLASH_EMBED = /<embed\b[^>]*>/gi
const FLASH_YOUTUBE = /youtube(?:-nocookie)?\.com\/v\/([\w-]{11})/i
const ATTRIBUTE = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g

/**
 * Ersetzt fremde Einbettungen im Beitrags-HTML durch Platzhalter.
 *
 * PRE:  html ist string, undefined oder null
 * POST: kein <iframe> mit fremder Quelle im Ergebnis; keine youtube.com/v/-Flash-Einbettung
 * INV:  HTML ohne fremde iframes bleibt unverändert; iframes der eigenen Domain bleiben stehen
 */
export function guardEmbeds(html: string | undefined | null, options: EmbedConsentOptions): string {
  if (!html) return ''

  return html
    // Flash zuerst: Das <embed> eines <object> soll mit dem Objekt verschwinden, nicht
    // einzeln einen zweiten Platzhalter erzeugen.
    .replace(FLASH_OBJECT, match => flashPlaceholder(match, options) ?? match)
    .replace(FLASH_EMBED, match => flashPlaceholder(match, options) ?? match)
    .replace(IFRAME, (match, rawAttributes: string) => {
      const attributes = parseAttributes(rawAttributes)
      const src = attributes.src
      if (!src) return match

      const embed = classifyEmbed(src)
      if (!embed) return match

      return placeholder(embed, {
        title: attributes.title ?? null,
        ratio: aspectRatio(attributes.width, attributes.height),
      }, options)
    })
}

/**
 * Setzt das iframe eines Platzhalters ein. Aufgerufen beim Klick auf dessen Knopf.
 *
 * Nur `https://`-Quellen: `data-embed-src` stammt zwar aus `guardEmbeds`, steht aber im
 * DOM, und ein `javascript:`-Wert dort würde sonst ausgeführt.
 */
export function activateEmbed(placeholderElement: HTMLElement): HTMLIFrameElement | null {
  const src = placeholderElement.dataset.embedSrc
  if (!src || !src.startsWith('https://')) return null

  const iframe = document.createElement('iframe')
  iframe.src = src
  iframe.title = placeholderElement.dataset.embedTitle || 'Eingebetteter Inhalt'
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  iframe.allowFullscreen = true
  iframe.className = 'embed-consent__frame'

  placeholderElement.replaceChildren(iframe)
  placeholderElement.classList.add('is-active')
  // Der Knopf, der gerade den Fokus hatte, ist weg. Ohne das landete die Tastatur
  // wieder am Seitenanfang.
  iframe.focus()
  return iframe
}

function classifyEmbed(rawSrc: string): Embed | null {
  const url = parseUrl(decodeHtmlEntities(rawSrc))
  if (!url) return null

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (matchesDomain(host, OWN_HOSTS)) return null

  if (matchesDomain(host, YOUTUBE_HOSTS)) {
    const id = url.pathname.match(/^\/(?:embed|v)\/([^/]+)\/?$/)?.[1]
    if (id && id !== YOUTUBE_PLAYLIST && YOUTUBE_ID.test(id)) {
      return { kind: 'youtube', id, start: url.searchParams.get('start') }
    }
  }

  if (host === 'player.vimeo.com' && VIMEO_PATH.test(url.pathname)) {
    url.searchParams.set('autoplay', '1')
    return { kind: 'vimeo', src: url.toString() }
  }

  // Ohne das hielte der Browser ein http-iframe auf der https-Seite als Mixed Content an.
  url.protocol = 'https:'
  // Explizite Standardports (`:80` bei Garmin) passen nach dem Wechsel nicht mehr.
  url.port = ''
  return { kind: 'other', src: url.toString(), provider: providerName(host) }
}

function flashPlaceholder(markup: string, options: EmbedConsentOptions): string | null {
  const id = markup.match(FLASH_YOUTUBE)?.[1]
  if (!id) return null
  return placeholder({ kind: 'youtube', id, start: null }, { title: null, ratio: null }, options)
}

function placeholder(
  embed: Embed,
  meta: { title: string | null, ratio: string | null },
  options: EmbedConsentOptions,
): string {
  const isVideo = embed.kind !== 'other'
  const provider = embed.kind === 'youtube' ? 'YouTube' : embed.kind === 'vimeo' ? 'Vimeo' : embed.provider
  const src = embed.kind === 'youtube' ? youtubeEmbedUrl(embed.id, embed.start) : embed.src
  const label = isVideo ? `Video von ${provider} laden` : `Inhalt von ${provider} laden`
  const title = meta.title || (isVideo ? `Video von ${provider}` : `Inhalt von ${provider}`)
  const ratio = (isVideo ? null : meta.ratio) ?? '16 / 9'

  const thumbnail = embed.kind === 'youtube'
    ? `<img class="embed-consent__thumb" src="${escapeAttribute(options.youtubeThumbnail(embed.id))}" alt="" loading="lazy" decoding="async">`
    : ''

  // Nur Phrasing-Elemente: Das iframe steht meist in einem <p>, ein <div> darin
  // schlösse der Browser vorzeitig und zerrisse den Absatz.
  return `<span class="embed-consent embed-consent--${isVideo ? 'video' : 'other'}"`
    + ` data-embed-src="${escapeAttribute(src)}"`
    + ` data-embed-title="${escapeAttribute(title)}"`
    + ` style="aspect-ratio: ${ratio}">`
    + thumbnail
    + `<button type="button" class="embed-consent__button">`
    + `<span class="embed-consent__play" aria-hidden="true"></span>`
    + `${escapeText(label)}</button>`
    + `<span class="embed-consent__note">Erst mit dem Klick wird eine Verbindung zu ${escapeText(provider)} hergestellt.</span>`
    + `</span>`
}

function youtubeEmbedUrl(id: string, start: string | null): string {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
  url.searchParams.set('autoplay', '1')
  if (start && /^\d+$/.test(start)) url.searchParams.set('start', start)
  return url.toString()
}

function parseAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const match of raw.matchAll(ATTRIBUTE)) {
    const name = match[1]!.toLowerCase()
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attributes
}

function parseUrl(src: string): URL | null {
  const trimmed = src.trim()
  if (!trimmed) return null
  try {
    // Protokoll-relative (`//www.youtube.com/…`) und relative Pfade auflösen. Relative
    // Pfade landen dabei auf der eigenen Domain und bleiben so unangetastet.
    return new URL(trimmed, 'https://blog.eduard-andrae.de')
  } catch {
    return null
  }
}

function aspectRatio(width: string | undefined, height: string | undefined): string | null {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  return `${w} / ${h}`
}

function matchesDomain(host: string, domains: string[]): boolean {
  return domains.some(domain => host === domain || host.endsWith(`.${domain}`))
}

function providerName(host: string): string {
  const known = Object.keys(PROVIDER_NAMES).find(domain => matchesDomain(host, [domain]))
  return known ? PROVIDER_NAMES[known]! : host
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}
