import type { BlogArchivEntry } from '#shared/types/wordpress'
import { decodeHtmlEntities } from '#shared/utils/html-entities'
import { decodeSlug } from './sitemap-posts'

/** Genau die Felder, die `parseArchivPosts` liest. */
const ARCHIV_FIELDS = 'slug,title,date,categories'

/** WordPress-Ortszeit ohne Zone, wie `date` sie liefert. */
const WP_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/

/**
 * Prüft die rohe WordPress-Liste und macht daraus das Archiv. Konzept: docs/blog-archiv.md.
 *
 * EXTERN: alles. Ohne brauchbaren Slug oder ohne gültiges Datum kein Eintrag, denn ohne
 * Datum lässt sich ein Beitrag weder einem Jahr noch einem Nachbarn zuordnen. Ein leerer
 * Titel dagegen kostet nur die Beschriftung, nicht den Link.
 *
 * PRE:  beliebiger Wert
 * POST: Slugs eindeutig (dekodiert, wie der Router sie liefert), neueste zuerst;
 *       kein Array → []
 */
export function parseArchivPosts(raw: unknown): BlogArchivEntry[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const entries: BlogArchivEntry[] = []

  for (const post of raw as Array<Record<string, unknown> | null>) {
    if (!post || typeof post !== 'object') continue

    const slug = decodeSlug(post.slug)
    if (!slug || seen.has(slug)) continue

    const date = typeof post.date === 'string' ? post.date : ''
    if (!WP_DATE.test(date) || Number.isNaN(Date.parse(`${date}Z`))) continue

    seen.add(slug)
    entries.push({
      slug,
      title: parseTitle(post.title) || 'Ohne Titel',
      date,
      categoryIds: Array.isArray(post.categories)
        ? post.categories.filter((id): id is number => Number.isInteger(id))
        : [],
    })
  }

  // ISO-Zeichenketten gleicher Form sortieren lexikalisch richtig.
  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** `title.rendered` ist HTML: Tags weg, Entities dekodieren, denn die Seite rendert per v-text. */
function parseTitle(raw: unknown): string {
  const rendered = (raw as { rendered?: unknown } | null)?.rendered
  if (typeof rendered !== 'string') return ''
  return decodeHtmlEntities(rendered.replace(/<[^>]*>/g, '')).trim()
}

/** Alle Beiträge fürs Archiv, aus dem gemeinsamen Cache (Typ `archiv`, 30 min). */
export async function fetchBlogArchiv(): Promise<BlogArchivEntry[]> {
  return withWpCache('all', 'archiv', async () => parseArchivPosts(await fetchAllWpPosts(ARCHIV_FIELDS)))
}
