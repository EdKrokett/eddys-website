import type { WordPressComment } from '../types/wordpress'
import { describe, expect, it } from 'vitest'
import { buildCommentThreads } from './comment-threads'

function comment(id: number, parent = 0, authorName = `Autor ${id}`): WordPressComment {
  return {
    id,
    parent,
    authorName,
    date: '2026-01-01T10:00:00',
    paragraphs: [`Text ${id}`],
    isSiteAuthor: false,
  }
}

describe('buildCommentThreads', () => {
  it('hängt eine Antwort unter ihren Elternkommentar', () => {
    const threads = buildCommentThreads([comment(1), comment(2, 1)])

    expect(threads).toHaveLength(1)
    expect(threads[0]!.id).toBe(1)
    expect(threads[0]!.replies.map(r => r.id)).toEqual([2])
  })

  it('verschachtelt über mehrere Ebenen', () => {
    const threads = buildCommentThreads([comment(1), comment(2, 1), comment(3, 2)])

    expect(threads[0]!.replies[0]!.replies[0]!.id).toBe(3)
  })

  it('behält die Eingabereihenfolge bei Wurzeln und Antworten', () => {
    const threads = buildCommentThreads([
      comment(10), comment(11, 10), comment(20), comment(12, 10),
    ])

    expect(threads.map(t => t.id)).toEqual([10, 20])
    expect(threads[0]!.replies.map(r => r.id)).toEqual([11, 12])
  })

  it('macht eine Waise zur Wurzel, statt sie zu verwerfen', () => {
    // parent 999 ist nicht in der Liste — z.B. weil WP-Pagination den Thread zerschnitt
    const threads = buildCommentThreads([comment(1), comment(2, 999)])

    expect(threads.map(t => t.id)).toEqual([1, 2])
  })

  it('verliert keinen einzigen Kommentar (POST: genau einmal im Baum)', () => {
    const input = [comment(1), comment(2, 1), comment(3, 999), comment(4, 2), comment(5)]

    const ids: number[] = []
    const walk = (nodes: ReturnType<typeof buildCommentThreads>) => {
      for (const n of nodes) {
        ids.push(n.id)
        walk(n.replies)
      }
    }
    walk(buildCommentThreads(input))

    expect(ids.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('bricht einen Zyklus auf, statt einen Ring zu bauen', () => {
    // Würde die rekursive Komponente sonst endlos rendern lassen.
    const threads = buildCommentThreads([comment(1, 2), comment(2, 1)])

    const depth = (n: ReturnType<typeof buildCommentThreads>[number], d = 1): number =>
      n.replies.length === 0 ? d : Math.max(...n.replies.map(r => depth(r, d + 1)))

    expect(threads).toHaveLength(1)
    expect(depth(threads[0]!)).toBe(2)
  })

  it('behandelt einen Selbstbezug als Wurzel', () => {
    const threads = buildCommentThreads([comment(7, 7)])

    expect(threads).toHaveLength(1)
    expect(threads[0]!.replies).toEqual([])
  })

  it('gibt bei leerer Eingabe ein leeres Array zurück', () => {
    expect(buildCommentThreads([])).toEqual([])
  })
})
