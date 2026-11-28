export interface WordPressTag {
  id: number
  name: string
  slug: string
}

/** Kategorien des Blogs: laufen, wandern, bloggen, werbung (Stand 26.08.2026). */
export interface WordPressCategory {
  id: number
  name: string
  slug: string
}

export interface WordPressBlogPost {
  id: number
  slug: string
  title: string
  excerpt: string
  date: string
  featuredImage?: string
  tags: WordPressTag[]
  categories: WordPressCategory[]
}

export interface WordPressBlogPostDetail extends WordPressBlogPost {
  content: string
  /**
   * Abmessungen des Beitragsbilds in Pixeln, sofern WordPress sie liefert. Davon hängt ab,
   * ob die Beitragsseite das Bild als Banner zuschneidet oder ganz zeigt (heroBildFormat).
   */
  featuredImageSize?: { width: number, height: number }
}

/**
 * Ein Kommentar, wie ihn `server/api/blog/[slug]/comments.get.ts` ausliefert.
 *
 * `paragraphs` statt `content`: Kommentare stammen von fremden Besuchern und werden
 * deshalb serverseitig zu reinem Text abgebaut, nie per `v-html` gerendert
 * (Begründung und Messung: docs/blog-kommentare.md).
 */
export interface WordPressComment {
  id: number
  /** id des Elternkommentars, 0 bei einem Wurzelkommentar. */
  parent: number
  authorName: string
  /** Vom Kommentator selbst angegeben — nur http(s), sonst weggelassen. */
  authorUrl?: string
  date: string
  paragraphs: string[]
  /**
   * Nachweislich der eingeloggte Seiten-Benutzer (WP `author !== 0`). Bewusst NICHT
   * über den Anzeigenamen geraten: Eddy hat 28x als Gast mit demselben Namen
   * kommentiert, und jeder Fremde könnte diesen Namen eintippen.
   */
  isSiteAuthor: boolean
}

/** Kommentar mit seinen Antworten — Ergebnis von `buildCommentThreads`. */
export interface WordPressCommentNode extends WordPressComment {
  replies: WordPressCommentNode[]
}

/** Antwort der Kommentar-Route: Baum plus Zähler für die Überschrift. */
export interface WordPressCommentsResponse {
  /** Zahl der gelieferten Kommentare mit Textinhalt. */
  total: number
  /** true, wenn WordPress mehr Kommentare hat, als die Route nachlädt (500). */
  truncated: boolean
  threads: WordPressCommentNode[]
}

/**
 * Ein Beitrag im Archiv (`/blog/archiv`) und im Weiterlesen-Block. Bewusst schlank: Die
 * Liste umfasst alle ~250 Beiträge und landet vollständig in der Seiten-Payload.
 * Konzept: docs/blog-archiv.md.
 */
export interface BlogArchivEntry {
  /** Dekodiert, wie ihn der Router als `route.params.slug` liefert. */
  slug: string
  title: string
  /** WordPress-Ortszeit ohne Zone, `2011-02-27T10:13:19`. */
  date: string
  categoryIds: number[]
}

/** Antwort von `/api/blog/<slug>/nachbarn`. */
export interface BlogNachbarn {
  /** Der nächstjüngere Beitrag, `null` beim neuesten. */
  newer: BlogArchivEntry | null
  /** Der nächstältere Beitrag, `null` beim ältesten. */
  older: BlogArchivEntry | null
  /** Bis zu drei Beiträge derselben Hauptkategorie, neueste zuerst. */
  related: BlogArchivEntry[]
  /** Hauptkategorie, aus der `related` stammt. */
  category: { slug: string, label: string } | null
  /** Anzahl aller Beiträge im Archiv. */
  total: number
}
