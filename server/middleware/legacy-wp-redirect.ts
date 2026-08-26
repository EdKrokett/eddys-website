const KNOWN_PATH_PREFIXES = [
  '/api',
  '/blog',
  '/impressum',
  '/kooperationen',
  '/_nuxt',
  '/_ipx',
  '/__nuxt_devtools__',
]

const KNOWN_EXACT_PATHS = new Set([
  '/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
])

/**
 * WordPress lief bis Phase B der Domain-Migration direkt auf eduard-andrae.de/
 * www.eduard-andrae.de — entsprechend zeigen alte Backlinks und Suchmaschinen-
 * Indexeinträge (Blogposts, Seiten, Kategorien, Medien, ...) auf Pfade, die es
 * in dieser Nuxt-App nicht gibt. Sobald Phase C die Hauptdomain auf Vercel
 * umstellt, würden diese sonst als 404 in der neuen Seite enden statt beim
 * (weiterhin existierenden) WordPress unter blog.eduard-andrae.de.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  const isKnownPath = KNOWN_EXACT_PATHS.has(path)
    || KNOWN_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))

  if (isKnownPath) {
    return
  }

  return sendRedirect(event, `https://blog.eduard-andrae.de${event.path}`, 301)
})
