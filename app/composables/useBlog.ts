import type { WordPressBlogPost } from '#shared/types/wordpress'

/**
 * Lädt und filtert Blogposts vom eigenen WordPress (server/api/blog.get.ts).
 */
export function useBlog() {
  const { data, status, error, refresh } = useFetch<WordPressBlogPost[]>('/api/blog', {
    key: 'blog-posts',
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
