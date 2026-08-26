/**
 * WordPress liefert `title.rendered` und `excerpt.rendered` mit HTML-Entities aus
 * (echtes Beispiel aus diesem Blog: "Jetzt wird&#8217;s ernst!"). Da die Titel im
 * Frontend bewusst per `v-text` gerendert werden (kein `v-html` für Fremdtext),
 * würden die Entities sonst wörtlich auf der Seite stehen.
 *
 * Bewusst eine kleine eigene Funktion statt DOM-Parsing: läuft auch serverseitig
 * in der Nitro-Route (kein `document`) und schleppt keine Abhängigkeit ein.
 *
 * PRE:  input ist string, undefined oder null
 * POST: Rückgabe ist immer ein string; unterstützte Entities sind aufgelöst
 * INV:  Text ohne Entities bleibt unverändert; ein einziger Durchlauf, damit
 *       "&amp;#8217;" zu "&#8217;" wird und nicht versehentlich zu "’"
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  laquo: '«',
  raquo: '»',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  szlig: 'ß',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  euro: '€',
  deg: '°',
  shy: '',
}

const MAX_CODE_POINT = 0x10FFFF

/** Ein Durchlauf über alle Formen gleichzeitig — siehe INV oben. */
const ENTITY_PATTERN = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g

function decodeNumeric(body: string): string | undefined {
  const isHex = body[1] === 'x' || body[1] === 'X'
  const digits = isHex ? body.slice(2) : body.slice(1)
  if (digits.length === 0) return undefined

  const codePoint = Number.parseInt(digits, isHex ? 16 : 10)
  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > MAX_CODE_POINT) {
    return undefined
  }

  try {
    return String.fromCodePoint(codePoint)
  } catch {
    // Surrogate-Hälften (0xD800–0xDFFF) werfen — unauflösbar, also stehen lassen.
    return undefined
  }
}

export function decodeHtmlEntities(input: string | undefined | null): string {
  if (!input) return ''

  return input.replace(ENTITY_PATTERN, (match, body: string) => {
    const decoded = body.startsWith('#')
      ? decodeNumeric(body)
      : NAMED_ENTITIES[body]

    // Unbekannt oder unauflösbar: Original stehen lassen statt Text zu zerstören.
    return decoded ?? match
  })
}
