import type { WordPressBlogPost } from '#shared/types/wordpress'

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
  excerpt: { rendered: string }
  date: string
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>
    'wp:term'?: WpTerm[][]
  }
}

/**
 * Listet veröffentlichte WordPress-Posts (öffentliche, unauthentifizierte REST-API,
 * kein Kategorie-Filter — anders als tb26-code: dort ist WordPress eine Kategorie unter
 * vielen, hier ist es der gesamte Blog). `limit` steuert `per_page` — kleinere Werte für
 * Startseiten-Teaser/Kachelwand sparen WordPress-Antwortzeit, die reale Blog-Liste bleibt
 * beim vollen Standardwert.
 */
export default defineEventHandler(async (event): Promise<WordPressBlogPost[]> => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 50)

  return withWpCache(`all-posts:${limit}`, 'blog-list', async () => {
    const config = useRuntimeConfig()
    const wpUrl = config.public.wordpressUrl

    const response = await backendFetch<WpPost[]>(
      `${wpUrl}/wp-json/wp/v2/posts?per_page=${limit}&_embed`,
    )

    return response.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
      date: post.date,
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      tags: (post._embedded?.['wp:term']?.flat() ?? [])
        .filter(term => term.taxonomy === 'post_tag')
        .map(tag => ({ id: tag.id, name: tag.name, slug: tag.slug })),
    }))
  })
})
