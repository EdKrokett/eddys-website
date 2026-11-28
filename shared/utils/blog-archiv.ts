import type { BlogArchivEntry, BlogNachbarn } from '#shared/types/wordpress'
import { BLOG_CATEGORIES } from './blog-categories'
import type { BlogCategory } from './blog-categories'

/**
 * Reine Logik für Archivseite und Weiterlesen-Block. Konzept: docs/blog-archiv.md.
 *
 * Alle Funktionen erwarten die Liste so, wie `parseArchivPosts` sie liefert: geprüft,
 * ohne doppelte Slugs, neueste zuerst.
 */

export interface ArchivJahr {
  year: number
  entries: BlogArchivEntry[]
}

export interface ArchivSkalaStrich {
  year: number
  count: number
  /** 0–1, Anteil am stärksten Jahr. 0 bei einem Jahr ohne Beiträge. */
  ratio: number
}

/** Jahr eines Eintrags; `date` ist durch `parseArchivPosts` garantiert ISO-förmig. */
function yearOf(entry: BlogArchivEntry): number {
  return Number(entry.date.slice(0, 4))
}

/**
 * PRE:  entries neueste zuerst
 * POST: ein Block je Jahr mit mindestens einem Beitrag, Jahre absteigend, Reihenfolge
 *       innerhalb des Jahres unverändert
 */
export function groupArchivByYear(entries: readonly BlogArchivEntry[]): ArchivJahr[] {
  const groups: ArchivJahr[] = []
  for (const entry of entries) {
    const year = yearOf(entry)
    const last = groups.at(-1)
    if (last && last.year === year) last.entries.push(entry)
    else groups.push({ year, entries: [entry] })
  }
  return groups
}

/**
 * Die Skala über dem Archiv: jedes Jahr vom ältesten bis zum neuesten, auch Jahre ohne
 * Beitrag. Eine Lücke soll als Lücke sichtbar sein, sonst lügt die Skala über den Abstand.
 *
 * POST: aufsteigend, lückenlos; leere Eingabe → []
 */
export function archivSkala(groups: readonly ArchivJahr[]): ArchivSkalaStrich[] {
  if (groups.length === 0) return []
  const counts = new Map(groups.map(g => [g.year, g.entries.length]))
  const years = groups.map(g => g.year)
  const min = Math.min(...years)
  const max = Math.max(...years)
  const peak = Math.max(...counts.values())

  const skala: ArchivSkalaStrich[] = []
  for (let year = min; year <= max; year++) {
    const count = counts.get(year) ?? 0
    skala.push({ year, count, ratio: count / peak })
  }
  return skala
}

/**
 * Hauptkategorie eines Beitrags: die erste aus der kuratierten Liste, die er trägt.
 * Reihenfolge der Liste entscheidet, nicht die Reihenfolge in WordPress.
 */
export function hauptKategorie(categoryIds: readonly number[]): BlogCategory | null {
  return BLOG_CATEGORIES.find(cat => categoryIds.includes(cat.id)) ?? null
}

/**
 * PRE:  entries neueste zuerst, Slugs eindeutig
 * POST: newer/older sind die direkten Nachbarn in der Liste; related enthält weder den
 *       Beitrag selbst noch newer/older, höchstens `relatedCount` Einträge derselben
 *       Hauptkategorie, die zeitlich nächsten, neueste zuerst.
 *       Unbekannter Slug → alle Felder leer, `total` stimmt trotzdem.
 */
export function findNachbarn(
  entries: readonly BlogArchivEntry[],
  slug: string,
  relatedCount = 3,
): BlogNachbarn {
  const total = entries.length
  const index = entries.findIndex(entry => entry.slug === slug)
  if (index === -1) {
    return { newer: null, older: null, related: [], category: null, total }
  }

  const newer = entries[index - 1] ?? null
  const older = entries[index + 1] ?? null
  const kategorie = hauptKategorie(entries[index]!.categoryIds)
  if (!kategorie) {
    return { newer, older, related: [], category: null, total }
  }

  const related = entries
    .map((entry, i) => ({ entry, distance: Math.abs(i - index) }))
    // Abstand 0 ist der Beitrag selbst, 1 sind die beiden Nachbarn, die schon verlinkt sind.
    .filter(({ entry, distance }) => distance > 1 && entry.categoryIds.includes(kategorie.id))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(relatedCount, 0))
    .sort((a, b) => (a.entry.date < b.entry.date ? 1 : -1))
    .map(({ entry }) => entry)

  return {
    newer,
    older,
    related,
    category: { slug: kategorie.slug, label: kategorie.label },
    total,
  }
}
