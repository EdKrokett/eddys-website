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
 * Lädt einen einzelnen WordPress-Post per Slug.
 */
export default defineEventHandler(async (event): Promise<WordPressBlogPostDetail> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug parameter is required',
    })
  }

  return withWpCache(slug, 'blog-post', async () => {
    const config = useRuntimeConfig()
    const wpUrl = config.public.wordpressUrl

    try {
      const response = await backendFetch<WpPost[]>(
        `${wpUrl}/wp-json/wp/v2/posts?slug=${slug}&_embed`,
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
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      throw createError({
        statusCode: 500,
        message: `Fehler beim Laden des Blogbeitrags: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      })
    }
  })
})
