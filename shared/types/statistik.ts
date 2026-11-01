/**
 * Eddys Läufe seit 2006. Datenquelle ist das WordPress-Plugin eddy-laufstatistik,
 * Modell und Regeln in docs/statistik.md.
 */

export type LaufArt = 'wettkampf' | 'training' | 'meilenstein'

/** Bei Meilensteinen ohne Bedeutung, steht dort aber auf dem Default `finish`. */
export type LaufErgebnis = 'finish' | 'dns' | 'dnf'

/** Staffel und Triathlon-Laufanteil zählen nicht als Marathon und nicht für Bestzeiten. */
export type LaufWertung = 'einzel' | 'staffel' | 'triathlon'

export interface LaufLink {
  label: string
  /** `null` = reine Beschriftung, z. B. „Polar“, wenn die Aufzeichnung nicht mehr online ist. */
  url: string | null
}

export interface Lauf {
  id: number
  titel: string
  /** `YYYY-MM-DD`, garantiert ein gültiges Kalenderdatum. */
  datum: string
  jahr: number
  /** Eine Nachkommastelle. `null` bei Meilensteinen. */
  distanzKm: number | null
  /** Nettozeit in Sekunden. `null` bei DNS, Meilensteinen oder unlesbarer Zeit. */
  sekunden: number | null
  art: LaufArt
  ergebnis: LaufErgebnis
  wertung: LaufWertung
  notiz: string | null
  links: LaufLink[]
}

export interface StatistikResponse {
  /** Neueste zuerst. */
  laeufe: Lauf[]
  /** Einträge, die die Prüfung nicht bestanden haben. Sollte 0 sein. */
  verworfen: number
  /** Zeitpunkt der Abfrage (ISO). Referenz für „heute“, damit SSR und Client gleich rechnen. */
  stand: string
}
