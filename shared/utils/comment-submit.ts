/**
 * Logik des Kommentarformulars: prüfen, für WordPress aufbereiten, Antwort lesen.
 *
 * Der Browser sendet direkt an die Route des Plugins `eddy-headless-redirect`
 * (`/wp-json/eddy-headless/v1/kommentare`). Weg und Begründung: docs/blog-kommentare.md.
 *
 * Alles hier ist reine Funktion ohne Vue, damit es sich ohne Browser testen lässt. Den
 * Zustand hält `app/composables/useCommentForm.ts`.
 */

/** Was der Leser eintippt. Alle vier Felder sind Fremdtext. */
export interface CommentDraft {
  name: string
  email: string
  url: string
  content: string
}

export type CommentField = keyof CommentDraft

export type CommentFieldErrors = Partial<Record<CommentField, string>>

/** Body für die WordPress-Route. Feldnamen wie in `wp/v2/comments`. */
export interface CommentPayload {
  post: number
  parent: number
  author_name: string
  author_email: string
  author_url: string
  content: string
}

/** `approved` = sofort öffentlich. `hold` = alles andere (Moderation, Spamverdacht). */
export type CommentReceiptStatus = 'approved' | 'hold'

export interface CommentReceipt {
  id: number
  status: CommentReceiptStatus
}

/**
 * Spaltengrenzen der Tabelle `wp_comments`. WordPress prüft dieselben Werte
 * (`wp_handle_comment_submission`) und lehnt längere Eingaben ab; hier steht die Prüfung
 * nur, damit die Meldung am Feld erscheint statt nach dem Absenden.
 */
export const COMMENT_LIMITS: Record<CommentField, number> = {
  name: 245,
  email: 100,
  url: 200,
  content: 65525,
}

/** Bewusst locker: Die verbindliche Prüfung macht WordPress (`is_email`). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Kodiert Zeichen außerhalb der BMP (Emojis) als HTML-Entity: `😄` → `&#x1f604;`.
 *
 * WordPress speichert 4-Byte-Zeichen auf blog.eduard-andrae.de nicht; ein echtes Emoji
 * endete am 12.11.2026 mit `500 rest_comment_failed_create`. Als Entity geht es durch, und
 * die Anzeige dekodiert es wieder (`comment-text.ts`).
 *
 * PRE:  input ist string, undefined oder null
 * POST: kein Codepunkt über U+FFFF im Ergebnis
 * INV:  alles innerhalb der BMP bleibt Zeichen für Zeichen gleich (Umlaute, „“, €)
 */
export function encodeAstralAsEntities(input: string | undefined | null): string {
  if (!input) return ''

  let result = ''
  // for…of läuft über Codepunkte, nicht über UTF-16-Hälften.
  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0
    result += codePoint > 0xFFFF ? `&#x${codePoint.toString(16)};` : char
  }
  return result
}

/**
 * Macht aus der eingetippten Website eine http(s)-Adresse.
 *
 * @returns `''` bei leerer Eingabe, die Adresse bei gültiger, `null` bei unbrauchbarer
 * (anderes Schema wie `javascript:`, Leerzeichen, kein Punkt im Host).
 */
export function normalizeCommentUrl(input: string | undefined | null): string | null {
  const trimmed = (input ?? '').trim()
  if (trimmed === '') return ''

  // „beispiel.de“ ist die übliche Eingabe; ein vorhandenes Schema bleibt und wird geprüft.
  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`

  if (/\s/.test(candidate)) return null

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    if (!parsed.hostname.includes('.')) return null
    return parsed.href
  } catch {
    return null
  }
}

/**
 * Prüft den Entwurf. Ein leeres Objekt heißt: darf gesendet werden.
 *
 * Pflicht sind Kommentar und Name. E-Mail und Website sind freiwillig, werden aber
 * geprüft, sobald etwas drinsteht.
 *
 * Geprüft wird die Länge NACH dem Kodieren der Emojis, weil WordPress genau das speichert.
 */
export function validateCommentDraft(draft: CommentDraft): CommentFieldErrors {
  const errors: CommentFieldErrors = {}

  const name = encodeAstralAsEntities(draft.name.trim())
  const email = draft.email.trim()
  const content = encodeAstralAsEntities(draft.content.trim())
  const url = normalizeCommentUrl(draft.url)

  if (content === '') {
    errors.content = 'Der Kommentar ist noch leer.'
  } else if (content.length > COMMENT_LIMITS.content) {
    errors.content = 'Der Kommentar ist zu lang.'
  }

  if (name === '') {
    errors.name = 'Bitte einen Namen angeben.'
  } else if (name.length > COMMENT_LIMITS.name) {
    errors.name = 'Der Name ist zu lang.'
  }

  // Freiwillig (Eddy, 22.11.2026). Wer eine angibt, soll aber keinen Tippfehler speichern.
  if (email !== '' && (!EMAIL_PATTERN.test(email) || email.length > COMMENT_LIMITS.email)) {
    errors.email = 'Diese E-Mail-Adresse sieht nicht gültig aus.'
  }

  if (url === null || url.length > COMMENT_LIMITS.url) {
    errors.url = 'Diese Adresse sieht nicht gültig aus.'
  }

  return errors
}

/**
 * Baut den Body für WordPress.
 *
 * PRE:  `validateCommentDraft(draft)` ist leer, `postId` eine positive Ganzzahl
 * POST: Texte getrimmt, Emojis kodiert, Website mit Schema oder leer
 */
export function buildCommentPayload(draft: CommentDraft, postId: number, parentId = 0): CommentPayload {
  return {
    post: postId,
    parent: parentId > 0 ? parentId : 0,
    author_name: encodeAstralAsEntities(draft.name.trim()),
    author_email: draft.email.trim(),
    author_url: normalizeCommentUrl(draft.url) ?? '',
    content: encodeAstralAsEntities(draft.content.trim()),
  }
}

/**
 * Liest die Antwort der WordPress-Route.
 *
 * EXTERN: Nur eine positive Ganzzahl als `id` gilt als Bestätigung. Fehlt sie, hat nicht
 * die erwartete Route geantwortet (Wartungsseite, Proxy), und „gesendet“ wäre gelogen.
 *
 * @returns den Beleg, oder `null`, wenn die Antwort keine Bestätigung ist.
 */
export function parseCommentReceipt(raw: unknown): CommentReceipt | null {
  if (typeof raw !== 'object' || raw === null) return null

  const { id, status } = raw as { id?: unknown, status?: unknown }
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null

  // Alles außer „approved“ ist für den Absender dasselbe: noch nicht sichtbar. Ein
  // Spamverdacht wird ihm bewusst nicht gemeldet.
  return { id, status: status === 'approved' ? 'approved' : 'hold' }
}

/** Was vom Fehlschlag bekannt ist. Beides fehlt bei einem Netzwerkfehler oder Timeout. */
export interface CommentFailure {
  code?: string
  status?: number
}

/**
 * Zieht WordPress-Fehlercode und HTTP-Status aus dem, was `$fetch` wirft.
 *
 * EXTERN: Die Form ist nicht garantiert (HTML-Fehlerseite des Hosters statt JSON), deshalb
 * wird jedes Feld einzeln geprüft.
 */
export function readCommentFailure(error: unknown): CommentFailure {
  if (typeof error !== 'object' || error === null) return {}

  const { data, statusCode, status } = error as { data?: unknown, statusCode?: unknown, status?: unknown }
  const failure: CommentFailure = {}

  const httpStatus = typeof statusCode === 'number' ? statusCode : status
  if (typeof httpStatus === 'number') failure.status = httpStatus

  if (typeof data === 'object' && data !== null) {
    const { code } = data as { code?: unknown }
    if (typeof code === 'string' && code !== '') failure.code = code
  }

  return failure
}

const MESSAGE_CLOSED = 'Für diesen Beitrag sind die Kommentare geschlossen.'
const MESSAGE_UNAVAILABLE = 'Kommentieren ist gerade nicht möglich. Bitte später noch einmal versuchen.'

/** Codes aus `wp_handle_comment_submission()` und der REST-Schicht davor. */
const MESSAGES_BY_CODE: Record<string, string> = {
  comment_duplicate: 'Dieser Kommentar ist bereits eingegangen.',
  comment_flood: 'Das ging zu schnell hintereinander. Bitte einen Moment warten und erneut senden.',
  comment_closed: MESSAGE_CLOSED,
  comment_id_not_found: MESSAGE_CLOSED,
  comment_on_draft: MESSAGE_CLOSED,
  comment_on_trash: MESSAGE_CLOSED,
  comment_on_password_protected: MESSAGE_CLOSED,
  // Kommt nur, falls in WordPress die Pflicht für Name UND E-Mail eingeschaltet wird; das
  // Formular lässt die E-Mail sonst leer durch (docs/blog-kommentare.md).
  require_name_email: 'Der Blog verlangt Name und E-Mail-Adresse. Bitte beides angeben.',
  require_valid_email: 'Diese E-Mail-Adresse nimmt der Blog nicht an. Bitte prüfen.',
  require_valid_comment: 'Der Kommentar ist leer.',
  comment_author_column_length: 'Der Name ist zu lang.',
  comment_author_email_column_length: 'Die E-Mail-Adresse ist zu lang.',
  comment_author_url_column_length: 'Die Website-Adresse ist zu lang.',
  comment_content_column_length: 'Der Kommentar ist zu lang.',
  comment_reply_to_unapproved_comment: 'Der Kommentar, auf den die Antwort zielt, ist nicht mehr verfügbar.',
  // Plugin fehlt oder ist älter als 1.3.0, siehe „Reihenfolge beim Ausrollen“ in der Doku.
  rest_no_route: MESSAGE_UNAVAILABLE,
}

/**
 * Meldung für den Absender. Der Text aus WordPress wird nie angezeigt (Fremdtext, andere
 * Tonlage); entschieden wird am Code, hilfsweise am Status.
 */
export function commentErrorMessage(failure: CommentFailure): string {
  const byCode = failure.code ? MESSAGES_BY_CODE[failure.code] : undefined
  if (byCode) return byCode

  if (failure.status === undefined) {
    return 'Keine Verbindung zum Blog. Der Text bleibt stehen, bitte gleich noch einmal senden.'
  }
  if (failure.status === 429) return MESSAGES_BY_CODE.comment_flood!
  if (failure.status === 403) return MESSAGE_CLOSED
  if (failure.status === 400) return 'Der Blog hat die Angaben nicht angenommen. Bitte die Felder prüfen.'

  return MESSAGE_UNAVAILABLE
}

/**
 * Zerlegt den eingetippten Text in Absätze für den Prüfschein nach dem Senden. Dieselbe
 * Form wie `commentHtmlToParagraphs`, damit beide gleich gerendert werden (`v-text`).
 */
export function draftToParagraphs(content: string | undefined | null): string[] {
  if (!content) return []

  return content
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(block => block.split('\n').map(line => line.trim()).join('\n').trim())
    .filter(block => block.length > 0)
}
