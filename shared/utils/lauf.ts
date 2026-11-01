import type { Lauf, LaufArt, LaufErgebnis, LaufLink, LaufWertung } from '#shared/types/statistik'
import { rewriteLegacyWpUrls } from '#shared/utils/rewrite-wp-urls'

const ARTEN: readonly LaufArt[] = ['wettkampf', 'training', 'meilenstein']
const ERGEBNISSE: readonly LaufErgebnis[] = ['finish', 'dns', 'dnf']
const WERTUNGEN: readonly LaufWertung[] = ['einzel', 'staffel', 'triathlon']

/** Längster Titel, der unverändert durchgeht. Schützt das Layout, nicht die Daten. */
const MAX_TITEL = 200

/**
 * Liest `H:MM:SS` bzw. `HH:MM:SS` in Sekunden.
 *
 * @returns Sekunden > 0, oder `null` bei leerem, kaputtem oder Null-Wert.
 */
export function parseZeit(raw: unknown): number | null {
  if (typeof raw !== 'string') return null

  const match = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.exec(raw.trim())
  if (!match) return null

  const sekunden = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
  return sekunden > 0 ? sekunden : null
}

/** `true` nur für echte Kalenderdaten im Format `YYYY-MM-DD` (kein 2026-02-30). */
export function isValidDatum(raw: unknown): raw is string {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false

  const [jahr, monat, tag] = raw.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(jahr, monat - 1, tag))

  return date.getUTCFullYear() === jahr && date.getUTCMonth() === monat - 1 && date.getUTCDate() === tag
}

/**
 * Prüft einen Lauf aus der WordPress-Antwort.
 *
 * EXTERN: Die Daten kommen aus WordPress und landen in Diagrammen, Links und Rechnungen.
 * Zwei Stufen, damit ein Tippfehler im Formular nicht still einen ganzen Lauf verschwinden lässt:
 *
 * - **Verworfen** (`null`) wird nur, was den Lauf unbrauchbar macht: keine ID, kein Titel,
 *   kein gültiges Datum, eine unbekannte Art/Ergebnis/Wertung.
 * - **Auf `null` gesetzt** wird ein einzelnes unlesbares Feld (Zeit, Distanz, Link-URL).
 *   Der Lauf bleibt in der Liste.
 *
 * Leere Enum-Felder bekommen ihren Default, so wie das Plugin sie beim Speichern setzt.
 */
export function parseLauf(raw: unknown): Lauf | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const id = typeof r.id === 'number' && Number.isSafeInteger(r.id) && r.id > 0 ? r.id : null
  const titel = typeof r.titel === 'string' ? r.titel.trim().slice(0, MAX_TITEL) : ''
  if (id === null || titel === '' || !isValidDatum(r.datum)) return null

  const art = enumOrDefault(r.art, ARTEN, 'wettkampf')
  const ergebnis = enumOrDefault(r.ergebnis, ERGEBNISSE, 'finish')
  const wertung = enumOrDefault(r.wertung, WERTUNGEN, 'einzel')
  if (art === null || ergebnis === null || wertung === null) return null

  const istMeilenstein = art === 'meilenstein'

  return {
    id,
    titel,
    datum: r.datum,
    jahr: Number(r.datum.slice(0, 4)),
    distanzKm: istMeilenstein ? null : parseDistanz(r.distanzKm),
    // Ein DNS hat keine Zeit, auch wenn versehentlich eine eingetragen ist.
    sekunden: istMeilenstein || ergebnis === 'dns' ? null : parseZeit(r.zeit),
    art,
    ergebnis,
    wertung,
    notiz: typeof r.notiz === 'string' && r.notiz.trim() !== '' ? r.notiz.trim() : null,
    links: parseLinks(r.links),
  }
}

/**
 * Leerer oder fehlender Wert → Default. Unbekannter Wert → `null` (Lauf wird verworfen),
 * denn dann stimmt das Plugin nicht mehr mit dieser Liste überein, und das soll auffallen.
 */
function enumOrDefault<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T | null {
  if (raw === undefined || raw === null || raw === '') return fallback
  return allowed.includes(raw as T) ? raw as T : null
}

function parseDistanz(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0 || raw > 1000) return null
  return Math.round(raw * 10) / 10
}

/**
 * Nur http(s) wird zum Link. Alles andere (`javascript:`, relative Pfade, Müll) verliert die
 * URL und bleibt als Beschriftung stehen: Der Wert landet in einem `href`.
 */
function parseLinks(raw: unknown): LaufLink[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item): LaufLink[] => {
    if (!item || typeof item !== 'object') return []
    const { label, url } = item as Record<string, unknown>
    if (typeof label !== 'string' || label.trim() === '') return []

    return [{ label: label.trim(), url: safeHttpUrl(url) }]
  })
}

/**
 * Die alte Tabelle verlinkt Urkunden und Beiträge noch auf `www.eduard-andrae.de`, wo seit
 * August 2026 die Nuxt-Seite läuft. `rewriteLegacyWpUrls` hebt sie auf blog.eduard-andrae.de
 * und https an (dort geprüft erreichbar, 01.11.2026).
 */
function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null

  try {
    const url = new URL(rewriteLegacyWpUrls(raw.trim()))
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}
