export interface PathRevalidation {
  path: string
  /** HTTP-Status der Antwort, 0 wenn die Anfrage gar nicht zustande kam. */
  status: number
  /** Vercels Cache-Urteil. `null` in Dev, wo es kein Edge-Caching gibt. */
  vercelCache: string | null
  ok: boolean
  error?: string
}

/**
 * Ein Render kostet auf kaltem Pfad ein bis drei Sekunden. 15 s pro Pfad sind großzügig
 * und bleiben trotzdem unter dem 20-Sekunden-Limit, mit dem das WordPress-Plugin wartet —
 * die Pfade laufen parallel, nicht nacheinander.
 */
const REVALIDATE_TIMEOUT_MS = 15_000

/**
 * Lässt Vercel die angegebenen Pfade verwerfen und neu rendern.
 *
 * WICHTIG — warum je zwei Pfade pro Seite nötig sind: Eine Nuxt-Seite liegt am Edge in
 * ZWEI Fassungen. Das HTML bekommt, wer die URL direkt aufruft; die Datei
 * `<pfad>/_payload.json` bekommt, wer innerhalb der Seite dorthin klickt. Beide sind
 * eigene Cache-Einträge unter derselben `isr`-Regel, und beide enthalten dieselben Daten
 * (nachgewiesen am 16.09.2026: die Payload eines Beitrags enthält den kompletten
 * Kommentarbaum). Wer nur das HTML revalidiert, repariert die Seite für Direktaufrufe und
 * lässt sie für jeden Klick aus der Übersicht veraltet — ein Fehlerbild, das genau dann
 * auftritt, wenn man es am wenigsten vermutet.
 *
 * Läuft parallel: Vier Pfade nacheinander lägen an der Zeitgrenze, mit der WordPress wartet.
 *
 * @param paths Pfade mit führendem Schrägstrich, z. B. `/blog/mein-beitrag`.
 */
export async function revalidatePaths(
  paths: string[],
  baseUrl: string,
  bypassToken: string,
): Promise<PathRevalidation[]> {
  return Promise.all(paths.map(path => revalidateSinglePath(path, baseUrl, bypassToken)))
}

async function revalidateSinglePath(
  path: string,
  baseUrl: string,
  bypassToken: string,
): Promise<PathRevalidation> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { 'x-prerender-revalidate': bypassToken },
      signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
    })

    const vercelCache = response.headers.get('x-vercel-cache')
    // Body wird nicht gebraucht, muss aber verworfen werden, damit die Verbindung
    // sauber schließt.
    await response.arrayBuffer()

    // Ein HIT heißt: Vercel hat die gecachte Fassung ausgeliefert, statt neu zu bauen —
    // der `x-prerender-revalidate`-Header wurde also ignoriert. Häufigste Ursache: Im
    // Build stand kein oder ein anderer VERCEL_BYPASS_TOKEN. Ohne diese Prüfung meldete
    // der Webhook Erfolg, während der alte Stand stehen bleibt (beim ersten Testlauf am
    // 16.09.2026 genau so passiert). In Dev fehlt der Header ganz — `null` ist deshalb
    // kein Fehler.
    if (vercelCache === 'HIT') {
      return {
        path,
        status: response.status,
        vercelCache,
        ok: false,
        error: 'nicht neu gebaut (x-vercel-cache: HIT) — Bypass-Token wurde ignoriert',
      }
    }

    // 404 ist ein LEGITIMES Ergebnis: Bei einem gelöschten Beitrag soll genau das in den
    // Cache, damit die Seite verschwindet. Nur echte Fehler zählen als Fehlschlag.
    const ok = response.status < 400 || response.status === 404

    return {
      path,
      status: response.status,
      vercelCache,
      ok,
      ...(ok ? {} : { error: `Antwort ${response.status}` }),
    }
  } catch (error) {
    return {
      path,
      status: 0,
      vercelCache: null,
      ok: false,
      error: (error as Error).message,
    }
  }
}

/**
 * Die Pfade, unter denen eine Beitragsseite am Edge liegt.
 *
 * Der Slug wird kodiert, weil er am Ende in einer URL steht; normale WordPress-Slugs
 * (a–z, 0–9, `-`) bleiben dabei unverändert.
 */
export function postPaths(slug: string): string[] {
  const encoded = encodeURIComponent(slug)
  return [`/blog/${encoded}`, `/blog/${encoded}/_payload.json`]
}

/** Die Pfade der Beitragsübersicht. */
export function blogIndexPaths(): string[] {
  return ['/blog', '/blog/_payload.json']
}
