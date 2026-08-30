import type { WordPressBlogPostDetail } from '#shared/types/wordpress'

/**
 * Lädt einen einzelnen WordPress-Post per Slug.
 *
 * Die eigentliche Arbeit liegt in `server/utils/wp-post.ts`, weil die Kommentar-Route
 * (`[slug]/comments.get.ts`) denselben Cache-Eintrag für die Post-ID nutzt.
 */
export default defineEventHandler(async (event): Promise<WordPressBlogPostDetail> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug parameter is required',
    })
  }

  try {
    return await fetchWpPostBySlug(slug)
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
