import type { WordPressBlogPost } from '#shared/types/wordpress'

/**
 * Bild-URLs für die dekorative Hero-Kachelwand — eigener, client-seitiger Lazy-Fetch
 * (blockiert die SSR-LCP nicht, Muster von trusted-blogs `useMagazineWallImages`).
 * Eigener Cache-Key statt Teilen mit `useBlog()`: unterschiedliche Fetch-Semantik
 * (hier lazy/client-only), der Server-Response ist über `withWpCache` ohnehin
 * 30 Minuten gecacht — die zweite Anfrage kostet keinen echten WordPress-Roundtrip.
 * Größe/Format der Bilder regelt NuxtImg im Template (IPX-Transform), nicht hier.
 */
export function useBlogWallImages() {
  const nuxtApp = useNuxtApp()
  const { data, status } = useFetch<WordPressBlogPost[]>('/api/blog', {
    key: 'blog-wall-images',
    lazy: true,
    server: false,
    default: () => [],
    getCachedData: key => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })

  const wallImages = computed(() => {
    const seen = new Set<string>()
    const urls: string[] = []
    for (const post of data.value) {
      if (post.featuredImage && !seen.has(post.featuredImage)) {
        seen.add(post.featuredImage)
        urls.push(post.featuredImage)
      }
    }
    return urls
  })

  return { wallImages, status }
}
