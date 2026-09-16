import { describe, expect, it } from 'vitest'
import { parseWpPostId, revalidateSecretMatches } from './revalidate-guard'

describe('revalidateSecretMatches', () => {
  it('erkennt das richtige Secret', () => {
    expect(revalidateSecretMatches('s3cret-value', 's3cret-value')).toBe(true)
  })

  it('weist ein falsches Secret gleicher Länge ab', () => {
    expect(revalidateSecretMatches('s3cret-valuf', 's3cret-value')).toBe(false)
  })

  it('weist ein falsches Secret anderer Länge ab, statt zu werfen', () => {
    // Regression: timingSafeEqual wirft bei ungleich langen Buffern. Ein Wurf hier
    // wäre eine 500 statt einer 401 — und würde die Secret-Länge verraten.
    expect(() => revalidateSecretMatches('kurz', 's3cret-value')).not.toThrow()
    expect(revalidateSecretMatches('kurz', 's3cret-value')).toBe(false)
  })

  it('lehnt ab, wenn das erwartete Secret fehlt oder leer ist', () => {
    // Die wichtigste Zeile der Datei: eine vergessene Env-Variable darf den
    // Endpunkt nicht für jeden öffnen.
    expect(revalidateSecretMatches('irgendwas', '')).toBe(false)
    expect(revalidateSecretMatches('irgendwas', undefined)).toBe(false)
    expect(revalidateSecretMatches('', '')).toBe(false)
  })

  it('lehnt ab, wenn der Anfragende kein Secret mitschickt', () => {
    expect(revalidateSecretMatches(undefined, 's3cret-value')).toBe(false)
    expect(revalidateSecretMatches('', 's3cret-value')).toBe(false)
    expect(revalidateSecretMatches(null, 's3cret-value')).toBe(false)
  })

  it('unterscheidet Groß- und Kleinschreibung', () => {
    expect(revalidateSecretMatches('SECRET', 'secret')).toBe(false)
  })
})

describe('parseWpPostId', () => {
  it('nimmt eine Zahl an', () => {
    expect(parseWpPostId(17799)).toBe(17799)
  })

  it('nimmt einen Ziffern-String an — WordPress schickt Formularwerte als Text', () => {
    expect(parseWpPostId('17799')).toBe(17799)
    expect(parseWpPostId(' 17799 ')).toBe(17799)
  })

  it('lehnt Werte ab, die Number() still umdeuten würde', () => {
    // Genau diese drei sind der Grund für den Regex statt eines blanken Number().
    expect(parseWpPostId('1e3')).toBeNull()
    expect(parseWpPostId('0x10')).toBeNull()
    expect(parseWpPostId('')).toBeNull()
  })

  it('lehnt alles ab, was keine positive Ganzzahl ist', () => {
    expect(parseWpPostId(0)).toBeNull()
    expect(parseWpPostId(-5)).toBeNull()
    expect(parseWpPostId(17.5)).toBeNull()
    expect(parseWpPostId(Number.NaN)).toBeNull()
    expect(parseWpPostId(Number.MAX_SAFE_INTEGER + 2)).toBeNull()
  })

  it('lehnt Fremdtypen ab', () => {
    expect(parseWpPostId(undefined)).toBeNull()
    expect(parseWpPostId(null)).toBeNull()
    expect(parseWpPostId({ id: 1 })).toBeNull()
    expect(parseWpPostId(['1'])).toBeNull()
  })

  it('lehnt einen Slug ab, der als ID durchrutschen wollte', () => {
    // Der Angriffspfad, den die ID-statt-Slug-Entscheidung schließt: Ein Fremdstring
    // darf nie in die URL wandern, die der Server anschließend selbst aufruft.
    expect(parseWpPostId('../../etc/passwd')).toBeNull()
    expect(parseWpPostId('17799/../admin')).toBeNull()
  })
})
