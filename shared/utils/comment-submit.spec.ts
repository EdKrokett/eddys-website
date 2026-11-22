import { describe, expect, it } from 'vitest'
import {
  buildCommentPayload,
  COMMENT_LIMITS,
  commentErrorMessage,
  draftToParagraphs,
  encodeAstralAsEntities,
  normalizeCommentUrl,
  parseCommentReceipt,
  readCommentFailure,
  validateCommentDraft,
} from './comment-submit'

const VALID = {
  name: 'Martina',
  email: 'martina@example.org',
  url: '',
  content: 'Schöner Bericht!',
}

describe('encodeAstralAsEntities', () => {
  it('kodiert ein Emoji als hexadezimale Entity', () => {
    // Genau die Form, die am 12.11.2026 von WordPress angenommen wurde.
    expect(encodeAstralAsEntities('Stark 😄')).toBe('Stark &#x1f604;')
  })

  it('lässt Umlaute, typografische Zeichen und das Eurozeichen unverändert', () => {
    expect(encodeAstralAsEntities('Grüße „aus“ Bremen – 5 €')).toBe('Grüße „aus“ Bremen – 5 €')
  })

  it('kodiert jeden Codepunkt einer zusammengesetzten Emoji-Folge einzeln', () => {
    // 👍🏽 = U+1F44D + U+1F3FD (Hautton)
    expect(encodeAstralAsEntities('👍🏽')).toBe('&#x1f44d;&#x1f3fd;')
  })

  it('hinterlässt keinen Codepunkt über U+FFFF', () => {
    const result = encodeAstralAsEntities('a🏃b🎉c')
    expect([...result].every(char => (char.codePointAt(0) ?? 0) <= 0xFFFF)).toBe(true)
  })

  it('gibt für undefined, null und leeren String einen leeren String zurück', () => {
    expect(encodeAstralAsEntities(undefined)).toBe('')
    expect(encodeAstralAsEntities(null)).toBe('')
    expect(encodeAstralAsEntities('')).toBe('')
  })
})

describe('normalizeCommentUrl', () => {
  it('ergänzt https://, wenn das Schema fehlt', () => {
    expect(normalizeCommentUrl('laufblog.example')).toBe('https://laufblog.example/')
  })

  it('behält ein vorhandenes http-Schema', () => {
    expect(normalizeCommentUrl('http://laufblog.example/ueber')).toBe('http://laufblog.example/ueber')
  })

  it('gibt für eine leere Eingabe einen leeren String zurück, nicht null', () => {
    expect(normalizeCommentUrl('')).toBe('')
    expect(normalizeCommentUrl('   ')).toBe('')
    expect(normalizeCommentUrl(undefined)).toBe('')
  })

  it('lehnt javascript: und data: ab', () => {
    expect(normalizeCommentUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeCommentUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('lehnt Eingaben ohne Punkt im Host und mit Leerzeichen ab', () => {
    expect(normalizeCommentUrl('keineadresse')).toBeNull()
    expect(normalizeCommentUrl('mein blog.example')).toBeNull()
  })
})

describe('validateCommentDraft', () => {
  it('meldet für einen vollständigen Entwurf keinen Fehler', () => {
    expect(validateCommentDraft(VALID)).toEqual({})
  })

  it('meldet die leeren Pflichtfelder Kommentar und Name, nicht E-Mail und Website', () => {
    expect(validateCommentDraft({ name: '', email: '', url: '', content: '' })).toEqual({
      content: 'Der Kommentar ist noch leer.',
      name: 'Bitte einen Namen angeben.',
    })
  })

  it('lässt einen Kommentar ohne E-Mail-Adresse durch', () => {
    expect(validateCommentDraft({ ...VALID, email: '' })).toEqual({})
    expect(validateCommentDraft({ ...VALID, email: '   ' })).toEqual({})
  })

  it('wertet reinen Leerraum als leer', () => {
    const errors = validateCommentDraft({ ...VALID, name: '  ', content: '\n \n' })
    expect(errors.name).toBe('Bitte einen Namen angeben.')
    expect(errors.content).toBe('Der Kommentar ist noch leer.')
  })

  it('lehnt eine E-Mail-Adresse ohne Domain ab', () => {
    expect(validateCommentDraft({ ...VALID, email: 'martina@' }).email)
      .toBe('Diese E-Mail-Adresse sieht nicht gültig aus.')
    expect(validateCommentDraft({ ...VALID, email: 'martina example.org' }).email)
      .toBe('Diese E-Mail-Adresse sieht nicht gültig aus.')
  })

  it('lehnt eine Website mit fremdem Schema ab', () => {
    expect(validateCommentDraft({ ...VALID, url: 'javascript:alert(1)' }).url)
      .toBe('Diese Adresse sieht nicht gültig aus.')
  })

  it('misst die Länge nach dem Kodieren der Emojis', () => {
    // 245 Zeichen passen genau in die Spalte …
    expect(validateCommentDraft({ ...VALID, name: 'a'.repeat(COMMENT_LIMITS.name) }).name).toBeUndefined()
    // … ein Emoji am Ende wird zu 9 Zeichen (&#x1f604;) und sprengt sie.
    expect(validateCommentDraft({ ...VALID, name: `${'a'.repeat(COMMENT_LIMITS.name - 2)}😄` }).name)
      .toBe('Der Name ist zu lang.')
  })

  it('meldet einen zu langen Kommentar', () => {
    expect(validateCommentDraft({ ...VALID, content: 'x'.repeat(COMMENT_LIMITS.content + 1) }).content)
      .toBe('Der Kommentar ist zu lang.')
  })
})

describe('buildCommentPayload', () => {
  it('baut den Body mit getrimmten Texten und kodierten Emojis', () => {
    const payload = buildCommentPayload(
      { name: '  Martina 🏃 ', email: ' martina@example.org ', url: 'laufblog.example', content: ' Glückwunsch 🎉\n' },
      18055,
    )

    expect(payload).toEqual({
      post: 18055,
      parent: 0,
      author_name: 'Martina &#x1f3c3;',
      author_email: 'martina@example.org',
      author_url: 'https://laufblog.example/',
      content: 'Glückwunsch &#x1f389;',
    })
  })

  it('übernimmt den Elternkommentar bei einer Antwort', () => {
    expect(buildCommentPayload(VALID, 18055, 125400).parent).toBe(125400)
  })

  it('macht aus einem negativen Elternkommentar 0', () => {
    expect(buildCommentPayload(VALID, 18055, -3).parent).toBe(0)
  })

  it('sendet eine leere Website als leeren String', () => {
    expect(buildCommentPayload(VALID, 18055).author_url).toBe('')
  })

  it('sendet eine fehlende E-Mail-Adresse als leeren String', () => {
    expect(buildCommentPayload({ ...VALID, email: '  ' }, 18055).author_email).toBe('')
  })

  it('lässt HTML im Text unangetastet, WordPress filtert es beim Speichern', () => {
    expect(buildCommentPayload({ ...VALID, content: '<b>fett</b> & mehr' }, 1).content).toBe('<b>fett</b> & mehr')
  })
})

describe('parseCommentReceipt', () => {
  it('liest einen freigegebenen Kommentar', () => {
    expect(parseCommentReceipt({ id: 125512, status: 'approved' })).toEqual({ id: 125512, status: 'approved' })
  })

  it('liest einen Kommentar in der Moderation', () => {
    expect(parseCommentReceipt({ id: 125513, status: 'hold' })).toEqual({ id: 125513, status: 'hold' })
  })

  it('zeigt Spamverdacht und unbekannten Status als „hold“', () => {
    expect(parseCommentReceipt({ id: 7, status: 'spam' })).toEqual({ id: 7, status: 'hold' })
    expect(parseCommentReceipt({ id: 7 })).toEqual({ id: 7, status: 'hold' })
  })

  it('gibt null zurück, wenn die id fehlt oder keine positive Ganzzahl ist', () => {
    expect(parseCommentReceipt({ status: 'approved' })).toBeNull()
    expect(parseCommentReceipt({ id: 0, status: 'approved' })).toBeNull()
    expect(parseCommentReceipt({ id: '125512', status: 'approved' })).toBeNull()
    expect(parseCommentReceipt({ id: 1.5, status: 'approved' })).toBeNull()
  })

  it('gibt null zurück für eine Antwort, die kein Objekt ist', () => {
    expect(parseCommentReceipt('<html>Wartung</html>')).toBeNull()
    expect(parseCommentReceipt(null)).toBeNull()
    expect(parseCommentReceipt(undefined)).toBeNull()
  })
})

describe('readCommentFailure', () => {
  it('liest Code und Status aus einem $fetch-Fehler', () => {
    const error = { statusCode: 409, data: { code: 'comment_duplicate', message: 'Doppelter Kommentar' } }
    expect(readCommentFailure(error)).toEqual({ code: 'comment_duplicate', status: 409 })
  })

  it('liest den Status auch ohne JSON-Body (HTML-Fehlerseite)', () => {
    expect(readCommentFailure({ statusCode: 503, data: '<html>…</html>' })).toEqual({ status: 503 })
  })

  it('liefert ein leeres Objekt bei einem Netzwerkfehler', () => {
    expect(readCommentFailure(new TypeError('Failed to fetch'))).toEqual({})
    expect(readCommentFailure(undefined)).toEqual({})
  })
})

describe('commentErrorMessage', () => {
  it('nennt ein Duplikat „bereits eingegangen“', () => {
    expect(commentErrorMessage({ code: 'comment_duplicate', status: 409 }))
      .toBe('Dieser Kommentar ist bereits eingegangen.')
  })

  it('meldet geschlossene Kommentare am Code und hilfsweise am Status 403', () => {
    const closed = 'Für diesen Beitrag sind die Kommentare geschlossen.'
    expect(commentErrorMessage({ code: 'comment_closed', status: 403 })).toBe(closed)
    expect(commentErrorMessage({ status: 403 })).toBe(closed)
  })

  it('meldet einen Netzwerkfehler anders als einen Serverfehler', () => {
    expect(commentErrorMessage({}))
      .toBe('Keine Verbindung zum Blog. Der Text bleibt stehen, bitte gleich noch einmal senden.')
    expect(commentErrorMessage({ status: 500 }))
      .toBe('Kommentieren ist gerade nicht möglich. Bitte später noch einmal versuchen.')
  })

  it('behandelt ein fehlendes Plugin (rest_no_route) als „nicht möglich“', () => {
    expect(commentErrorMessage({ code: 'rest_no_route', status: 404 }))
      .toBe('Kommentieren ist gerade nicht möglich. Bitte später noch einmal versuchen.')
  })

  it('sagt, was fehlt, wenn WordPress Name und E-Mail zur Pflicht macht', () => {
    expect(commentErrorMessage({ code: 'require_name_email', status: 400 }))
      .toBe('Der Blog verlangt Name und E-Mail-Adresse. Bitte beides angeben.')
  })

  it('fällt bei unbekanntem Code auf den Status zurück', () => {
    expect(commentErrorMessage({ code: 'etwas_neues', status: 429 }))
      .toBe('Das ging zu schnell hintereinander. Bitte einen Moment warten und erneut senden.')
  })
})

describe('draftToParagraphs', () => {
  it('trennt an Leerzeilen und behält einfache Zeilenumbrüche', () => {
    expect(draftToParagraphs('Hallo Eddy,\ntoller Lauf!\n\nBis bald')).toEqual(['Hallo Eddy,\ntoller Lauf!', 'Bis bald'])
  })

  it('kommt mit Windows-Zeilenenden zurecht', () => {
    expect(draftToParagraphs('Eins\r\n\r\nZwei')).toEqual(['Eins', 'Zwei'])
  })

  it('gibt für leere Eingaben ein leeres Array zurück', () => {
    expect(draftToParagraphs('')).toEqual([])
    expect(draftToParagraphs(' \n\n ')).toEqual([])
    expect(draftToParagraphs(null)).toEqual([])
  })
})
