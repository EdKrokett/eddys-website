import type { Lauf } from '#shared/types/statistik'

/**
 * Alles, was die Seite /statistik aus der Laufliste ableitet. Reine Funktionen, damit die
 * Regeln aus docs/statistik.md („Regeln für abgeleitete Werte“) ohne Nuxt testbar sind.
 *
 * Grundsatz: Kennzahlen werden IMMER aus der vollständigen Liste gerechnet, nie aus einem
 * gefilterten Ausschnitt. Genau so ist beim Berlin-Beitrag die falsche Bestzeit entstanden.
 */

export const MARATHON_KM = 42.2
export const HALBMARATHON_KM = 21.1

/** Ins Ziel gekommen, Wettkampf oder Training. Meilensteine sind keine Läufe. */
export function istGefinisht(lauf: Lauf): boolean {
  return lauf.art !== 'meilenstein' && lauf.ergebnis === 'finish'
}

/** Zählt als Marathon: Wettkampf, im Ziel, Einzelwertung, 42,2 km. Die Kölner Staffel fällt raus. */
export function istMarathon(lauf: Lauf): boolean {
  return istGefinisht(lauf) && lauf.art === 'wettkampf' && lauf.wertung === 'einzel' && lauf.distanzKm === MARATHON_KM
}

/** Halbmarathon im Ziel, Trainingsläufe eingeschlossen (so zählt Eddy sie auch in seinen Berichten). */
export function istHalbmarathon(lauf: Lauf): boolean {
  return istGefinisht(lauf) && lauf.wertung === 'einzel' && lauf.distanzKm === HALBMARATHON_KM
}

export interface Kennzahlen {
  /** Jahr des frühesten Eintrags, Meilensteine eingeschlossen (Laufstart 2006). */
  seitJahr: number | null
  wettkaempfe: number
  wettkampfKm: number
  marathons: number
  bestzeitMarathon: Lauf | null
  bestzeitHalbmarathon: Lauf | null
  laengsterLauf: Lauf | null
}

export function berechneKennzahlen(laeufe: readonly Lauf[]): Kennzahlen {
  const wettkaempfe = laeufe.filter(lauf => istGefinisht(lauf) && lauf.art === 'wettkampf')

  return {
    seitJahr: laeufe.length ? Math.min(...laeufe.map(lauf => lauf.jahr)) : null,
    wettkaempfe: wettkaempfe.length,
    wettkampfKm: Math.round(wettkaempfe.reduce((summe, lauf) => summe + (lauf.distanzKm ?? 0), 0)),
    marathons: laeufe.filter(istMarathon).length,
    bestzeitMarathon: schnellster(laeufe.filter(istMarathon)),
    bestzeitHalbmarathon: schnellster(laeufe.filter(istHalbmarathon)),
    laengsterLauf: laeufe
      .filter(lauf => istGefinisht(lauf) && lauf.wertung === 'einzel' && lauf.distanzKm !== null)
      .reduce<Lauf | null>((best, lauf) => !best || lauf.distanzKm! > best.distanzKm! ? lauf : best, null),
  }
}

/** Kürzeste Zeit; bei Gleichstand der frühere Lauf. `null`, wenn keiner eine Zeit hat. */
function schnellster(laeufe: readonly Lauf[]): Lauf | null {
  return laeufe
    .filter(lauf => lauf.sekunden !== null)
    .reduce<Lauf | null>((best, lauf) => {
      if (!best) return lauf
      if (lauf.sekunden! < best.sekunden!) return lauf
      if (lauf.sekunden === best.sekunden && lauf.datum < best.datum) return lauf
      return best
    }, null)
}

export interface ReihenPunkt {
  lauf: Lauf
  sekunden: number
  bestzeit: boolean
}

/** Chronologisch aufsteigend, nur Läufe mit Zeit. Genau ein Punkt trägt `bestzeit`. */
function reihe(laeufe: readonly Lauf[], bedingung: (lauf: Lauf) => boolean): ReihenPunkt[] {
  const passend = laeufe.filter(lauf => bedingung(lauf) && lauf.sekunden !== null)
  const best = schnellster(passend)

  return [...passend]
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .map(lauf => ({ lauf, sekunden: lauf.sekunden!, bestzeit: lauf === best }))
}

export function marathonReihe(laeufe: readonly Lauf[]): ReihenPunkt[] {
  return reihe(laeufe, istMarathon)
}

export function halbmarathonReihe(laeufe: readonly Lauf[]): ReihenPunkt[] {
  return reihe(laeufe, istHalbmarathon)
}

/* ── Zeitstrahl ─────────────────────────────────────────────────────────── */

export type MarkenTyp = 'lauf' | 'ausfall' | 'meilenstein'

export interface ZeitstrahlMarke {
  lauf: Lauf
  typ: MarkenTyp
  /** Position auf der Achse, 0–100. */
  offsetPct: number
  /** Strichlänge, 0–100. Wurzel-Skala, damit 5 km neben 72,7 km noch sichtbar bleiben. */
  hoehePct: number
}

export interface ZeitstrahlModell {
  vonJahr: number
  bisJahr: number
  ticks: Array<{ jahr: number, offsetPct: number, major: boolean }>
  marken: ZeitstrahlMarke[]
}

/** Kürzester Strich, damit ein 5-km-Lauf nicht zum Punkt schrumpft. */
const MIN_HOEHE = 12

/**
 * @param bisJahr Referenzjahr aus dem SSR-Payload (`stand`), nie ein frisches `new Date()`.
 * @returns `null` bei leerer Liste.
 */
export function baueZeitstrahl(laeufe: readonly Lauf[], bisJahr: number): ZeitstrahlModell | null {
  if (!laeufe.length) return null

  const vonJahr = Math.min(...laeufe.map(lauf => lauf.jahr))
  const endJahr = Math.max(bisJahr, ...laeufe.map(lauf => lauf.jahr))
  const start = Date.UTC(vonJahr, 0, 1)
  const ende = Date.UTC(endJahr + 1, 0, 1)
  const offset = (ms: number) => Math.round(((ms - start) / (ende - start)) * 10000) / 100

  const maxKm = Math.max(...laeufe.map(lauf => lauf.distanzKm ?? 0))
  const hoehe = (km: number | null) => {
    if (!km || maxKm <= 0) return MIN_HOEHE
    return Math.max(MIN_HOEHE, Math.round((Math.sqrt(km) / Math.sqrt(maxKm)) * 100))
  }

  const ticks = []
  for (let jahr = vonJahr; jahr <= endJahr; jahr++) {
    ticks.push({ jahr, offsetPct: offset(Date.UTC(jahr, 0, 1)), major: jahr % 5 === 0 })
  }

  const marken = [...laeufe]
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .map((lauf): ZeitstrahlMarke => {
      const [j, m, t] = lauf.datum.split('-').map(Number) as [number, number, number]
      const typ: MarkenTyp = lauf.art === 'meilenstein' ? 'meilenstein' : lauf.ergebnis === 'finish' ? 'lauf' : 'ausfall'
      return { lauf, typ, offsetPct: offset(Date.UTC(j, m - 1, t)), hoehePct: typ === 'meilenstein' ? 0 : hoehe(lauf.distanzKm) }
    })

  return { vonJahr, bisJahr: endJahr, ticks, marken }
}

/* ── Streudiagramm Zeit über Datum ─────────────────────────────────────── */

export interface ZeitPlotModell {
  vonJahr: number
  bisJahr: number
  /** Beschriftete Linien der Zeitachse, unten (schnell) nach oben (langsam). */
  yTicks: Array<{ sekunden: number, label: string, pct: number }>
  xTicks: Array<{ jahr: number, pct: number }>
  punkte: Array<ReihenPunkt & { xPct: number, yPct: number }>
  /** Höhe der Referenzlinie in Prozent, `null` wenn sie außerhalb des Bereichs liegt. */
  referenzPct: number | null
}

/**
 * Zeit (y) über Datum (x). Die y-Achse beginnt bewusst NICHT bei null: Gezeigt wird der
 * Abstand zur Referenz (zwei Stunden), nicht die Größe der Zeit. Deshalb Punkte, keine Balken.
 *
 * @param schritt Rasterweite der y-Achse in Sekunden (Default 15 Minuten).
 * @returns `null` ohne Punkte.
 */
export function baueZeitPlot(
  reihe: readonly ReihenPunkt[],
  bisJahr: number,
  referenz = 7200,
  schritt = 900,
): ZeitPlotModell | null {
  if (!reihe.length) return null

  const zeiten = reihe.map(p => p.sekunden)
  const yMin = Math.floor(Math.min(...zeiten, referenz) / schritt) * schritt
  const yMax = Math.ceil(Math.max(...zeiten, referenz) / schritt) * schritt
  const spanne = Math.max(yMax - yMin, schritt)
  const y = (sek: number) => Math.round(((sek - yMin) / spanne) * 10000) / 100

  const vonJahr = Math.min(...reihe.map(p => p.lauf.jahr))
  const endJahr = Math.max(bisJahr, ...reihe.map(p => p.lauf.jahr))
  const start = Date.UTC(vonJahr, 0, 1)
  const ende = Date.UTC(endJahr + 1, 0, 1)
  const x = (datum: string) => {
    const [j, m, t] = datum.split('-').map(Number) as [number, number, number]
    return Math.round(((Date.UTC(j, m - 1, t) - start) / (ende - start)) * 10000) / 100
  }

  const yTicks = []
  for (let sek = yMin; sek <= yMax; sek += schritt) {
    yTicks.push({ sekunden: sek, label: formatDauer(sek), pct: y(sek) })
  }

  // Das Startjahr bekommt nur dann ein Label, wenn das nächste Fünferjahr mindestens vier
  // Jahre entfernt ist. Sonst stoßen die Zahlen auf schmalen Bildschirmen zusammen
  // („2007 2010“ bei drei Jahren Abstand, gesehen bei 390 px).
  const naechstesFuenferjahr = Math.ceil(vonJahr / 5) * 5
  const startLabel = naechstesFuenferjahr - vonJahr >= 4
  const xTicks = []
  for (let jahr = vonJahr; jahr <= endJahr + 1; jahr++) {
    if (jahr % 5 === 0 || (jahr === vonJahr && startLabel)) xTicks.push({ jahr, pct: x(`${jahr}-01-01`) })
  }

  return {
    vonJahr,
    bisJahr: endJahr,
    yTicks,
    xTicks,
    punkte: reihe.map(p => ({ ...p, xPct: x(p.lauf.datum), yPct: y(p.sekunden) })),
    referenzPct: referenz >= yMin && referenz <= yMax ? y(referenz) : null,
  }
}

/* ── Protokoll ──────────────────────────────────────────────────────────── */

export type ProtokollFilter = 'alle' | 'marathon' | 'halbmarathon' | 'meilensteine'

export const PROTOKOLL_FILTER: ReadonlyArray<{ wert: ProtokollFilter, label: string }> = [
  { wert: 'alle', label: 'Alle' },
  { wert: 'marathon', label: 'Marathon' },
  { wert: 'halbmarathon', label: 'Halbmarathon' },
  { wert: 'meilensteine', label: 'Meilensteine' },
]

/**
 * Filter nach Kategorie und Freitext. Anders als bei den Kennzahlen zeigt „Marathon“ hier alle
 * Einträge über 42,2 km, auch die Staffel: Die Liste soll nichts verstecken, die Markierung
 * am Eintrag erklärt, warum er nicht mitzählt.
 */
export function filterLaeufe(laeufe: readonly Lauf[], filter: ProtokollFilter, suche: string): Lauf[] {
  const begriff = suche.trim().toLocaleLowerCase('de')

  return laeufe.filter((lauf) => {
    if (filter === 'marathon' && lauf.distanzKm !== MARATHON_KM) return false
    if (filter === 'halbmarathon' && lauf.distanzKm !== HALBMARATHON_KM) return false
    if (filter === 'meilensteine' && lauf.art !== 'meilenstein') return false
    if (!begriff) return true

    return [lauf.titel, lauf.notiz ?? '', String(lauf.jahr)]
      .some(text => text.toLocaleLowerCase('de').includes(begriff))
  })
}

/** Nach Jahr gruppiert, neuestes Jahr zuerst; innerhalb des Jahres die Reihenfolge der Eingabe. */
export function gruppiereNachJahr(laeufe: readonly Lauf[]): Array<{ jahr: number, laeufe: Lauf[] }> {
  const gruppen = new Map<number, Lauf[]>()
  for (const lauf of laeufe) {
    gruppen.set(lauf.jahr, [...(gruppen.get(lauf.jahr) ?? []), lauf])
  }
  return [...gruppen.entries()]
    .sort(([a], [b]) => b - a)
    .map(([jahr, eintraege]) => ({ jahr, laeufe: eintraege }))
}

/* ── Formate ────────────────────────────────────────────────────────────── */

const zwei = (n: number) => String(n).padStart(2, '0')

/** 13349 → „3:42:29“, 1411 → „23:31“. `null` → „–“. */
export function formatDauer(sekunden: number | null): string {
  if (sekunden === null || sekunden <= 0) return '–'
  const h = Math.floor(sekunden / 3600)
  const m = Math.floor((sekunden % 3600) / 60)
  const s = sekunden % 60
  return h > 0 ? `${h}:${zwei(m)}:${zwei(s)}` : `${m}:${zwei(s)}`
}

/** 21.1 → „21,1“, 25 → „25,0“. `null` → „–“. */
export function formatDistanz(km: number | null): string {
  return km === null ? '–' : km.toFixed(1).replace('.', ',')
}

/**
 * 1234 → „1.234“. Von Hand statt `toLocaleString('de-DE')`: Server und Browser können
 * verschiedene ICU-Daten haben, und eine abweichende Ausgabe wäre ein Hydration-Mismatch
 * (dieselbe Begründung wie bei `formatKm` in ueber-mich.ts).
 */
export function formatGanzzahl(zahl: number): string {
  return String(Math.round(zahl)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Tempo in Minuten pro Kilometer, z. B. „5:44“. `null`, wenn Zeit oder Distanz fehlt. */
export function formatPace(sekunden: number | null, km: number | null): string | null {
  if (!sekunden || !km) return null
  const proKm = Math.round(sekunden / km)
  return `${Math.floor(proKm / 60)}:${zwei(proKm % 60)}`
}

/** „2026-10-31“ → „31.10.“ (ohne Zeitzonen-Umweg über `Date`). */
export function formatTagMonat(datum: string): string {
  const [, monat, tag] = datum.split('-')
  return `${tag}.${monat}.`
}

/**
 * Ein Link auf einen Beitrag des eigenen Blogs wird zum internen Pfad `/blog/<slug>`, damit
 * der Besucher auf dieser Seite bleibt. Erkannt wird nur die Form „Domain + genau ein
 * Pfadsegment“; alles andere (Kategorien, Bilder, fremde Seiten) bleibt, wie es ist.
 *
 * @returns den internen Pfad, oder `null` für einen externen Link.
 */
export function internerBlogPfad(url: string | null): string | null {
  if (!url) return null
  const match = /^https?:\/\/(?:www\.|blog\.)?eduard-andrae\.de\/([a-z0-9\-_%]+)\/?$/i.exec(url)
  return match ? `/blog/${match[1]!.toLowerCase()}` : null
}
