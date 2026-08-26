import type { WordPressBlogPost } from '#shared/types/wordpress'

interface UseBlogOptions {
  /** Wie viele Posts von WordPress geladen werden (`per_page`). Default: 50 (volle Liste). */
  limit?: number
  /** Client-seitig, nicht-blockierend laden — für Below-the-Fold-Teaser, die die SSR-LCP
   * nicht aufhalten sollen (Muster von trusted-blogs `useMagazineHighlights`). Default: false
   * (SSR, damit z. B. die /blog-Übersicht crawlbar bleibt). */
  lazy?: boolean
}

/**
 * Lädt und filtert Blogposts vom eigenen WordPress (server/api/blog.get.ts).
 */
export function useBlog(options: UseBlogOptions = {}) {
  const { limit = 50, lazy = false } = options

  const { data, status, error, refresh } = useFetch<WordPressBlogPost[]>('/api/blog', {
    key: `blog-posts-${limit}`,
    query: { limit },
    lazy,
    server: !lazy,
    default: () => [],
  })

  const searchQuery = ref('')

  const filteredPosts = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return data.value

    return data.value.filter(post =>
      post.title.toLowerCase().includes(query)
      || post.excerpt.toLowerCase().includes(query),
    )
  })

  return {
    posts: data,
    filteredPosts,
    searchQuery,
    status,
    error,
    refresh,
  }
}
