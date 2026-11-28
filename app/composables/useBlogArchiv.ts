import type { BlogArchivEntry, BlogNachbarn } from '#shared/types/wordpress'

/**
 * Alle Beiträge nach Jahr, dazu die Skala über alle Jahre — für `/blog/archiv`.
 * Konzept: docs/blog-archiv.md.
 */
export async function useBlogArchiv() {
  const { data, status, error } = await useFetch<BlogArchivEntry[]>('/api/blog/archiv', {
    key: 'blog-archiv',
  })

  const entries = computed(() => data.value ?? [])
  const years = computed(() => groupArchivByYear(entries.value))
  const skala = computed(() => archivSkala(years.value))
  const total = computed(() => entries.value.length)

  return { entries, years, skala, total, status, error }
}

/**
 * Nachbarn und verwandte Beiträge für den Weiterlesen-Block. Scheitert die Anfrage,
 * bleibt `nachbarn` null und der Block entfällt — die Beitragsseite selbst hängt nicht
 * davon ab.
 */
export async function useBlogNachbarn(slug: string) {
  const { data, status } = await useFetch<BlogNachbarn>(
    `/api/blog/${encodeURIComponent(slug)}/nachbarn`,
    { key: `blog-nachbarn-${slug}` },
  )

  return { nachbarn: data, status }
}
