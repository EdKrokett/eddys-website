import type { StatistikResponse } from '#shared/types/statistik'
import { parseLauf } from '#shared/utils/lauf'

/**
 * Eddys Läufe aus dem WordPress-Plugin eddy-laufstatistik (docs/statistik.md).
 *
 * Bewusst OHNE `withWpCache`: `/statistik` liegt per ISR am Edge und wird vom Inhalts-Webhook
 * neu gebaut, sobald sich ein Lauf ändert. Ein Memory-Cache hier würde genau diesen Neubau
 * mit dem alten Stand füttern (dieselbe Falle wie bei den Kommentaren, siehe wpCache.ts).
 */
export default defineEventHandler(async (): Promise<StatistikResponse> => {
  const wpUrl = useRuntimeConfig().public.wordpressUrl

  let raw: unknown
  try {
    raw = await backendFetch<unknown>(`${wpUrl}/wp-json/eddy-laufstatistik/v1/laeufe`)
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: `Laufstatistik nicht erreichbar: ${(error as Error).message}`,
    })
  }

  // EXTERN: Ohne aktives Plugin liefert WordPress ein Fehlerobjekt statt einer Liste.
  if (!Array.isArray(raw)) {
    throw createError({ statusCode: 502, message: 'Laufstatistik: Antwort ist keine Liste' })
  }

  const laeufe = raw.map(parseLauf).filter(lauf => lauf !== null)
  const verworfen = raw.length - laeufe.length

  if (verworfen > 0) {
    console.warn(`[statistik] ${verworfen} von ${raw.length} Läufen verworfen (Prüfung in shared/utils/lauf.ts)`)
  }

  // Nicht auf die Sortierung von WordPress verlassen: Diagramme und Gruppierung setzen sie voraus.
  laeufe.sort((a, b) => b.datum.localeCompare(a.datum) || b.id - a.id)

  return { laeufe, verworfen, stand: new Date().toISOString() }
})
