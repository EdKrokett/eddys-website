export interface WpSitemapPost {
  slug?: unknown
  modified_gmt?: unknown
}

export interface SitemapPostUrl {
  loc: string
  lastmod?: string
}

/**
 * Macht aus der WordPress-Beitragsliste die Einträge für die Sitemap.
 *
 * Der Slug geht DEKODIERT hinein: WordPress liefert Sonderzeichen prozentkodiert mit
 * kleinen Hex-Ziffern (`%e2%88%92`), das Sitemap-Modul kodiert den Pfad selbst noch einmal
 * (ufo `encodePath`). Kodiert übergeben, käme `%25e2…` heraus, eine Adresse, die es nicht
 * gibt. Dekodiert übergeben, schreibt das Modul `%E2%88%92`, genau wie `canonicalUrl`.
 *
 * EXTERN: Alles kommt aus der WordPress-Antwort. Ohne brauchbaren Slug kein Eintrag, ohne
 * gültiges Datum kein `lastmod` (ein falsches Datum wäre schlimmer als keins).
 */
export function wpPostsToSitemapUrls(posts: WpSitemapPost[]): SitemapPostUrl[] {
  const seen = new Set<string>()
  const urls: SitemapPostUrl[] = []

  for (const post of posts) {
    const slug = decodeSlug(post.slug)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)

    const lastmod = parseGmtDate(post.modified_gmt)
    urls.push(lastmod ? { loc: `/blog/${slug}`, lastmod } : { loc: `/blog/${slug}` })
  }

  return urls
}

function decodeSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let decoded: string
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    // Kaputte Kodierung: Die Seite wäre unter keiner sauberen Adresse erreichbar.
    return null
  }

  // Ein Slug ist genau EIN Pfadsegment. Was trennt oder abschneidet, gehört nicht hinein.
  if (/[/?#\s]/.test(decoded)) return null
  return decoded
}

/** `modified_gmt` kommt ohne Zeitzone (`2026-11-01T09:40:28`), ist aber UTC. */
function parseGmtDate(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) return undefined
  const time = Date.parse(`${raw}Z`)
  return Number.isNaN(time) ? undefined : new Date(time).toISOString()
}
