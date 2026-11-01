import { describe, expect, it } from 'vitest'
import { heroBildFormat, parseImageSize } from './hero-bild'

describe('parseImageSize', () => {
  it('übernimmt gültige Abmessungen', () => {
    expect(parseImageSize({ width: 1693, height: 2000, file: '2026/11/x.jpg' })).toEqual({ width: 1693, height: 2000 })
  })

  it('gibt undefined für fehlende, kaputte und Null-Werte zurück', () => {
    expect(parseImageSize(undefined)).toBeUndefined()
    expect(parseImageSize(null)).toBeUndefined()
    expect(parseImageSize({})).toBeUndefined()
    expect(parseImageSize({ width: '1693', height: 2000 })).toBeUndefined()
    expect(parseImageSize({ width: 0, height: 2000 })).toBeUndefined()
    expect(parseImageSize({ width: 1693.5, height: 2000 })).toBeUndefined()
  })
})

describe('heroBildFormat', () => {
  it('zeigt das Hochformat vom Halloween-Beitrag ganz', () => {
    expect(heroBildFormat({ width: 1693, height: 2000 })).toBe('ganz')
  })

  it('zeigt 3:2, 4:3 und Quadrat ganz, weil sie in voller Breite zu hoch würden', () => {
    expect(heroBildFormat({ width: 1500, height: 1000 })).toBe('ganz')
    expect(heroBildFormat({ width: 2000, height: 1500 })).toBe('ganz')
    expect(heroBildFormat({ width: 1200, height: 1200 })).toBe('ganz')
  })

  it('zeigt das gestaltete 16:9-Titelbild und breitere als Banner', () => {
    // Eddys Titelbild vom 01.11.2026, Schrift reicht bis an den oberen und unteren Rand
    expect(heroBildFormat({ width: 1672, height: 941 })).toBe('banner')
    expect(heroBildFormat({ width: 2400, height: 1000 })).toBe('banner')
  })

  it('bleibt ohne Abmessungen beim Banner', () => {
    expect(heroBildFormat(undefined)).toBe('banner')
  })
})
