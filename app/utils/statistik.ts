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
  /** Mitte der Marke auf der Achse, 0–100. */
  offsetPct: number
  /** Breite des Platzes, der dieser Marke zusteht, 0–100. Daraus leitet sich die Strichbreite ab. */
  slotPct: number
  /** Strichlänge, 0–100. Wurzel-Skala, damit 5 km neben 72,7 km noch sichtbar bleiben. */
  hoehePct: number
}

/** Ein Jahr auf der Achse. Breite nach Zahl der Einträge, nicht nach Kalenderlänge. */
export interface ZeitstrahlBand {
  jahr: number
  startPct: number
  breitePct: number
  anzahl: number
}

/** Beschriftung unter der Achse: ein Jahr, oder eine ruhige Phase („2018–2024“) als Ganzes. */
export interface ZeitstrahlLabel {
  text: string
  /** Für schmale Bildschirme: „’11“, „’18–’24“. Die vollen Zahlen stießen dort aneinander. */
  kurz: string
  mittePct: number
  /** `true` = auch auf schmalen Bildschirmen zeigen. Nebenlabels kollidierten dort. */
  haupt: boolean
}

export interface ZeitstrahlModell {
  vonJahr: number
  bisJahr: number
  baender: ZeitstrahlBand[]
  labels: ZeitstrahlLabel[]
  /** Bandanfänge; das Zifferblatt im Seitenkopf zeichnet daraus seine Jahresteilung. */
  ticks: Array<{ jahr: number, offsetPct: number, major: boolean }>
  marken: ZeitstrahlMarke[]
}

/** Kürzester Strich, damit ein 5-km-Lauf nicht zum Punkt schrumpft. */
const MIN_HOEHE = 12
/** Rand je Jahresband, in Platz-Einheiten (ein Eintrag = 1). Trennt die Jahre sichtbar. */
const BAND_RAND = 1
/** Breite eines Jahres ohne Eintrag. Es bleibt sichtbar, kostet aber kaum Platz. */
const LEERES_JAHR = 0.5
/** Ab so vielen Einträgen bekommt ein Jahr auch auf dem Handy ein eigenes Label. */
const HAUPTLABEL_AB = 5

/**
 * Der Zeitstrahl, gestaucht nach Aktivität (Eddys Wunsch, 01.11.2026). Eine lineare Zeitachse
 * gab 2017–2024 mit zusammen sieben Einträgen genauso viel Platz wie 2010–2016 mit über
 * vierzig; dort drängten sich 2px-Striche, die kaum zu treffen waren.
 *
 * Jetzt bekommt jedes Jahr ein Band, so breit wie seine Einträge (plus Rand). Innerhalb des
 * Jahres stehen die Einträge in Datumsfolge mit gleichem Abstand, also nie übereinander.
 * Die Achse ist damit kategorial nach Jahren, nicht mehr maßstäblich nach Tagen; die Bänder
 * machen das sichtbar.
 *
 * Aufeinanderfolgende Jahre mit höchstens einem Eintrag teilen sich ein Label („2018–2024“).
 *
 * @param bisJahr Referenzjahr aus dem SSR-Payload (`stand`), nie ein frisches `new Date()`.
 * @returns `null` bei leerer Liste.
 */
export function baueZeitstrahl(laeufe: readonly Lauf[], bisJahr: number): ZeitstrahlModell | null {
  if (!laeufe.length) return null

  const vonJahr = Math.min(...laeufe.map(lauf => lauf.jahr))
  const endJahr = Math.max(bisJahr, ...laeufe.map(lauf => lauf.jahr))
  const rund = (wert: number) => Math.round(wert * 100) / 100

  const sortiert = [...laeufe].sort((a, b) => a.datum.localeCompare(b.datum) || a.id - b.id)
  const proJahr = new Map<number, Lauf[]>()
  for (const lauf of sortiert) proJahr.set(lauf.jahr, [...(proJahr.get(lauf.jahr) ?? []), lauf])

  const jahre = Array.from({ length: endJahr - vonJahr + 1 }, (_, i) => vonJahr + i)
  const gewicht = (jahr: number) => {
    const anzahl = proJahr.get(jahr)?.length ?? 0
    return anzahl ? anzahl + BAND_RAND : LEERES_JAHR
  }
  const gesamt = jahre.reduce((summe, jahr) => summe + gewicht(jahr), 0)
  const einheit = 100 / gesamt

  const maxKm = Math.max(...laeufe.map(lauf => lauf.distanzKm ?? 0))
  const hoehe = (km: number | null) => {
    if (!km || maxKm <= 0) return MIN_HOEHE
    return Math.max(MIN_HOEHE, Math.round((Math.sqrt(km) / Math.sqrt(maxKm)) * 100))
  }

  const baender: ZeitstrahlBand[] = []
  const marken: ZeitstrahlMarke[] = []
  let position = 0

  for (const jahr of jahre) {
    const eintraege = proJahr.get(jahr) ?? []
    const breite = gewicht(jahr) * einheit
    baender.push({ jahr, startPct: rund(position), breitePct: rund(breite), anzahl: eintraege.length })

    eintraege.forEach((lauf, index) => {
      const typ: MarkenTyp = lauf.art === 'meilenstein' ? 'meilenstein' : lauf.ergebnis === 'finish' ? 'lauf' : 'ausfall'
      marken.push({
        lauf,
        typ,
        offsetPct: rund(position + (BAND_RAND / 2 + index + 0.5) * einheit),
        slotPct: rund(einheit),
        hoehePct: typ === 'meilenstein' ? 0 : hoehe(lauf.distanzKm),
      })
    })

    position += breite
  }

  return {
    vonJahr,
    bisJahr: endJahr,
    baender,
    labels: baueLabels(baender),
    ticks: baender.map(band => ({ jahr: band.jahr, offsetPct: band.startPct, major: band.jahr % 5 === 0 })),
    marken,
  }
}

/** 2011 → „’11“ (typografischer Apostroph). */
const kurzJahr = (jahr: number) => `’${String(jahr).slice(-2)}`

function baueLabels(baender: readonly ZeitstrahlBand[]): ZeitstrahlLabel[] {
  const labels: ZeitstrahlLabel[] = []
  const mitte = (von: ZeitstrahlBand, bis: ZeitstrahlBand) =>
    Math.round((von.startPct + (bis.startPct + bis.breitePct - von.startPct) / 2) * 100) / 100

  let i = 0
  while (i < baender.length) {
    const band = baender[i]!
    // Ruhige Phase: mindestens zwei aufeinanderfolgende Jahre mit höchstens einem Eintrag.
    let ende = i
    while (ende + 1 < baender.length && baender[ende + 1]!.anzahl <= 1 && band.anzahl <= 1) ende++

    if (ende > i) {
      const letztes = baender[ende]!
      labels.push({
        text: `${band.jahr}–${letztes.jahr}`,
        kurz: `${kurzJahr(band.jahr)}–${kurzJahr(letztes.jahr)}`,
        mittePct: mitte(band, letztes),
        haupt: true,
      })
      i = ende + 1
      continue
    }

    const randjahr = i === 0 || i === baender.length - 1
    labels.push({
      text: String(band.jahr),
      kurz: kurzJahr(band.jahr),
      mittePct: mitte(band, band),
      haupt: randjahr || band.anzahl >= HAUPTLABEL_AB,
    })
    i++
  }

  return labels
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

export type ProtokollFilter = 'alle' | 'marathon' | 'halbmarathon' | 'andere' | 'meilensteine'

export const PROTOKOLL_FILTER: ReadonlyArray<{ wert: ProtokollFilter, label: string }> = [
  { wert: 'alle', label: 'Alle' },
  { wert: 'marathon', label: 'Marathon' },
  { wert: 'halbmarathon', label: 'Halbmarathon' },
  { wert: 'andere', label: 'Andere Distanzen' },
  { wert: 'meilensteine', label: 'Meilensteine' },
]

/**
 * Filter nach Kategorie und Freitext. Anders als bei den Kennzahlen zeigt „Marathon“ hier alle
 * Einträge über 42,2 km, auch die Staffel: Die Liste soll nichts verstecken, die Markierung
 * am Eintrag erklärt, warum er nicht mitzählt.
 *
 * „Andere Distanzen“ ist alles mit Distanz außer 21,1 und 42,2 km: 5 bis 72,7 km, Triathlon-
 * Laufanteile eingeschlossen. So deckt jeder Lauf genau einen der drei Distanzfilter ab.
 */
export function filterLaeufe(laeufe: readonly Lauf[], filter: ProtokollFilter, suche: string): Lauf[] {
  const begriff = suche.trim().toLocaleLowerCase('de')

  return laeufe.filter((lauf) => {
    if (filter === 'marathon' && lauf.distanzKm !== MARATHON_KM) return false
    if (filter === 'halbmarathon' && lauf.distanzKm !== HALBMARATHON_KM) return false
    if (filter === 'andere' && (lauf.distanzKm === null || lauf.distanzKm === MARATHON_KM || lauf.distanzKm === HALBMARATHON_KM)) return false
    if (filter === 'meilensteine' && lauf.art !== 'meilenstein') return false
    if (!begriff) return true

    return [lauf.titel, lauf.notiz ?? '', String(lauf.jahr)]
      .some(text => text.toLocaleLowerCase('de').includes(begriff))
  })
}

export type SortFeld = 'datum' | 'zeit'
export type SortRichtung = 'auf' | 'ab'

/**
 * Datum: chronologisch. Zeit: Rangliste, schnellste zuerst bei `auf`. Einträge ohne Zeit (DNS,
 * Meilensteine) stehen bei der Zeitsortierung IMMER am Ende, in beiden Richtungen; sonst
 * führten sie die absteigende Liste an. Gleichstand: der frühere Lauf zuerst.
 */
export function sortiereLaeufe(laeufe: readonly Lauf[], feld: SortFeld, richtung: SortRichtung): Lauf[] {
  const faktor = richtung === 'auf' ? 1 : -1

  return [...laeufe].sort((a, b) => {
    if (feld === 'zeit') {
      if (a.sekunden === null || b.sekunden === null) {
        if (a.sekunden === b.sekunden) return a.datum.localeCompare(b.datum)
        return a.sekunden === null ? 1 : -1
      }
      return (a.sekunden - b.sekunden) * faktor || a.datum.localeCompare(b.datum)
    }
    return (a.datum.localeCompare(b.datum) || a.id - b.id) * faktor
  })
}

/**
 * Nach Jahr gruppiert, innerhalb des Jahres die Reihenfolge der Eingabe.
 *
 * @param richtung `ab` = neuestes Jahr zuerst (Standard), `auf` = ab dem ersten Lauf.
 */
export function gruppiereNachJahr(
  laeufe: readonly Lauf[],
  richtung: SortRichtung = 'ab',
): Array<{ jahr: number, laeufe: Lauf[] }> {
  const gruppen = new Map<number, Lauf[]>()
  for (const lauf of laeufe) {
    gruppen.set(lauf.jahr, [...(gruppen.get(lauf.jahr) ?? []), lauf])
  }
  return [...gruppen.entries()]
    .sort(([a], [b]) => richtung === 'ab' ? b - a : a - b)
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
 * der Besucher auf dieser Seite bleibt. Zwei Formen:
 *
 * - WordPress-Adresse: `blog.` oder `www.` plus genau ein Pfadsegment (die alte Tabelle).
 * - Adresse dieser Seite: `eduard-andrae.de/blog/<slug>` (so trägt Eddy neue Läufe ein).
 *
 * Die nackte Domain mit einem Segment (`eduard-andrae.de/statistik`) ist eine Seite dieser
 * Website und kein Beitrag, deshalb `null`. Alles andere (Kategorien, Bilder, fremde Seiten)
 * bleibt ebenfalls, wie es ist.
 *
 * @returns den internen Pfad, oder `null` für einen externen Link.
 */
export function internerBlogPfad(url: string | null): string | null {
  if (!url) return null
  const wordpress = /^https?:\/\/(?:www\.|blog\.)eduard-andrae\.de\/([a-z0-9\-_%]+)\/?$/i.exec(url)
  const eigen = /^https?:\/\/(?:www\.)?eduard-andrae\.de\/blog\/([a-z0-9\-_%]+)\/?$/i.exec(url)
  const slug = wordpress?.[1] ?? eigen?.[1]
  return slug ? `/blog/${slug.toLowerCase()}` : null
}
