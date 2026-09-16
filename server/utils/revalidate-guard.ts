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
