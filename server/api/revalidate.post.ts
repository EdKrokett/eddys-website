/**
 * Webhook aus WordPress: „Hier hat sich etwas geändert, bau die betroffenen Seiten neu."
 *
 * Warum es diese Route gibt: `/blog` und `/blog/**` liegen per ISR am Edge
 * (nuxt.config.ts). ISR aktualisiert auf Abruf, nicht nach Uhrzeit — nach Ablauf bekommt
 * der nächste Besucher noch die alte Fassung und stößt die Regeneration nur an. Ein
 * Beitrag mit wenig Traffic zeigte deshalb am 16.09.2026 eine 19,5 Stunden alte
 * Kommentarzahl. Statt die TTL zu senken (was jeden Beitrag ständig neu bauen ließe),
 * meldet WordPress jede Änderung aktiv. Herleitung: docs/revalidierung.md.
 *
 * Gegenstück im WordPress: wordpress/eddy-comment-revalidate/.
 *
 * Bewusst NICHT unter /api/blog/: für diesen Pfad setzt nuxt.config.ts einen
 * `s-maxage`-Cache-Header, der auf einem Webhook nichts zu suchen hat.
 */
interface WpPostIdentity {
  id: number
  slug: string
  status: string
}

interface RevalidateBody {
  postId?: unknown
  scope?: unknown
  slug?: unknown
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 1. Ausweis prüfen, BEVOR irgendetwas gelesen oder abgefragt wird. Ohne gültiges
  //    Secret darf diese Route keinen einzigen Fremdrequest auslösen.
  if (!revalidateSecretMatches(getHeader(event, 'x-revalidate-secret'), config.revalidateSecret)) {
    throw createError({
      statusCode: 401,
      message: 'Ungültiges oder fehlendes Revalidate-Secret',
    })
  }

  // EXTERN: readBody wirft bei kaputtem JSON — das wäre eine 500 für einen reinen
  // Eingabefehler, deshalb abgefangen.
  let body: RevalidateBody | null
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, message: 'Body ist kein gültiges JSON' })
  }

  const postId = parseWpPostId(body?.postId)

  if (postId === null) {
    throw createError({
      statusCode: 400,
      message: 'postId fehlt oder ist keine positive Ganzzahl',
    })
  }

  const scope = parseRevalidateScope(body?.scope)
  // Nur als Rückfallebene für gelöschte Beiträge gedacht, siehe unten.
  const fallbackSlug = parseWpSlug(body?.slug)

  // Fehlt der Token, ist die Revalidierung wirkungslos: Vercel behandelt den Aufruf dann
  // als ganz normalen Request und liefert die gecachte Seite aus. Das MUSS auffallen,
  // sonst meldet der Webhook stillen Erfolg und der alte Stand bleibt trotzdem stehen.
  const bypassToken = config.vercelBypassToken
  if (!bypassToken) {
    throw createError({
      statusCode: 503,
      message: 'VERCEL_BYPASS_TOKEN ist nicht gesetzt — Revalidierung nicht möglich',
    })
  }

  // 2. Den Slug NICHT aus dem Body nehmen, sondern bei WordPress holen. Der Body ist
  //    Fremdeingabe, und der Slug bestimmt die URL, die dieser Server gleich selbst
  //    aufruft. Über die ID ist der einzige Fremdwert eine geprüfte Zahl.
  const post = await fetchPostIdentity(config.public.wordpressUrl, postId)

  const paths: string[] = []

  if (post) {
    // Ein Entwurf oder ein Beitrag im Papierkorb hat keine öffentliche Seite mehr. Bei
    // einer Beitragsmeldung ist das kein Fehler, sondern genau der Anlass: Die Seite muss
    // aus dem Cache verschwinden. Bei einer Kommentarmeldung dagegen gibt es nichts zu tun.
    if (post.status !== 'publish' && scope === 'comment') {
      throw createError({
        statusCode: 409,
        message: `Beitrag ${postId} ist nicht veröffentlicht (status: ${post.status})`,
      })
    }

    paths.push(...postPaths(post.slug))
  } else if (fallbackSlug) {
    // WordPress kennt den Beitrag nicht mehr — endgültig gelöscht. Dann ist der
    // mitgeschickte Slug die einzige Quelle für den Pfad, der aus dem Cache muss.
    // Er hat `parseWpSlug` passiert und kann die Pfadebene nicht verlassen.
    paths.push(...postPaths(fallbackSlug))
  } else if (scope === 'comment') {
    // Ohne Beitrag und ohne Slug gibt es bei einer Kommentarmeldung nichts zu revalidieren.
    throw createError({
      statusCode: 404,
      message: `Kein WordPress-Beitrag mit der ID ${postId}`,
    })
  }

  // Die Übersicht listet Beiträge, nicht Kommentare — sie muss nur bei Beitragsänderungen
  // neu gebaut werden. Ein neuer Kommentar würde sie sonst grundlos mit erneuern.
  if (scope === 'post') {
    paths.push(...blogIndexPaths())
  }

  const results = await revalidatePaths(paths, config.revalidateBaseUrl, bypassToken)
  const failed = results.filter(result => !result.ok)

  if (failed.length > 0) {
    throw createError({
      statusCode: 502,
      message: `Revalidierung fehlgeschlagen für ${failed.length} von ${results.length} Pfaden: `
        + failed.map(result => `${result.path} (${result.error})`).join('; '),
    })
  }

  return {
    revalidated: true,
    postId,
    scope,
    paths: results.map(result => ({ path: result.path, vercelCache: result.vercelCache })),
  }
})

/**
 * Holt Slug und Status zu einer Post-ID.
 *
 * @returns den Beitrag, oder `null` wenn WordPress ihn nicht (mehr) kennt. Ein 404 ist
 * hier ein erwarteter Zustand — bei einem gelöschten Beitrag soll die Seite ja gerade
 * deshalb neu gebaut werden — und deshalb kein Fehler.
 */
async function fetchPostIdentity(wpUrl: string, postId: number): Promise<WpPostIdentity | null> {
  try {
    // `status=any` ist nicht nötig: Die REST-API liefert auch Entwürfe und Papierkorb
    // mit Status aus, solange nach ID abgefragt wird.
    return await backendFetch<WpPostIdentity>(
      `${wpUrl}/wp-json/wp/v2/posts/${postId}?_fields=id,slug,status`,
    )
  } catch (error) {
    const upstreamStatus = (error as { statusCode?: number, status?: number }).statusCode
      ?? (error as { status?: number }).status

    if (upstreamStatus === 404 || upstreamStatus === 401 || upstreamStatus === 403) {
      return null
    }

    throw createError({
      statusCode: 502,
      message: `WordPress nicht erreichbar (ID ${postId}): ${(error as Error).message}`,
    })
  }
}
