import type { WordPressBlogPost } from '#shared/types/wordpress'
import { describe, expect, it } from 'vitest'
import { blogFilterKey, filterPosts, pickVisiblePosts } from './filter-posts'

function makePost(overrides: Partial<WordPressBlogPost> = {}): WordPressBlogPost {
  return {
    id: 1,
    slug: 'ein-post',
    title: 'Spontaner Halbmarathon',
    excerpt: 'Ein Bericht über den Lauf',
    date: '2026-05-01T10:00:00',
    tags: [],
    categories: [{ id: 1, name: 'Laufen', slug: 'laufen' }],
    ...overrides,
  }
}

const laufPost = makePost({ id: 1, title: 'Spontaner Halbmarathon', excerpt: 'Bericht vom Lauf' })
const wanderPost = makePost({
  id: 2,
  title: '10 Tage Mallorca',
  excerpt: 'Wandern und Radeln',
  categories: [{ id: 153, name: 'Wandern', slug: 'wandern' }],
})
const blogPost = makePost({
  id: 3,
  title: 'Bleib im Regiestuhl',
  excerpt: 'Bloggen beginnt im Kopf',
  categories: [{ id: 94, name: 'Bloggen', slug: 'bloggen' }],
})
const allPosts = [laufPost, wanderPost, blogPost]

describe('filterPosts', () => {
  it('gibt ohne Filter alle Posts unverändert zurück', () => {
    expect(filterPosts(allPosts, '', null)).toEqual(allPosts)
  })

  it('filtert nach Kategorie-Slug', () => {
    expect(filterPosts(allPosts, '', 'wandern')).toEqual([wanderPost])
  })

  it('findet über den Titel', () => {
    expect(filterPosts(allPosts, 'Mallorca', null)).toEqual([wanderPost])
  })

  it('findet über den Excerpt', () => {
    expect(filterPosts(allPosts, 'Regiestuhl', null)).toEqual([blogPost])
  })

  it('sucht unabhängig von Groß-/Kleinschreibung', () => {
    expect(filterPosts(allPosts, 'HALBMARATHON', null)).toEqual([laufPost])
  })

  it('kombiniert Suche und Kategorie (UND, nicht ODER)', () => {
    expect(filterPosts(allPosts, 'Mallorca', 'laufen')).toEqual([])
    expect(filterPosts(allPosts, 'Mallorca', 'wandern')).toEqual([wanderPost])
  })

  it('ignoriert reine Leerzeichen als Suchbegriff', () => {
    expect(filterPosts(allPosts, '   ', null)).toEqual(allPosts)
  })

  // Edge Cases
  it('gibt bei leerer Eingabeliste eine leere Liste zurück', () => {
    expect(filterPosts([], 'egal', 'laufen')).toEqual([])
  })

  it('gibt bei unbekannter Kategorie eine leere Liste zurück, nicht alles', () => {
    expect(filterPosts(allPosts, '', 'gibt-es-nicht')).toEqual([])
  })

  it('gibt ohne Treffer eine leere Liste zurück', () => {
    expect(filterPosts(allPosts, 'Quantenphysik', null)).toEqual([])
  })

  it('verkraftet Posts ohne Kategorien, ohne zu werfen', () => {
    const ohneKategorie = makePost({ id: 4, categories: [] })
    expect(filterPosts([ohneKategorie], '', 'laufen')).toEqual([])
    expect(filterPosts([ohneKategorie], '', null)).toEqual([ohneKategorie])
  })

  it('verkraftet leere Titel und Excerpts, ohne zu werfen', () => {
    const leer = makePost({ id: 5, title: '', excerpt: '' })
    expect(filterPosts([leer], 'suche', null)).toEqual([])
    expect(filterPosts([leer], '', null)).toEqual([leer])
  })

  it('lässt die Eingabeliste unverändert (Invariante)', () => {
    const input = [...allPosts]
    filterPosts(input, 'Mallorca', 'wandern')
    expect(input).toEqual(allPosts)
    expect(input).toHaveLength(3)
  })
})

describe('blogFilterKey', () => {
  it('ignoriert Groß-/Kleinschreibung und Leerraum', () => {
    expect(blogFilterKey('  Nasenspray ', null)).toBe(blogFilterKey('nasenspray', null))
  })

  it('unterscheidet gleichen Begriff in verschiedenen Kategorien', () => {
    expect(blogFilterKey('lauf', 'laufen')).not.toBe(blogFilterKey('lauf', 'wandern'))
  })

  it('unterscheidet "keine Kategorie" von einer gesetzten', () => {
    expect(blogFilterKey('lauf', null)).not.toBe(blogFilterKey('lauf', 'laufen'))
  })
})

describe('pickVisiblePosts', () => {
  /** Ein alter Beitrag, den WordPress nur über den Volltext findet: Weder Titel
   *  noch Anriss enthalten das gesuchte Wort. Genau der Fall, an dem die rein
   *  clientseitige Suche scheiterte. */
  const archivPost = makePost({
    id: 99,
    slug: 'nasenspray-sucht-bericht-eins-junkies',
    title: 'Bericht eines Junkies',
    excerpt: 'Wie alles anfing',
  })

  const base = {
    basePosts: allPosts,
    serverPosts: [],
    query: '',
    categorySlug: null,
    resolvedKey: '',
  }

  it('zeigt ohne Filter die geladene Liste', () => {
    expect(pickVisiblePosts(base)).toEqual(allPosts)
  })

  it('übernimmt das Serverergebnis ungefiltert, auch ohne Treffer in Titel oder Anriss', () => {
    expect(pickVisiblePosts({
      ...base,
      serverPosts: [archivPost],
      query: 'nasenspray',
      resolvedKey: blogFilterKey('nasenspray', null),
    })).toEqual([archivPost])
  })

  it('ignoriert Groß-/Kleinschreibung und Leerraum beim Abgleich', () => {
    expect(pickVisiblePosts({
      ...base,
      serverPosts: [archivPost],
      query: '  Nasenspray ',
      resolvedKey: blogFilterKey('nasenspray', null),
    })).toEqual([archivPost])
  })

  it('filtert ein Serverergebnis zur Kategorie nicht noch einmal nach', () => {
    // Der Server hat bereits nach Kategorie gefiltert; ein zweiter Durchlauf über die
    // eingebetteten Kategorien würde bei fehlendem `_embedded` alles verwerfen.
    const ohneKategorien = makePost({ id: 77, title: 'Alter Wanderbericht', categories: [] })
    expect(pickVisiblePosts({
      ...base,
      serverPosts: [ohneKategorien],
      categorySlug: 'wandern',
      resolvedKey: blogFilterKey('', 'wandern'),
    })).toEqual([ohneKategorien])
  })

  it('filtert während des Tippens die geladenen Beiträge, solange das Ergebnis fehlt', () => {
    expect(pickVisiblePosts({ ...base, query: 'mallorca' })).toEqual([wanderPost])
  })

  it('filtert die geladenen Beiträge, solange das Kategorie-Ergebnis fehlt', () => {
    expect(pickVisiblePosts({ ...base, categorySlug: 'wandern' })).toEqual([wanderPost])
  })

  it('nutzt die geladenen Beiträge, wenn das Ergebnis zu einem älteren Filter gehört', () => {
    expect(pickVisiblePosts({
      ...base,
      serverPosts: [archivPost],
      query: 'mallorca',
      resolvedKey: blogFilterKey('nasenspray', null),
    })).toEqual([wanderPost])
  })

  it('verwirft das Ergebnis, wenn nur die Kategorie gewechselt hat', () => {
    expect(pickVisiblePosts({
      ...base,
      serverPosts: [archivPost],
      query: 'mallorca',
      categorySlug: 'wandern',
      resolvedKey: blogFilterKey('mallorca', null),
    })).toEqual([wanderPost])
  })

  it('liefert eine leere Liste, wenn der Server nichts gefunden hat', () => {
    expect(pickVisiblePosts({
      ...base,
      serverPosts: [],
      query: 'quantenphysik',
      resolvedKey: blogFilterKey('quantenphysik', null),
    })).toEqual([])
  })
})
