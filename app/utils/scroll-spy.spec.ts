import { describe, expect, it } from 'vitest'
import { pickActiveChapter } from './scroll-spy'

const CHAPTERS = ['werdegang', 'kompetenzen', 'datenblatt', 'projekte'] as const

describe('pickActiveChapter', () => {
  it('nimmt die einzige sichtbare Sektion', () => {
    expect(pickActiveChapter(CHAPTERS, ['kompetenzen'], null)).toBe('kompetenzen')
  })

  it('nimmt bei mehreren sichtbaren die erste in Dokumentreihenfolge', () => {
    // Der Observer meldet hier in umgekehrter Reihenfolge — das darf nichts ändern.
    expect(pickActiveChapter(CHAPTERS, ['projekte', 'datenblatt'], null)).toBe('datenblatt')
  })

  it('ignoriert die Reihenfolge der Meldungen vollständig', () => {
    const a = pickActiveChapter(CHAPTERS, ['werdegang', 'kompetenzen'], null)
    const b = pickActiveChapter(CHAPTERS, ['kompetenzen', 'werdegang'], null)
    expect(a).toBe(b)
    expect(a).toBe('werdegang')
  })

  it('hält den vorigen Stand, wenn nichts sichtbar ist', () => {
    // Zwischen zwei Sektionen und im Outro — ohne diese Regel flackert die Leiste.
    expect(pickActiveChapter(CHAPTERS, [], 'projekte')).toBe('projekte')
  })

  it('bleibt null, wenn nichts sichtbar ist und es keinen vorigen Stand gibt', () => {
    // Der Zustand oben auf der Seite: die Leiste soll noch gar nicht erscheinen.
    expect(pickActiveChapter(CHAPTERS, [], null)).toBeNull()
  })

  it('verwirft einen vorigen Stand, den es nicht mehr gibt', () => {
    expect(pickActiveChapter(CHAPTERS, [], 'geloeschtes-kapitel')).toBeNull()
  })

  it('ignoriert gemeldete IDs, die nicht zur Kapitelliste gehören', () => {
    expect(pickActiveChapter(CHAPTERS, ['fremd', 'projekte'], null)).toBe('projekte')
  })

  it('fällt auf den vorigen Stand zurück, wenn nur fremde IDs gemeldet werden', () => {
    expect(pickActiveChapter(CHAPTERS, ['fremd'], 'werdegang')).toBe('werdegang')
  })

  it('nimmt ein Set genauso wie ein Array entgegen', () => {
    expect(pickActiveChapter(CHAPTERS, new Set(['datenblatt']), null)).toBe('datenblatt')
  })

  it('gibt bei leerer Kapitelliste null zurück', () => {
    expect(pickActiveChapter([], ['werdegang'], 'werdegang')).toBeNull()
  })
})
