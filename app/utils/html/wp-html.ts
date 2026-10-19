/**
 * Kleine Helfer zum Umschreiben von WordPress-HTML per Regex, gemeinsam genutzt von
 * `embed-consent.ts` und `foreign-images.ts`.
 *
 * Liegt in einem Unterordner, damit Nuxt die allgemeinen Namen (`parseUrl`, …) nicht
 * als globale Auto-Imports bereitstellt. Eingebunden wird relativ, das bleibt innerhalb
 * von `app/` und damit im selben Bundle.
 */

const ATTRIBUTE = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g

/**
 * Inneres eines Tags, in dem `>` innerhalb von Anführungszeichen erlaubt ist
 * (`title="a > b"`). Ein schlichtes `[^>]*` endete dort mitten im Attribut.
 */
export const TAG_BODY = String.raw`((?:[^>"']|"[^"]*"|'[^']*')*)`

const OWN_DOMAIN = 'eduard-andrae.de'

/** Attributwerte eines Tags, Namen kleingeschrieben, Werte roh (noch HTML-kodiert). */
export function parseAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const match of raw.matchAll(ATTRIBUTE)) {
    const name = match[1]!.toLowerCase()
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attributes
}

/**
 * Protokoll-relative (`//www.youtube.com/…`) und relative Pfade werden aufgelöst. Relative
 * Pfade landen dabei auf der eigenen Domain und gelten damit als eigen.
 */
export function parseUrl(src: string): URL | null {
  const trimmed = src.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed, `https://blog.${OWN_DOMAIN}`)
  } catch {
    return null
  }
}

/** Host ohne `www.`, kleingeschrieben. */
export function normalizedHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, '')
}

export function matchesDomain(host: string, domains: string[]): boolean {
  return domains.some(domain => host === domain || host.endsWith(`.${domain}`))
}

export function isOwnHost(host: string): boolean {
  return matchesDomain(host, [OWN_DOMAIN])
}

export function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}
