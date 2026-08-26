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
