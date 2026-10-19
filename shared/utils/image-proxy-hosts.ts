/**
 * Server, deren Bilder über den eigenen Bild-Proxy laufen dürfen. Einzige Quelle für
 * `image.domains` in `nuxt.config.ts` UND für `proxyForeignImages`.
 *
 * WARUM eine gemeinsame Liste: Steht ein Host nicht in `image.domains`, baut `useImage()`
 * keine Proxy-URL, sondern gibt die Original-URL unverändert zurück
 * (`validateDomains` in IPX und im Vercel-Provider). Der Browser lüde das Bild dann
 * direkt beim fremden Server. `proxyForeignImages` entfernt deshalb jedes fremde Bild,
 * dessen Host hier fehlt, statt es dem Proxy zu übergeben.
 *
 * Exakte Hostnamen, keine Subdomain-Treffer: `@nuxt/image` vergleicht genauso.
 * Hintergrund und Bestand: docs/blog-einbettungen.md.
 */
export const IMAGE_PROXY_HOSTS: readonly string[] = [
  'blog.eduard-andrae.de',
  // Vorschaubilder der YouTube-Platzhalter in Blogbeiträgen.
  'i.ytimg.com',
  // Alte Beiträge binden Bilder direkt von hier ein. Nur die noch erreichbaren Server
  // (geprüft 19.10.2026); Bilder toter Server entfernt `proxyForeignImages`.
  '3.bp.blogspot.com',
  'lh4.ggpht.com',
  'static.xx.fbcdn.net',
]
