import type { WordPressBlogPost } from '#shared/types/wordpress'

interface UseBlogOptions {
  /** Wie viele Posts pro Seite geladen werden (`per_page`). Default: 30. */
  limit?: number
  /** Client-seitig, nicht-blockierend laden — für Below-the-Fold-Teaser, die die SSR-LCP
   * nicht aufhalten sollen (Muster von trusted-blogs `useMagazineHighlights`). Default: false
   * (SSR, damit z. B. die /blog-Übersicht crawlbar bleibt). */
  lazy?: boolean
  /** Aktiviert "Mehr laden". Ohne das bleibt es bei der ersten Seite. */
  paginated?: boolean
}

/**
 * Lädt und filtert Blogposts vom eigenen WordPress (server/api/blog.get.ts).
 *
 * Der Blog hat rund 260 Beiträge, WordPress liefert aber maximal 100 pro Anfrage —
 * ohne Nachladen wäre der ältere Teil des Archivs gar nicht erreichbar. Deshalb
 * hängt `loadMore()` weitere Seiten an.
 *
 * Die Filterlogik liegt in `filterPosts` (app/utils/filter-posts.ts), damit sie
 * ohne Nuxt-Runtime testbar ist.
 */
export function useBlog(options: UseBlogOptions = {}) {
  const { limit = 30, lazy = false, paginated = false } = options

  const { data, status, error, refresh } = useFetch<WordPressBlogPost[]>('/api/blog', {
    key: `blog-posts-${limit}`,
    query: { limit, page: 1 },
    lazy,
    server: !lazy,
    default: () => [],
  })

  /** Ab Seite 2 nachgeladene Beiträge — bewusst getrennt von `data`, damit ein
   *  Refresh der ersten Seite die Nachladungen nicht still verwirft. */
  const extraPosts = ref<WordPressBlogPost[]>([])
  const page = ref(1)
  const isLoadingMore = ref(false)
  /** Wird gesetzt, sobald eine Nachladung leer oder kürzer als `limit` war. */
  const reachedEnd = ref(false)

  const allPosts = computed(() => [...data.value, ...extraPosts.value])

  /**
   * Bewusst ein `computed` statt eines Watchers mit `immediate: true`:
   * Der Watcher lief serverseitig, BEVOR useFetch aufgelöst war (`data` noch `[]`),
   * setzte `hasMore` auf false und erzeugte damit einen Hydration-Mismatch — der
   * Client sah die Daten sofort aus dem Payload und kam zum gegenteiligen Ergebnis.
   * Als abgeleiteter Wert kann diese Divergenz gar nicht erst entstehen.
   */
  const hasMore = computed(() =>
    paginated && !reachedEnd.value && data.value.length >= limit,
  )

  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value) return

    isLoadingMore.value = true
    try {
      const next = await $fetch<WordPressBlogPost[]>('/api/blog', {
        query: { limit, page: page.value + 1 },
      })

      if (next.length === 0) {
        reachedEnd.value = true
        return
      }

      page.value += 1
      // shallowRef-Regel: neues Array zuweisen statt zu mutieren.
      extraPosts.value = [...extraPosts.value, ...next]

      if (next.length < limit) reachedEnd.value = true
    } catch {
      // Kein stiller Fehler: Button verschwindet, die bereits geladenen
      // Beiträge bleiben sichtbar.
      reachedEnd.value = true
    } finally {
      isLoadingMore.value = false
    }
  }

  const searchQuery = ref('')
  const activeCategory = ref<string | null>(null)

  const filteredPosts = computed(() =>
    filterPosts(allPosts.value, searchQuery.value, activeCategory.value),
  )

  return {
    posts: allPosts,
    filteredPosts,
    searchQuery,
    activeCategory,
    status,
    error,
    refresh,
    loadMore,
    hasMore,
    isLoadingMore,
  }
}
