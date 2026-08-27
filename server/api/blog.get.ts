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
 * Nur die Felder anfordern, die unten auch gemappt werden. WordPress liefert sonst
 * `content.rendered` jedes Beitrags voll mit — bei 24 Posts sind das 743 KB statt
 * 226 KB und 2,05 s statt 1,16 s Antwortzeit am Origin (gemessen 27.08.2026).
 *
 * `_embedded` muss explizit in der Liste stehen: `_fields` filtert die Antwort auch
 * dann, wenn `_embed` gesetzt ist — ohne den Eintrag fielen Beitragsbild und
 * Kategorien weg. Die beiden `_links.wp:*` sind das, woran WordPress erkennt, was
 * es überhaupt einbetten soll; ohne sie bleibt `_embedded` leer.
 */
const WP_FIELDS = [
  'id',
  'slug',
  'title',
  'excerpt',
  'date',
  '_links.wp:featuredmedia',
  '_links.wp:term',
  '_embedded',
].join(',')

/**
 * Listet veröffentlichte WordPress-Posts (öffentliche, unauthentifizierte REST-API,
 * kein Kategorie-Filter — anders als tb26-code: dort ist WordPress eine Kategorie unter
 * vielen, hier ist es der gesamte Blog). `limit` steuert `per_page` — kleinere Werte für
 * Startseiten-Teaser/Kachelwand sparen WordPress-Antwortzeit, die reale Blog-Liste bleibt
 * beim vollen Standardwert.
 */
export default defineEventHandler(async (event): Promise<WordPressBlogPost[]> => {
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 50)
  // Ohne `page` wären nur die 50 neuesten von ~260 Beiträgen je erreichbar.
  // Negative/kaputte Werte auf Seite 1 zwingen, statt sie an WordPress durchzureichen.
  const page = Math.max(Number(query.page) || 1, 1)

  return withWpCache(`all-posts:${limit}:${page}`, 'blog-list', async () => {
    const config = useRuntimeConfig()
    const wpUrl = config.public.wordpressUrl

    // WordPress antwortet mit 400 (`rest_post_invalid_page_number`), sobald `page`
    // hinter der letzten Seite liegt. Für "Mehr laden" ist das kein Fehler, sondern
    // schlicht das Ende der Liste — sonst würde der letzte Klick eine Fehlermeldung
    // zeigen statt einfach nichts mehr nachzuladen.
    let response: WpPost[]
    try {
      response = await backendFetch<WpPost[]>(
        `${wpUrl}/wp-json/wp/v2/posts?per_page=${limit}&page=${page}&_embed&_fields=${WP_FIELDS}`,
      )
    } catch (error: unknown) {
      const status = (error as { status?: number, statusCode?: number })?.status
        ?? (error as { statusCode?: number })?.statusCode
      if (status === 400 && page > 1) return []
      throw error
    }

    return response.map((post) => {
      const terms = post._embedded?.['wp:term']?.flat() ?? []

      return {
        id: post.id,
        slug: post.slug,
        // WordPress liefert Entities ("wird&#8217;s") — ohne Dekodieren stünden die
        // wörtlich auf der Seite, weil Titel per v-text gerendert werden.
        title: decodeHtmlEntities(post.title.rendered),
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
  })
})
