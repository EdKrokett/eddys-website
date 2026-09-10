import { describe, expect, it } from 'vitest'
import { BLOG_CATEGORIES, blogCategoryId } from './blog-categories'

describe('blogCategoryId', () => {
  it('löst jeden Slug der Filterleiste auf', () => {
    for (const cat of BLOG_CATEGORIES) {
      expect(blogCategoryId(cat.slug)).toBe(cat.id)
    }
  })

  it('trifft die WordPress-IDs des Blogs', () => {
    expect(blogCategoryId('laufen')).toBe(1)
    expect(blogCategoryId('reisen')).toBe(224)
    expect(blogCategoryId('bloggen')).toBe(94)
  })

  it('gibt für einen unbekannten Slug null zurück, statt fremd zu filtern', () => {
    expect(blogCategoryId('radfahren')).toBeNull()
  })

  // `werbung` existiert in WordPress (ID 223), steht aber bewusst nicht in der
  // Filterleiste. Der Test hält fest, dass das Absicht ist und kein vergessener
  // Eintrag: ein späterer Slug-Tippfehler fiele sonst nicht auf.
  it('filtert nicht nach der ausgelassenen Kategorie werbung', () => {
    expect(blogCategoryId('werbung')).toBeNull()
  })

  // `wandern` wurde am 10.09.2026 in WordPress gelöscht, die Beiträge liegen unter
  // `reisen`. Ein Chip dafür führte auf ein 404-Archiv.
  it('kennt die geloeschte Kategorie wandern nicht mehr', () => {
    expect(blogCategoryId('wandern')).toBeNull()
    expect(BLOG_CATEGORIES.some(cat => cat.slug === 'wandern')).toBe(false)
  })

  it('behandelt leere und fehlende Werte als "keine Kategorie"', () => {
    expect(blogCategoryId('')).toBeNull()
    expect(blogCategoryId(null)).toBeNull()
    expect(blogCategoryId(undefined)).toBeNull()
  })
})
