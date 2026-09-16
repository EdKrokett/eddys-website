import { describe, expect, it } from 'vitest'
import { parseRevalidateScope, parseWpPostId, parseWpSlug, revalidateSecretMatches } from './revalidate-guard'

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

describe('parseRevalidateScope', () => {
  it('erkennt den Beitrags-Auslöser', () => {
    expect(parseRevalidateScope('post')).toBe('post')
  })

  it('fällt auf \'comment\' zurück, wenn das Feld fehlt', () => {
    // Die erste Plugin-Fassung kannte das Feld nicht. Ohne diesen Rückfall würde ein
    // nicht aktualisiertes WordPress plötzlich Fehler melden.
    expect(parseRevalidateScope(undefined)).toBe('comment')
    expect(parseRevalidateScope(null)).toBe('comment')
  })

  it('fällt bei unbekannten Werten auf \'comment\' zurück, statt zu werfen', () => {
    expect(parseRevalidateScope('alles')).toBe('comment')
    expect(parseRevalidateScope(42)).toBe('comment')
    expect(parseRevalidateScope({ scope: 'post' })).toBe('comment')
  })
})

describe('parseWpSlug', () => {
  it('nimmt einen echten WordPress-Slug an', () => {
    expect(parseWpSlug('projekt-marathon-mit-60-warum-es-in-bremen-der-halbe-wurde'))
      .toBe('projekt-marathon-mit-60-warum-es-in-bremen-der-halbe-wurde')
  })

  it('nimmt Prozent-Kodierung an — Titel mit Umlauten erzeugen sie', () => {
    expect(parseWpSlug('gru%C3%9Fe-aus-bremen')).toBe('gru%C3%9Fe-aus-bremen')
  })

  it('lehnt jeden Versuch ab, die Pfadebene zu verlassen', () => {
    // Der Grund für diesen Validator: Der Wert landet in der URL, die der Server
    // anschließend selbst aufruft.
    expect(parseWpSlug('../../admin')).toBeNull()
    expect(parseWpSlug('beitrag/unterseite')).toBeNull()
    expect(parseWpSlug('beitrag.json')).toBeNull()
  })

  it('lehnt Query, Fragment und Hostwechsel ab', () => {
    expect(parseWpSlug('beitrag?x=1')).toBeNull()
    expect(parseWpSlug('beitrag#top')).toBeNull()
    expect(parseWpSlug('https://fremde-seite.de/x')).toBeNull()
    expect(parseWpSlug('beitrag mit leerzeichen')).toBeNull()
  })

  it('lehnt Leeres und Übergroßes ab', () => {
    expect(parseWpSlug('')).toBeNull()
    expect(parseWpSlug('   ')).toBeNull()
    expect(parseWpSlug('a'.repeat(201))).toBeNull()
    expect(parseWpSlug('a'.repeat(200))).toBe('a'.repeat(200))
  })

  it('lehnt Fremdtypen ab', () => {
    expect(parseWpSlug(undefined)).toBeNull()
    expect(parseWpSlug(null)).toBeNull()
    expect(parseWpSlug(17799)).toBeNull()
  })
})
