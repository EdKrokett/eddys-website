import type { WordPressBlogPost } from '#shared/types/wordpress'

/**
 * Filtert Blogposts nach Volltext und Kategorie.
 *
 * Bewusst als reine Funktion neben dem Composable, damit die Filterlogik ohne
 * Nuxt-Runtime testbar bleibt (useBlog.ts nutzt sie in einem computed).
 *
 * PRE:  posts ist ein Array (darf leer sein), query ein String (darf leer sein),
 *       categorySlug ein Slug oder null für "alle Kategorien"
 * POST: Rückgabe enthält nur Posts aus `posts`, die BEIDE Kriterien erfüllen
 * INV:  `posts` wird nicht mutiert
 */
export function filterPosts(
  posts: WordPressBlogPost[],
  query: string,
  categorySlug: string | null,
): WordPressBlogPost[] {
  const needle = query.trim().toLowerCase()

  if (!needle && !categorySlug) return posts

  return posts.filter((post) => {
    if (categorySlug && !post.categories.some(cat => cat.slug === categorySlug)) {
      return false
    }

    if (!needle) return true

    return post.title.toLowerCase().includes(needle)
      || post.excerpt.toLowerCase().includes(needle)
  })
}

/**
 * Kennung des aktiven Filters — Suchbegriff und Kategorie zusammen, weil sie
 * zusammen EINE WordPress-Anfrage bilden. Über diesen Schlüssel erkennt die
 * Anzeige, ob das vorliegende Serverergebnis noch zum aktuellen Filter gehört
 * oder zu einem, den der Besucher schon wieder verlassen hat.
 *
 * PRE:  query ist ein String (darf leer sein), categorySlug ein Slug oder null
 * POST: gleicher Filter ⇒ gleicher Schlüssel, unabhängig von Groß-/Kleinschreibung
 *       und Leerraum im Suchbegriff
 */
export function blogFilterKey(query: string, categorySlug: string | null): string {
  return `${query.trim().toLowerCase()}|${categorySlug ?? ''}`
}

interface VisiblePostsInput {
  /** Die chronologische Liste, so weit sie nachgeladen wurde. */
  basePosts: WordPressBlogPost[]
  /** Was WordPress zuletzt geliefert hat — bereits gefiltert. */
  serverPosts: WordPressBlogPost[]
  /** Suchbegriff, so wie er gerade im Feld steht. */
  query: string
  categorySlug: string | null
  /** Filter, zu dem `serverPosts` gehören — leer, solange nichts geladen ist. */
  resolvedKey: string
}

/**
 * Entscheidet, welche Beiträge die Blogliste zeigt.
 *
 * Der Kern: Sobald das Serverergebnis zum aktuellen Filter vorliegt, wird es
 * unverändert übernommen und NICHT noch einmal clientseitig gefiltert. WordPress
 * durchsucht auch den Volltext — ein Beitrag, der "Nasenspray" nur im Fließtext
 * erwähnt, würde von einem zweiten Filter über Titel und Anriss wieder aussortiert.
 *
 * Solange das Serverergebnis noch aussteht (Debounce, Netzwerk), filtert die Funktion
 * die bereits geladenen Beiträge — der Besucher sieht beim Tippen sofort etwas, statt
 * in ein leeres Raster zu schauen.
 *
 * PRE:  alle Listen sind Arrays (dürfen leer sein), Strings dürfen leer sein
 * POST: Rückgabe enthält nur Elemente aus genau EINER der beiden Eingangslisten
 * INV:  keine Eingangsliste wird mutiert
 */
export function pickVisiblePosts({
  basePosts,
  serverPosts,
  query,
  categorySlug,
  resolvedKey,
}: VisiblePostsInput): WordPressBlogPost[] {
  const needle = query.trim()

  if (!needle && !categorySlug) return basePosts

  if (resolvedKey && blogFilterKey(needle, categorySlug) === resolvedKey) {
    return serverPosts
  }

  return filterPosts(basePosts, needle, categorySlug)
}
