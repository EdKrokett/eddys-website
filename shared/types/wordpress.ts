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
  /** Gesamtzahl laut WP (`X-WP-Total`) — kann grösser sein als die gelieferten Knoten. */
  total: number
  /** true, wenn WordPress mehr Kommentare hat, als eine Anfrage liefern kann (100). */
  truncated: boolean
  threads: WordPressCommentNode[]
}
