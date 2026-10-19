/**
 * Typen der Kooperationen-Seite (`app/pages/kooperationen.vue`).
 *
 * Herkunft der Inhalte und die Entscheidungen dahinter: `docs/kooperationen.md`.
 */

/** Eine der drei Bedingungen, unter denen eine Kooperation zustande kommt. */
export interface KooperationKriterium {
  label: string
  detail: string
}

/**
 * Ein gekennzeichneter Beitrag, der aus einer Zusammenarbeit entstanden ist.
 *
 * `slug` ist der WordPress-Slug und zugleich der Pfad unter `/blog/`. Das Bild ist die
 * Original-URL aus der WordPress-Mediathek; `NuxtImg` skaliert es selbst.
 */
export interface KooperationReferenz {
  slug: string
  title: string
  year: number
  excerpt: string
  image: string
}

/** Das Media-Kit als PDF in der WordPress-Mediathek. */
export interface KooperationMediakit {
  url: string
  fileName: string
  pages: number
  sizeKb: number
  /** Stand laut PDF. Beim Austausch des PDFs mitziehen. */
  stand: string
}

/** Ein Vorteil der Buchung über trusted blogs. */
export interface KooperationVorteil {
  title: string
  text: string
}
