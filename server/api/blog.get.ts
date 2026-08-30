import type { WordPressBlogPost } from '#shared/types/wordpress'
import { createHash } from 'node:crypto'

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
 * Längster akzeptierter Suchbegriff. Der Wert kommt vom Besucher und geht in den
 * Cache-Key: ohne Deckel könnte eine Handvoll Anfragen mit sehr langen Begriffen den
 * Memory-Cache der Function-Instanz vollschreiben. 100 Zeichen sind mehr, als eine
 * echte Blogsuche je braucht.
 */
const MAX_SEARCH_LENGTH = 100

/**
 * Listet veröffentlichte WordPress-Posts (öffentliche, unauthentifizierte REST-API,
 * kein Kategorie-Filter — anders als tb26-code: dort ist WordPress eine Kategorie unter
 * vielen, hier ist es der gesamte Blog). `limit` steuert `per_page` — kleinere Werte für
 * Startseiten-Teaser/Kachelwand sparen WordPress-Antwortzeit, die reale Blog-Liste bleibt
 * beim vollen Standardwert.
 *
 * `search` und `category` reichen Suchbegriff und Kategorie an WordPress durch. Das ist
 * der einzige Weg, das gesamte Archiv zu erfassen: die Seite hält immer nur die
 * nachgeladenen Beiträge im Speicher, WordPress dagegen kennt alle ~240 — und
 * durchsucht bei `search` zusätzlich den Volltext. Ein rein clientseitiger Filter
 * beurteilte deshalb nur einen Ausschnitt (siehe docs/error-catalog.md).
 */
export default defineEventHandler(async (event): Promise<WordPressBlogPost[]> => {
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 50)
  // Ohne `page` wären nur die 50 neuesten von ~260 Beiträgen je erreichbar.
  // Negative/kaputte Werte auf Seite 1 zwingen, statt sie an WordPress durchzureichen.
  const page = Math.max(Number(query.page) || 1, 1)
  // EXTERN: freier Text vom Besucher. Trimmen (sonst landen " " und "" in
  // verschiedenen Cache-Einträgen), kappen, und unten URL-kodiert anhängen.
  const search = String(query.search ?? '').trim().slice(0, MAX_SEARCH_LENGTH)

  /**
   * Der Suchbegriff darf NICHT roh in den Cache-Key: unstorage bildet `:` auf
   * Verzeichnisebenen ab, ein `/` im Begriff erzeugte also Unterordner. Und er darf
   * nicht ans Ende gehängt werden — `…/30/1` liegt bereits als DATEI, ein Eintrag
   * `…/30/1/nasenspray` scheitert mit ENOTDIR und der Cache fällt still auf Memory
   * zurück (gemessen 30.08.2026, siehe docs/error-catalog.md).
   *
   * Ein Hash an FESTER Position löst beides: gleiche Tiefe für alle Einträge, immer
   * dateisystemsichere Zeichen, feste Länge. `all` markiert die ungefilterte Liste.
   * Der Hash schützt nichts, er benennt nur — 64 Bit reichen gegen Kollisionen.
   */
  const searchToken = search
    ? createHash('sha256').update(search).digest('hex').slice(0, 16)
    : 'all'

  // EXTERN: Ein unbekannter Slug ergibt `null` und filtert dann gar nicht, statt eine
  // fremde ID an WordPress zu geben. Der Slug selbst geht nie in den Cache-Key — nur
  // die aufgelöste ID, die aus einer festen Liste stammt.
  const categoryId = blogCategoryId(String(query.category ?? ''))
  const categoryToken = categoryId ?? 'all'

  return withWpCache(
    `all-posts:${searchToken}:${categoryToken}:${limit}:${page}`,
    'blog-list',
    async () => {
      const config = useRuntimeConfig()
      const wpUrl = config.public.wordpressUrl

      // Leerer Begriff darf nicht als `search=` mitgehen: WordPress liefert darauf zwar
      // die normale Liste, aber der Parameter würde die CDN-URL unnötig aufspalten.
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      // `categories` erwartet IDs und trifft nur die direkte Zuordnung — dieselbe
      // Semantik, die der Chip vorher clientseitig hatte.
      const categoryParam = categoryId ? `&categories=${categoryId}` : ''

      // WordPress antwortet mit 400 (`rest_post_invalid_page_number`), sobald `page`
      // hinter der letzten Seite liegt. Für "Mehr laden" ist das kein Fehler, sondern
      // schlicht das Ende der Liste — sonst würde der letzte Klick eine Fehlermeldung
      // zeigen statt einfach nichts mehr nachzuladen. Bei einer Suche ist das der
      // Normalfall: 4 Treffer auf Seite 1 heißt, Seite 2 existiert gar nicht.
      let response: WpPost[]
      try {
        response = await backendFetch<WpPost[]>(
          `${wpUrl}/wp-json/wp/v2/posts?per_page=${limit}&page=${page}${searchParam}${categoryParam}&_embed&_fields=${WP_FIELDS}`,
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
    },
  )
})
