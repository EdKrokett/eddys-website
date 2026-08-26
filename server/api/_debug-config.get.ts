/**
 * Temporäre Diagnose-Route, um ein Env-Var-Problem auf Vercel einzugrenzen —
 * nach Klärung wieder entfernen.
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const raw = config.public.wordpressUrl

  let fetchResult: unknown
  try {
    const posts = await backendFetch(`${raw}/wp-json/wp/v2/posts?per_page=1&_embed`)
    fetchResult = { ok: true, sample: Array.isArray(posts) ? posts.length : posts }
  } catch (err: unknown) {
    fetchResult = {
      ok: false,
      name: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      cause: err instanceof Error && err.cause ? String(err.cause) : null,
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : null,
    }
  }

  return {
    raw,
    fetchResult,
  }
})
