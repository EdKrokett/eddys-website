/**
 * Webhook aus WordPress: „An diesem Beitrag hat sich die Kommentarlage geändert."
 *
 * Warum es diese Route gibt: `/blog/**` liegt per ISR am Edge (nuxt.config.ts,
 * `isr: 3600`). ISR aktualisiert auf Abruf, nicht nach Uhrzeit — nach Ablauf bekommt der
 * nächste Besucher noch die alte Fassung und stößt die Regeneration nur an. Ein Beitrag
 * mit wenig Traffic zeigte deshalb am 16.09.2026 eine 19,5 Stunden alte Kommentarzahl.
 * Statt die TTL zu senken (was jeden Beitrag ständig neu bauen ließe), meldet WordPress
 * die Änderung jetzt aktiv. Volle Herleitung: docs/blog-kommentare.md.
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
  let body: unknown
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, message: 'Body ist kein gültiges JSON' })
  }

  const postId = parseWpPostId((body as { postId?: unknown } | null)?.postId)

  if (postId === null) {
    throw createError({
      statusCode: 400,
      message: 'postId fehlt oder ist keine positive Ganzzahl',
    })
  }

  // Fehlt der Token, ist die Revalidierung wirkungslos: Vercel behandelt den Aufruf dann
  // als ganz normalen Request und liefert die gecachte Seite aus. Das MUSS auffallen,
  // sonst meldet der Webhook stillen Erfolg und die Zahl bleibt trotzdem stehen.
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
  const wpUrl = config.public.wordpressUrl
  let post: WpPostIdentity

  try {
    post = await backendFetch<WpPostIdentity>(
      `${wpUrl}/wp-json/wp/v2/posts/${postId}?_fields=id,slug,status`,
    )
  } catch (error) {
    const upstreamStatus = (error as { statusCode?: number, status?: number }).statusCode
      ?? (error as { status?: number }).status

    if (upstreamStatus === 404) {
      throw createError({
        statusCode: 404,
        message: `Kein WordPress-Beitrag mit der ID ${postId}`,
      })
    }

    throw createError({
      statusCode: 502,
      message: `WordPress nicht erreichbar (ID ${postId}): ${(error as Error).message}`,
    })
  }

  if (!post?.slug) {
    throw createError({
      statusCode: 502,
      message: `WordPress lieferte keinen Slug für ID ${postId}`,
    })
  }

  // Entwürfe, private und gelöschte Beiträge haben keine öffentliche Seite. Ein stilles
  // „ok" wäre hier irreführend — der Webhook soll im WordPress-Log erkennbar sein.
  if (post.status !== 'publish') {
    throw createError({
      statusCode: 409,
      message: `Beitrag ${postId} ist nicht veröffentlicht (status: ${post.status})`,
    })
  }

  // 3. Vercel anweisen, genau diesen Pfad zu verwerfen und neu zu rendern.
  //    Nativer fetch statt backendFetch: gebraucht werden Status und Antwort-Header
  //    (`x-vercel-cache`) als Diagnose fürs WordPress-Log, nicht der Body.
  const path = `/blog/${encodeURIComponent(post.slug)}`
  const target = `${config.revalidateBaseUrl}${path}`

  let revalidateStatus: number
  let vercelCache: string | null

  try {
    const response = await fetch(target, {
      headers: { 'x-prerender-revalidate': bypassToken },
      // Ein Render kostet auf kaltem Pfad ein bis drei Sekunden; 20 s sind großzügig,
      // verhindern aber ein unbegrenzt offenes WordPress-Ereignis.
      signal: AbortSignal.timeout(20_000),
    })

    revalidateStatus = response.status
    vercelCache = response.headers.get('x-vercel-cache')
    // Body wird nicht gebraucht, muss aber verworfen werden, damit die Verbindung
    // sauber schließt.
    await response.arrayBuffer()
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: `Revalidierung von ${path} fehlgeschlagen: ${(error as Error).message}`,
    })
  }

  if (revalidateStatus >= 400) {
    throw createError({
      statusCode: 502,
      message: `Revalidierung von ${path} antwortete mit ${revalidateStatus}`,
    })
  }

  // Ein HIT heißt: Vercel hat die gecachte Seite ausgeliefert, statt neu zu bauen — der
  // `x-prerender-revalidate`-Header wurde also ignoriert. Häufigste Ursache: Im Build
  // stand kein oder ein anderer VERCEL_BYPASS_TOKEN. Ohne diese Prüfung meldete der
  // Webhook Erfolg, während die alte Kommentarzahl stehen bleibt (beim ersten lokalen
  // Testlauf am 16.09.2026 genau so passiert). Lokal fehlt der Header ganz — `null` ist
  // deshalb kein Fehler.
  if (vercelCache === 'HIT') {
    throw createError({
      statusCode: 502,
      message: `${path} wurde NICHT neu gebaut (x-vercel-cache: HIT) — `
        + 'der Bypass-Token wurde ignoriert. Stimmt VERCEL_BYPASS_TOKEN im Vercel-Build?',
    })
  }

  return {
    revalidated: true,
    postId,
    path,
    vercelCache,
  }
})
