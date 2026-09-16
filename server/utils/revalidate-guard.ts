import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Prüft das Shared Secret des WordPress-Webhooks (server/api/revalidate-comments.post.ts).
 *
 * Verglichen wird über die SHA-256-Digests, nicht über die Klartexte. Zwei Gründe:
 * `timingSafeEqual` wirft bei ungleich langen Buffern, und genau dieser Wurf wäre selbst
 * ein Seitenkanal — er verriete die Länge des echten Secrets. Der Hash macht beide Seiten
 * konstant 32 Bytes lang.
 *
 * Ein leeres erwartetes Secret ergibt IMMER `false`. Sonst würde eine vergessene
 * Env-Variable den Endpunkt still für jeden öffnen, der einen leeren Header schickt.
 */
export function revalidateSecretMatches(
  provided: string | undefined | null,
  expected: string | undefined | null,
): boolean {
  if (!provided || !expected) return false

  const providedDigest = createHash('sha256').update(provided, 'utf8').digest()
  const expectedDigest = createHash('sha256').update(expected, 'utf8').digest()

  return timingSafeEqual(providedDigest, expectedDigest)
}

/**
 * Liest die WordPress-Post-ID aus dem Webhook-Body.
 *
 * EXTERN: Der Wert kommt aus einer fremden HTTP-Anfrage und bestimmt am Ende, welche URL
 * der Server selbst aufruft. Deshalb wird hier auf eine positive Ganzzahl eingeengt, statt
 * `Number()` zu vertrauen: das schluckt sonst `'1e3'` (→ 1000), `'0x10'` (→ 16) und
 * `''` (→ 0). Der Slug wird später aus dieser ID bei WordPress geholt und nie aus dem
 * Body übernommen — so landet kein Fremdstring in einer URL.
 *
 * @returns die ID, oder `null` wenn der Wert keine brauchbare Post-ID ist.
 */
export function parseWpPostId(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!/^\d+$/.test(trimmed)) return null

    const parsed = Number(trimmed)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

/** Was der Webhook auslöste — davon hängt ab, welche Pfade neu gebaut werden. */
export type RevalidateScope = 'comment' | 'post'

/**
 * Liest den Auslöser aus dem Webhook-Body.
 *
 * Fehlt er, gilt 'comment'. Das ist Absicht: Die erste Fassung des WordPress-Plugins
 * kannte das Feld noch nicht und schickte ausschließlich Kommentar-Meldungen. Ein nicht
 * aktualisiertes Plugin funktioniert dadurch unverändert weiter, statt auf einen
 * Validierungsfehler zu laufen.
 */
export function parseRevalidateScope(raw: unknown): RevalidateScope {
  return raw === 'post' ? 'post' : 'comment'
}

/**
 * Prüft einen Slug, der aus dem Webhook-Body stammt.
 *
 * EXTERN und heikler als die Post-ID: Dieser Wert wandert direkt in die URL, die der
 * Server anschließend selbst aufruft. Er wird deshalb NUR benutzt, wenn WordPress den
 * Beitrag nicht mehr kennt — bei einem gelöschten Beitrag gibt es keine andere Quelle
 * für den Pfad, der aus dem Cache verschwinden muss.
 *
 * Erlaubt sind ausschließlich die Zeichen, die `sanitize_title()` erzeugt: Kleinbuchstaben,
 * Ziffern, Bindestrich, Unterstrich und Prozent-Kodierung für nicht-lateinische Titel.
 * Damit kann der Wert weder die Pfadebene wechseln (`/`, `.`) noch Query oder Fragment
 * anhängen (`?`, `#`) noch einen anderen Host ansprechen (`:`).
 *
 * @returns den Slug, oder `null` wenn er nicht sicher verwendbar ist.
 */
export function parseWpSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()

  // 200 Zeichen sind großzügig: WordPress kürzt Slugs auf 200 Bytes.
  if (trimmed.length === 0 || trimmed.length > 200) return null

  return /^[a-z0-9\-_%]+$/i.test(trimmed) ? trimmed : null
}
