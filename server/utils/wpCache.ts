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
 * Cache ist ein Optimierung, kein Korrektheits-Erfordernis — Lese-/Schreibfehler des
 * Storage-Mounts (z. B. read-only Filesystem auf Vercel Serverless: nur `/tmp`
 * beschreibbar) dürfen den eigentlichen WordPress-Fetch nie zum Absturz bringen,
 * deshalb best-effort statt harter Abhängigkeit.
 */
export async function withWpCache<T>(
  key: string,
  type: WpCacheType,
  fetcher: () => Promise<T>,
): Promise<T> {
  const storage = useStorage('data')
  const fullKey = `${DATA_PREFIX}${type}:${key}`

  try {
    const enabled = await storage.getItem<boolean>(TOGGLE_KEY) ?? true
    if (enabled) {
      const cached = await storage.getItem<CacheEntry<T>>(fullKey)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data
      }
    }
  } catch (error) {
    console.warn('[wpCache] Lesefehler, ignoriere Cache:', error)
  }

  const fresh = await fetcher()

  try {
    const ttl = CACHE_TTLS[type] ?? 3600
    await storage.setItem<CacheEntry<T>>(fullKey, {
      data: fresh,
      expiresAt: Date.now() + ttl * 1000,
    })
  } catch (error) {
    console.warn('[wpCache] Schreibfehler, Ergebnis bleibt ungecacht:', error)
  }

  return fresh
}
