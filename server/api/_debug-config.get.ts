/**
 * Temporäre Diagnose-Route, um ein Env-Var-Problem auf Vercel einzugrenzen —
 * nach Klärung wieder entfernen.
 */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const raw = config.public.wordpressUrl
  return {
    raw,
    typeofRaw: typeof raw,
    length: raw?.length ?? null,
    jsonStringified: JSON.stringify(raw),
    envVarPresent: 'NUXT_PUBLIC_WORDPRESS_URL' in process.env,
    envVarRaw: JSON.stringify(process.env.NUXT_PUBLIC_WORDPRESS_URL),
  }
})
