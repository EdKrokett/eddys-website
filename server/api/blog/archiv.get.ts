import type { BlogArchivEntry } from '#shared/types/wordpress'

/**
 * Alle veröffentlichten Beiträge, neueste zuerst — für `/blog/archiv`.
 *
 * Statischer Pfad: Nitro bedient ihn vor `[slug].get.ts`. Ein Beitrag mit dem Slug
 * `archiv` wäre damit über die API nicht erreichbar; es gibt keinen (docs/blog-archiv.md).
 */
export default defineEventHandler(async (): Promise<BlogArchivEntry[]> => {
  try {
    return await fetchBlogArchiv()
  } catch (error: unknown) {
    throw createError({
      statusCode: 502,
      message: `Fehler beim Laden des Archivs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
    })
  }
})
