const CACHE_TTLS: Record<string, number> = {
  'blog-list': 1800,
  'blog-post': 3600,
}

const TOGGLE_KEY = 'wp-cache:enabled'
const DATA_PREFIX = 'wp-cache:data:'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export type WpCacheType = keyof typeof CACHE_TTLS

/**
 * Modul-globaler In-Memory-Cache als primäre Schicht: auf Vercel Serverless bleibt eine
 * Function-Instanz für nachfolgende Requests warm — dieser Cache überlebt also echte
 * Wiederholungen, ganz ohne I/O. Der `storage`-Mount (unten) ist nur noch ein
 * Best-Effort-Zusatz für den Fall, dass die Plattform persistente Storage anbietet
 * (lokal: Filesystem) — sein Ausfall (z. B. read-only Filesystem auf Vercel, nur `/tmp`
 * beschreibbar) darf den WordPress-Fetch nie zum Absturz bringen.
 */
const memoryCache = new Map<string, CacheEntry<unknown>>()

export async function withWpCache<T>(
  key: string,
  type: WpCacheType,
  fetcher: () => Promise<T>,
): Promise<T> {
  const fullKey = `${DATA_PREFIX}${type}:${key}`

  const fromMemory = memoryCache.get(fullKey) as CacheEntry<T> | undefined
  if (fromMemory && fromMemory.expiresAt > Date.now()) {
    return fromMemory.data
  }

  const storage = useStorage('data')

  try {
    const enabled = await storage.getItem<boolean>(TOGGLE_KEY) ?? true
    if (enabled) {
      const cached = await storage.getItem<CacheEntry<T>>(fullKey)
      if (cached && cached.expiresAt > Date.now()) {
        memoryCache.set(fullKey, cached)
        return cached.data
      }
    }
  } catch (error) {
    console.warn('[wpCache] Lesefehler, ignoriere Cache:', error)
  }

  const fresh = await fetcher()
  const ttl = CACHE_TTLS[type] ?? 3600
  const entry: CacheEntry<T> = { data: fresh, expiresAt: Date.now() + ttl * 1000 }

  memoryCache.set(fullKey, entry)

  try {
    await storage.setItem<CacheEntry<T>>(fullKey, entry)
  } catch (error) {
    console.warn('[wpCache] Schreibfehler, Ergebnis bleibt nur im Memory-Cache:', error)
  }

  return fresh
}
