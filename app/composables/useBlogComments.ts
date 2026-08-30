import type { WordPressCommentsResponse } from '#shared/types/wordpress'

const EMPTY: WordPressCommentsResponse = { total: 0, truncated: false, threads: [] }

/**
 * Lädt den Kommentarbaum eines Beitrags (server/api/blog/[slug]/comments.get.ts).
 *
 * Bewusst SSR statt lazy: die 5.190 Kommentare sind über Jahre gewachsener Inhalt mit
 * echtem Suchmaschinen-Wert — client-seitig nachgeladen stünden sie in keinem Index.
 * Die Kosten dafür trägt dank ISR (siehe docs/performance.md, Schicht 4) nur die
 * Regeneration alle 60 Minuten, nicht der einzelne Besucher.
 *
 * Der Baum wird serverseitig gebaut; hier wird nur noch `.value` gelesen — keine
 * Tiefenmutation an einem shallowRef.
 */
export function useBlogComments(slug: string) {
  const { data, status, error } = useFetch<WordPressCommentsResponse>(
    () => `/api/blog/${slug}/comments`,
    {
      key: `blog-comments-${slug}`,
      default: () => EMPTY,
    },
  )

  return {
    threads: computed(() => data.value?.threads ?? []),
    total: computed(() => data.value?.total ?? 0),
    truncated: computed(() => data.value?.truncated ?? false),
    status,
    error,
  }
}
