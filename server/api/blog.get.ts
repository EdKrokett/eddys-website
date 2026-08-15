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
 * Listet alle veröffentlichten WordPress-Posts (öffentliche, unauthentifizierte REST-API,
 * kein Kategorie-Filter — anders als tb26-code: dort ist WordPress eine Kategorie unter
 * vielen, hier ist es der gesamte Blog).
 */
export default defineEventHandler(async (): Promise<WordPressBlogPost[]> => {
  return withWpCache('all-posts', 'blog-list', async () => {
    const config = useRuntimeConfig()
    const wpUrl = config.public.wordpressUrl

    const response = await backendFetch<WpPost[]>(
      `${wpUrl}/wp-json/wp/v2/posts?per_page=50&_embed`,
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
