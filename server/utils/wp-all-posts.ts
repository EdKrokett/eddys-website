/** Mehr gibt WordPress pro Anfrage nicht heraus. */
const PER_PAGE = 100
/** Sicherung gegen eine Endlosschleife, falls WordPress nie eine kurze Seite liefert.
 *  Reicht für 2.000 Beiträge, heute sind es rund 250. */
const MAX_PAGES = 20

/**
 * Holt ALLE veröffentlichten Beiträge, seitenweise, mit genau den Feldern aus `fields`.
 * Gemeinsame Schleife für Sitemap (`server/api/__sitemap__/posts.get.ts`) und Archiv
 * (`server/utils/blog-archiv.ts`).
 *
 * Gibt die Rohdaten unverändert zurück (`unknown[]`): Prüfen ist Sache des Aufrufers,
 * jeder braucht andere Felder.
 */
export async function fetchAllWpPosts(fields: string): Promise<unknown[]> {
  const wpUrl = useRuntimeConfig().public.wordpressUrl
  const all: unknown[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    let batch: unknown
    try {
      batch = await backendFetch<unknown>(
        `${wpUrl}/wp-json/wp/v2/posts?per_page=${PER_PAGE}&page=${page}&_fields=${fields}`,
      )
    } catch (error: unknown) {
      // Bei genau 100, 200, … Beiträgen ist die Seite danach leer, und WordPress
      // antwortet darauf mit 400 (`rest_post_invalid_page_number`). Das ist das Ende
      // der Liste, kein Fehler. Auf Seite 1 dagegen schon: dann lieber gar keine
      // Liste als eine halbe im Cache.
      const status = (error as { status?: number, statusCode?: number })?.status
        ?? (error as { statusCode?: number })?.statusCode
      if (status === 400 && page > 1) break
      throw error
    }

    // EXTERN: Eine Antwort, die keine Liste ist, beendet die Schleife statt sie zu sprengen.
    if (!Array.isArray(batch)) break
    all.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  return all
}
