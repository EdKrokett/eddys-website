export interface BlogCategory {
  slug: string
  label: string
  /** WordPress-Term-ID — der `/wp/v2/posts`-Endpunkt filtert nur über IDs, nicht
   *  über Slugs. */
  id: number
}

/**
 * Blog-Kategorien für die Filterleiste — Reihenfolge bewusst, nicht alphabetisch.
 *
 * Liegt in `shared/`, weil beide Seiten sie brauchen: die Seite für Beschriftung und
 * Reihenfolge der Chips, die Server-Route für die WordPress-Anfrage.
 *
 * Die IDs stehen hier fest, statt sie über `/wp/v2/categories?slug=…` aufzulösen.
 * Das spart pro Filterklick einen WordPress-Roundtrip und macht den Fehlerfall
 * eindeutig: Eine unbekannte Kategorie ist ein Tippfehler in der URL, kein halb
 * geladener Zustand. WordPress-Term-IDs ändern sich nicht — der Blog hat insgesamt
 * vier Kategorien, keine davon verschachtelt (geprüft 30.08.2026).
 */
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  { slug: 'laufen', label: 'Laufen', id: 1 },
  { slug: 'wandern', label: 'Wandern', id: 153 },
  { slug: 'bloggen', label: 'Bloggen', id: 94 },
] as const

/**
 * Übersetzt einen Kategorie-Slug in die WordPress-Term-ID.
 *
 * PRE:  slug ist ein beliebiger String (darf leer sein) oder null
 * POST: ID einer bekannten Kategorie, sonst null — ein unbekannter Slug filtert
 *       damit gar nicht, statt versehentlich eine fremde Kategorie zu treffen
 */
export function blogCategoryId(slug: string | null | undefined): number | null {
  if (!slug) return null
  return BLOG_CATEGORIES.find(cat => cat.slug === slug)?.id ?? null
}
