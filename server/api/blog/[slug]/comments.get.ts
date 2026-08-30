import type { WordPressComment, WordPressCommentsResponse } from '#shared/types/wordpress'

interface WpComment {
  id: number
  parent: number
  author: number
  author_name: string
  author_url: string
  date: string
  content: { rendered: string }
}

/** WordPress' Maximum pro Anfrage. Siehe docs/blog-kommentare.md zur bewussten Grenze. */
const MAX_COMMENTS = 100

const WP_FIELDS = ['id', 'parent', 'author', 'author_name', 'author_url', 'date', 'content'].join(',')

/**
 * Kommentare eines Beitrags als fertiger Antwortbaum.
 *
 * Zwei Dinge passieren bewusst hier auf dem Server und nicht im Client:
 * 1. Das Kommentar-HTML wird zu reinem Text abgebaut (`commentHtmlToParagraphs`) —
 *    Kommentare sind Fremdtext, kein `v-html`. Siehe docs/blog-kommentare.md.
 * 2. Der Antwortbaum wird gebaut, damit der Client nur noch rendert.
 */
export default defineEventHandler(async (event): Promise<WordPressCommentsResponse> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug parameter is required' })
  }

  // Holt die Post-ID aus dem Cache-Eintrag, den die Detailseite ohnehin füllt.
  const post = await fetchWpPostBySlug(slug)

  return withWpCache(String(post.id), 'blog-comments', async () => {
    const config = useRuntimeConfig()
    const wpUrl = config.public.wordpressUrl

    const response = await backendFetch<WpComment[]>(
      `${wpUrl}/wp-json/wp/v2/comments`
      + `?post=${post.id}&per_page=${MAX_COMMENTS}&order=asc&orderby=date&_fields=${WP_FIELDS}`,
    )

    const comments: WordPressComment[] = (response ?? []).map(raw => ({
      id: raw.id,
      parent: raw.parent ?? 0,
      // Anonyme Kommentare kommen mit leerem Namen vor (geprüft: Kommentar 125111).
      authorName: decodeHtmlEntities(raw.author_name).trim() || 'Anonym',
      authorUrl: safeAuthorUrl(raw.author_url),
      date: raw.date,
      paragraphs: commentHtmlToParagraphs(raw.content?.rendered),
      // Nur der nachweislich eingeloggte Benutzer, nicht über den Namen geraten.
      isSiteAuthor: (raw.author ?? 0) !== 0,
    }))
      // Ein Kommentar ohne Textinhalt (nur Markup) hätte nichts anzuzeigen.
      .filter(comment => comment.paragraphs.length > 0)

    return {
      total: comments.length,
      truncated: (response?.length ?? 0) >= MAX_COMMENTS,
      threads: buildCommentThreads(comments),
    }
  })
})

/**
 * Die Autoren-URL gibt der Kommentator selbst an — also nur http(s) durchlassen.
 * `javascript:`/`data:` würden sonst als Link im Template landen.
 */
function safeAuthorUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}
