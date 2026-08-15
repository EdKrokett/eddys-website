export interface WordPressTag {
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
}

export interface WordPressBlogPostDetail extends WordPressBlogPost {
  content: string
}
