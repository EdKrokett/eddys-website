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
