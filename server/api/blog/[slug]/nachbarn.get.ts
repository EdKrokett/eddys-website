import type { BlogNachbarn } from '#shared/types/wordpress'

/**
 * Chronologische Nachbarn und verwandte Beiträge für den Weiterlesen-Block am Ende
 * jeder Beitragsseite. Konzept: docs/blog-archiv.md.
 *
 * Ein unbekannter Slug ist hier kein 404: Ein gerade veröffentlichter Beitrag kann neuer
 * sein als die gecachte Archivliste. Dann gibt es eben (noch) keine Nachbarn.
 */
export default defineEventHandler(async (event): Promise<BlogNachbarn> => {
  // EXTERN: aus der URL. Dekodiert, weil die Archivliste dekodierte Slugs führt.
  const slug = getRouterParam(event, 'slug', { decode: true })

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug parameter is required',
    })
  }

  try {
    return findNachbarn(await fetchBlogArchiv(), slug)
  } catch (error: unknown) {
    throw createError({
      statusCode: 502,
      message: `Fehler beim Laden der Nachbarbeiträge: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
    })
  }
})
