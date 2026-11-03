/**
 * Alle veröffentlichten Beiträge für `/sitemap.xml` (als `sources` in nuxt.config.ts).
 *
 * Ohne diese Quelle kannte die Sitemap nur die festen Seiten: `/blog/[slug]` ist eine
 * dynamische Route, das Modul kann ihre Adressen nicht erraten. Hintergrund:
 * docs/headless-wordpress.md, Schritt 1.
 */
import type { WpSitemapPost } from '#server/utils/sitemap-posts'

/** Mehr gibt WordPress pro Anfrage nicht heraus. */
const PER_PAGE = 100
/** Sicherung gegen eine Endlosschleife, falls WordPress nie eine kurze Seite liefert.
 *  Reicht für 2.000 Beiträge, heute sind es rund 250. */
const MAX_PAGES = 20

export default defineSitemapEventHandler(async () => {
  const posts = await withWpCache('all', 'sitemap', fetchAllPosts)
  return wpPostsToSitemapUrls(posts)
})

async function fetchAllPosts(): Promise<WpSitemapPost[]> {
  const wpUrl = useRuntimeConfig().public.wordpressUrl
  const all: WpSitemapPost[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    let batch: WpSitemapPost[]
    try {
      batch = await backendFetch<WpSitemapPost[]>(
        `${wpUrl}/wp-json/wp/v2/posts?per_page=${PER_PAGE}&page=${page}&_fields=slug,modified_gmt`,
      )
    } catch (error: unknown) {
      // Bei genau 100, 200, … Beiträgen ist die Seite danach leer, und WordPress
      // antwortet darauf mit 400 (`rest_post_invalid_page_number`). Das ist das Ende
      // der Liste, kein Fehler. Auf Seite 1 dagegen schon: dann lieber gar keine
      // Beitrags-URLs als eine halbe Liste im Cache.
      const status = (error as { status?: number, statusCode?: number })?.status
        ?? (error as { statusCode?: number })?.statusCode
      if (status === 400 && page > 1) break
      throw error
    }

    // EXTERN: Eine Antwort, die keine Liste ist, beendet die Schleife statt sie zu sprengen.
    if (!Array.isArray(batch)) break
    all.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  return all
}
