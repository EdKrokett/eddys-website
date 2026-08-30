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

  /* ── Archiv-Filter ────────────────────────────────────────────────────────
   * Die Liste oben hält nur, was nachgeladen wurde. Ein Filter darüber beurteilt
   * also bloß einen Ausschnitt und meldet für den Rest "keine Treffer" — deshalb
   * fragen Suche UND Kategorie WordPress selbst, das alle ~240 Beiträge kennt und
   * beim Suchbegriff zusätzlich den Volltext durchsucht.
   *
   * Beide teilen sich bewusst EINEN Mechanismus: Sie sind zusammen eine einzige
   * WordPress-Anfrage, sonst müsste eine der beiden Dimensionen wieder clientseitig
   * nachfiltern — und genau das war der Fehler.
   *
   * Bewusst nur im Client: `/blog` liegt per ISR am Edge, und alle Query-Varianten
   * teilen sich dort einen Cache-Eintrag (siehe docs/performance.md, Schicht 4).
   * Serverseitig gefilterte Ergebnisse würden dem nächsten Besucher ausgeliefert.
   */
  const serverPosts = ref<WordPressBlogPost[]>([])
  /** Filter, zu dem `serverPosts` gehören. Leer = es liegt noch nichts vor. */
  const resolvedKey = ref('')
  const isFiltering = ref(false)
  const filterPage = ref(1)
  const filterReachedEnd = ref(false)

  /** Zählt jede ausgelöste Abfrage; nur die jüngste darf ihr Ergebnis übernehmen.
   *  Ohne das überschreibt eine langsame frühere Anfrage eine schnellere spätere. */
  let filterRun = 0
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  /** Merkt den zuletzt abgeschickten Suchbegriff, um einen reinen Kategorie-Klick
   *  ohne Tipp-Verzögerung durchzulassen. */
  let lastNeedle = ''

  const isFiltered = computed(() =>
    searchQuery.value.trim().length > 0 || activeCategory.value !== null,
  )

  function fetchFiltered(needle: string, category: string | null, page: number) {
    return $fetch<WordPressBlogPost[]>('/api/blog', {
      query: { limit, page, search: needle, category: category ?? '' },
    })
  }

  function resetFilterState() {
    // Laufende Anfragen entwerten, sonst überschreiben sie später den
    // zurückgesetzten Zustand.
    filterRun++
    serverPosts.value = []
    resolvedKey.value = ''
    isFiltering.value = false
    filterReachedEnd.value = false
    filterPage.value = 1
  }

  async function runFilter(needle: string, category: string | null) {
    const run = ++filterRun
    isFiltering.value = true

    try {
      const results = await fetchFiltered(needle, category, 1)
      if (run !== filterRun) return

      serverPosts.value = results
      resolvedKey.value = blogFilterKey(needle, category)
      filterPage.value = 1
      filterReachedEnd.value = results.length < limit
    } catch {
      if (run !== filterRun) return
      // Kein Ergebnis übernehmen: `resolvedKey` bleibt alt, damit weiter der
      // clientseitige Filter über die geladenen Beiträge greift statt einer
      // fälschlich leeren Trefferliste.
      filterReachedEnd.value = true
    } finally {
      if (run === filterRun) isFiltering.value = false
    }
  }

  /** 300 ms: kurz genug, dass es sofort wirkt, lang genug, dass ein getipptes Wort
   *  nicht als sechs Anfragen an WordPress geht. */
  const SEARCH_DEBOUNCE_MS = 300

  watch([searchQuery, activeCategory], ([value, category]) => {
    if (import.meta.server) return

    clearTimeout(debounceTimer)
    const needle = value.trim()

    if (!needle && !category) {
      lastNeedle = ''
      resetFilterState()
      return
    }

    // Ein Klick auf einen Kategorie-Chip soll nicht warten — entprellt wird nur
    // das Tippen im Suchfeld.
    const delay = needle === lastNeedle ? 0 : SEARCH_DEBOUNCE_MS
    lastNeedle = needle
    debounceTimer = setTimeout(() => void runFilter(needle, category), delay)
  })

  onScopeDispose(() => clearTimeout(debounceTimer))

  async function loadMoreFiltered() {
    if (!resolvedKey.value || isFiltering.value) return

    const needle = searchQuery.value.trim()
    const category = activeCategory.value
    // Nur weiterblättern, wenn das vorliegende Ergebnis zum aktuellen Filter gehört.
    if (blogFilterKey(needle, category) !== resolvedKey.value) return

    isFiltering.value = true
    const run = ++filterRun

    try {
      const next = await fetchFiltered(needle, category, filterPage.value + 1)
      if (run !== filterRun) return

      if (next.length === 0) {
        filterReachedEnd.value = true
        return
      }

      filterPage.value += 1
      serverPosts.value = [...serverPosts.value, ...next]
      if (next.length < limit) filterReachedEnd.value = true
    } catch {
      if (run !== filterRun) return
      filterReachedEnd.value = true
    } finally {
      if (run === filterRun) isFiltering.value = false
    }
  }

  const filteredPosts = computed(() =>
    pickVisiblePosts({
      basePosts: allPosts.value,
      serverPosts: serverPosts.value,
      query: searchQuery.value,
      categorySlug: activeCategory.value,
      resolvedKey: resolvedKey.value,
    }),
  )

  /** True, sobald die angezeigte Liste vom Server kommt und damit das ganze
   *  Archiv abdeckt — die Seite formuliert danach ihre Zähl- und Leertexte. */
  const hasArchiveResults = computed(() =>
    isFiltered.value
    && resolvedKey.value !== ''
    && blogFilterKey(searchQuery.value, activeCategory.value) === resolvedKey.value,
  )

  /** Im Filtermodus lädt "Mehr laden" weitere Treffer, sonst ältere Beiträge. */
  const canLoadMore = computed(() => {
    if (!isFiltered.value) return hasMore.value
    return hasArchiveResults.value
      && !filterReachedEnd.value
      && serverPosts.value.length >= limit
  })

  function loadMoreVisible() {
    return isFiltered.value ? loadMoreFiltered() : loadMore()
  }

  return {
    posts: allPosts,
    filteredPosts,
    searchQuery,
    activeCategory,
    isFiltered,
    isFiltering,
    hasArchiveResults,
    hasSearchTerm: computed(() => searchQuery.value.trim().length > 0),
    status,
    error,
    refresh,
    loadMore: loadMoreVisible,
    hasMore: canLoadMore,
    isLoadingMore: computed(() => (isFiltered.value ? isFiltering.value : isLoadingMore.value)),
  }
}
