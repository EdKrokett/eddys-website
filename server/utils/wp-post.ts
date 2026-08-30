import type { WordPressBlogPostDetail } from '#shared/types/wordpress'

interface WpTerm {
  id: number
  name: string
  slug: string
  taxonomy: string
}

interface WpPost {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>
    'wp:term'?: WpTerm[][]
  }
}

/**
 * Lädt einen einzelnen WordPress-Post per Slug — gemeinsame Quelle für die
 * Detail-Route und die Kommentar-Route.
 *
 * Die Kommentar-Route braucht die numerische Post-ID (die WP-Kommentar-API kennt
 * keine Slugs). Über diese Utility holt sie sie aus DEMSELBEN Cache-Eintrag, den die
 * Detailseite ohnehin schon gefüllt hat — im Normalfall also ohne zusätzlichen
 * WordPress-Roundtrip.
 */
export async function fetchWpPostBySlug(slug: string): Promise<WordPressBlogPostDetail> {
  // EXTERN: `slug` kommt aus der URL. unstorage bildet `:` im Cache-Key auf
  // Verzeichnisebenen ab — ein aufgerufenes `/blog/a:b` legte den Eintrag unter
  // `blog-post/a/b` ab und scheiterte still, sobald `blog-post/a` schon als Datei
  // existiert. Kodieren hält den Key einstufig; normale Slugs (a–z, 0–9, `-`)
  // bleiben dabei unverändert lesbar. Gleiche Fehlerklasse wie in blog.get.ts.
  return withWpCache(encodeURIComponent(slug), 'blog-post', async () => {
    const config = useRuntimeConfig()
    const wpUrl = config.public.wordpressUrl

    const response = await backendFetch<WpPost[]>(
      `${wpUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`,
    )

    if (!response || response.length === 0) {
      throw createError({
        statusCode: 404,
        message: `Blogbeitrag nicht gefunden: ${slug}`,
      })
    }

    const post = response[0]!
    const terms = post._embedded?.['wp:term']?.flat() ?? []

    return {
      id: post.id,
      slug: post.slug,
      // Siehe blog.get.ts: Entities dekodieren, weil der Titel per v-text gerendert wird.
      title: decodeHtmlEntities(post.title.rendered),
      // `content` bleibt bewusst rohes HTML (v-html), aber Alt-Domain-URLs müssen
      // raus — sonst brechen die Beitragsbilder nach der DNS-Umschaltung (Phase C).
      content: rewriteLegacyWpUrls(post.content.rendered),
      excerpt: decodeHtmlEntities(post.excerpt.rendered.replace(/<[^>]*>/g, '')).trim(),
      date: post.date,
      // Auch hier defensiv umschreiben: `image.domains` in nuxt.config.ts erlaubt
      // nur blog.eduard-andrae.de — eine Alt-Domain-URL würde NuxtImg blockieren.
      featuredImage: normalizeImageUrl(post._embedded?.['wp:featuredmedia']?.[0]?.source_url),
      tags: terms
        .filter(term => term.taxonomy === 'post_tag')
        .map(tag => ({ id: tag.id, name: decodeHtmlEntities(tag.name), slug: tag.slug })),
      categories: terms
        .filter(term => term.taxonomy === 'category')
        .map(cat => ({ id: cat.id, name: decodeHtmlEntities(cat.name), slug: cat.slug })),
    }
  })
}
