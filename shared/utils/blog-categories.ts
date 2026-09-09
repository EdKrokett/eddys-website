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
 * fünf Kategorien, keine davon verschachtelt (geprüft 09.09.2026).
 *
 * `werbung` (ID 223) gehört nicht in die Leiste: gekennzeichnete Kooperationen sind
 * keine Rubrik, nach der jemand filtern will. Die Liste ist kuratiert, nicht
 * vollständig — wer eine Kategorie ergänzt, ergänzt sie HIER, sonst bleibt sie auf
 * `/blog` unsichtbar, auch wenn WordPress sie längst kennt.
 */
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  { slug: 'laufen', label: 'Laufen', id: 1 },
  { slug: 'wandern', label: 'Wandern', id: 153 },
  { slug: 'reisen', label: 'Reisen', id: 224 },
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
