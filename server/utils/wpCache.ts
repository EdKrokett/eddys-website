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

export async function withWpCache<T>(
  key: string,
  type: WpCacheType,
  fetcher: () => Promise<T>,
): Promise<T> {
  const storage = useStorage('data')

  const enabled = await storage.getItem<boolean>(TOGGLE_KEY) ?? true
  if (!enabled) {
    return fetcher()
  }

  const fullKey = `${DATA_PREFIX}${type}:${key}`
  const cached = await storage.getItem<CacheEntry<T>>(fullKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const fresh = await fetcher()
  const ttl = CACHE_TTLS[type] ?? 3600

  await storage.setItem<CacheEntry<T>>(fullKey, {
    data: fresh,
    expiresAt: Date.now() + ttl * 1000,
  })

  return fresh
}
