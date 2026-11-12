/**
 * Wie eine Seite antwortet, wenn ihre Daten beim Server-Rendering nicht geladen werden konnten.
 *
 * Hintergrund (docs/error-catalog.md, „Kurzer WordPress-Ausfall wird als 404 gecacht“):
 * Vercel hält ISR-Seiten mit Status 200 und 404 bis zum Ablauf am Edge. Eine 5xx gilt
 * dagegen als gescheiterte Neuberechnung: Die letzte gute Fassung bleibt stehen, nach
 * 30 Sekunden wird es erneut versucht. Ein vorübergehender Fehler darf deshalb nie als
 * 404 oder als 200 mit Fehlerhinweis enden, sonst bleibt die Seite stundenlang kaputt.
 */

/** 404 nur, wenn die eigene API ausdrücklich „gibt es nicht“ gemeldet hat, sonst 503. */
export function wpLoadErrorStatus(error: unknown): 404 | 503 {
  return statusCodeOf(error) === 404 ? 404 : 503
}

/**
 * Ist mindestens ein Datenabruf gescheitert?
 *
 * @param errors `nuxtApp.payload._errors`: je Schlüssel eines `useFetch`/`useAsyncData`
 *   der Fehler oder `undefined`/`null`, wenn der Abruf geklappt hat.
 */
export function hasFailedData(errors: unknown): boolean {
  if (!errors || typeof errors !== 'object') return false
  return Object.values(errors).some(error => error !== undefined && error !== null)
}

function statusCodeOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('statusCode' in error)) return undefined
  return typeof error.statusCode === 'number' ? error.statusCode : undefined
}
