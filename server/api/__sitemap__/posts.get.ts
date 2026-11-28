/**
 * Alle veröffentlichten Beiträge für `/sitemap.xml` (als `sources` in nuxt.config.ts).
 *
 * Ohne diese Quelle kannte die Sitemap nur die festen Seiten: `/blog/[slug]` ist eine
 * dynamische Route, das Modul kann ihre Adressen nicht erraten. Hintergrund:
 * docs/headless-wordpress.md, Schritt 1.
 */
import type { WpSitemapPost } from '#server/utils/sitemap-posts'

export default defineSitemapEventHandler(async () => {
  const posts = await withWpCache('all', 'sitemap', () =>
    fetchAllWpPosts('slug,modified_gmt') as Promise<WpSitemapPost[]>)
  return wpPostsToSitemapUrls(posts)
})
