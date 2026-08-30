import type { CvStation } from '#shared/types/cv'

/**
 * Rechenkern der Jahresachse über dem Werdegang (CvYearAxis.vue).
 *
 * Bewusst als pure Funktionen ohne DOM und ohne Vue: `vitest.config.ts` läuft im
 * Node-Environment, ohne happy-dom. Was hier steht, ist damit direkt testbar; die
 * Komponente daneben bleibt reine Darstellung.
 */

/** Ein Balken auf der Achse. Alle Maße in Prozent der Achsenbreite. */
export interface CvAxisSegment {
  /** Stabiler Schlüssel, identisch mit dem der Timeline: `${company}-${startYear}`. */
  key: string
  station: CvStation
  startYear: number
  /** Effektives Ende — bei laufenden Stationen das Referenzjahr. */
  endYear: number
  /** Spur (0-basiert). Überlappende Stationen landen in verschiedenen Spuren. */
  lane: number
  /** Abstand vom linken Achsenrand in Prozent. */
  offsetPct: number
  /** Breite in Prozent; nie 0, damit auch Ein-Jahres-Stationen sichtbar bleiben. */
  widthPct: number
  /**
   * Ist der Balken breit genug für den Firmennamen?
   *
   * Ohne diese Prüfung schneidet der Balken den Namen zu unlesbaren Stummeln ab
   * ("Halt…", "Strö…", "t…") — real beobachtet. Ein kurzer Balken bleibt lieber
   * ohne Beschriftung: Der Name steht ohnehin in der Timeline darunter, im
   * `title` des Balkens und in seinem aria-label.
   */
  showLabel: boolean
  current: boolean
}

export interface CvAxisModel {
  segments: CvAxisSegment[]
  ticks: CvAxisTick[]
  minYear: number
  maxYear: number
  /** Anzahl belegter Spuren — die Komponente leitet daraus ihre Höhe ab. */
  laneCount: number
}

export interface CvAxisTick {
  year: number
  /** Betonter Index alle 5 Jahre, wie auf dem Zifferblatt im Intro. */
  major: boolean
  /**
   * Volles Jahrzehnt. Auf schmalen Screens ist nur dafür Platz — bei 375 px
   * klebten die Fünfjahres-Zahlen sonst aneinander ("19901995"), real beobachtet.
   */
  decade: boolean
  offsetPct: number
}

/**
 * Ab welcher Balkenbreite (in Prozent der Achse) ein Firmenname hineinpasst.
 *
 * 12 % sind auf der maximalen Containerbreite (~1200 px) rund 144 px — genug für
 * etwa 14 Zeichen in 12px-Mono. Darunter wird der Name abgeschnitten statt gelesen.
 * Unterhalb von 768 px sind die Namen ohnehin komplett ausgeblendet (CvYearAxis.vue).
 */
const LABEL_MIN_WIDTH_PCT = 12

/** Schlüssel einer Station. Muss mit CvTimeline.vue übereinstimmen. */
export function stationKey(station: CvStation): string {
  return `${station.company}-${station.startYear}`
}

/**
 * Effektives Endjahr: `endYear`, sonst das Referenzjahr (die Station läuft noch).
 *
 * Defensiv gegen ein Endjahr vor dem Startjahr — bei einem Tippfehler in cv.ts soll die
 * Achse einen Balken minimaler Länge zeichnen, nicht einen negativen.
 */
function effectiveEnd(station: CvStation, nowYear: number): number {
  return Math.max(station.startYear, station.endYear ?? nowYear)
}

/**
 * Dauer als deutscher Text: "8 Jahre", "1 Jahr", "unter einem Jahr".
 *
 * Laufende Stationen (ohne `endYear`) rechnen gegen das Referenzjahr, das die Seite per
 * `useState` aus dem SSR-Payload übernimmt — nie gegen ein frisches `new Date()`.
 */
export function formatDuration(station: CvStation, nowYear: number): string {
  const years = effectiveEnd(station, nowYear) - station.startYear

  if (years <= 0) return 'unter einem Jahr'
  if (years === 1) return '1 Jahr'
  return `${years} Jahre`
}

/**
 * Verteilt die Stationen per Greedy-First-Fit auf Spuren.
 *
 * Nötig, weil sich die Stationen ÜBERLAPPEN: trusted blogs läuft seit 2016, team neusta
 * seit 2018, und 2015—2016 lief die Product-Owner-Station parallel zum Aufbau. Auf einer
 * einzigen Reihe würden sie sich still überzeichnen.
 *
 * Verfahren: nach Startjahr aufsteigend sortieren, dann jede Station in die erste Spur
 * legen, deren letzter Balken spätestens am Startjahr endet.
 *
 * Wichtig ist das `<=`: Balken, die sich an einem Jahr BERÜHREN (1991—1999 und 1999—2006),
 * bleiben damit in derselben Spur. Mit `<` wäre jede Übergabe eine Überlappung, und die
 * sequenziellen Stationen würden über die ganze Achse zwischen zwei Spuren zickzacken —
 * an den echten Daten nachgerechnet. So bleibt der Werdegang eine durchgehende Linie, und
 * nur die eine echte Parallel-Station (team neusta seit 2018 neben trusted blogs seit 2016)
 * rückt eine Spur nach unten. Dass sich berührende Balken optisch nicht verkleben, löst die
 * Komponente mit einem Abstand am rechten Balkenrand — das ist Darstellung, nicht Layout.
 */
export function assignLanes(stations: CvStation[], nowYear: number): number[] {
  /** Letztes belegtes Jahr je Spur. */
  const laneEnds: number[] = []

  return stations.map((station) => {
    const start = station.startYear
    const end = effectiveEnd(station, nowYear)

    let lane = laneEnds.findIndex(laneEnd => laneEnd <= start)
    if (lane === -1) lane = laneEnds.length

    laneEnds[lane] = end
    return lane
  })
}

/**
 * Baut das vollständige Achsenmodell.
 *
 * Der Zeitraum spannt vom frühesten Startjahr bis zum spätesten Ende, auf volle 5 Jahre
 * nach außen gerundet — so fällt der letzte Balken nie mit dem Achsenrand zusammen.
 * Bei leerer Stationsliste kommt ein leeres Modell zurück, kein Division-durch-null.
 */
export function buildAxisModel(stations: CvStation[], nowYear: number): CvAxisModel {
  if (stations.length === 0) {
    return { segments: [], ticks: [], minYear: nowYear, maxYear: nowYear, laneCount: 0 }
  }

  const ordered = [...stations].sort((a, b) => a.startYear - b.startYear)
  const lanes = assignLanes(ordered, nowYear)

  const earliest = Math.min(...ordered.map(s => s.startYear))
  const latest = Math.max(...ordered.map(s => effectiveEnd(s, nowYear)))

  const minYear = Math.floor(earliest / 5) * 5
  const maxYear = Math.ceil(latest / 5) * 5
  const span = maxYear - minYear

  const toPct = (year: number) => ((year - minYear) / span) * 100

  const segments: CvAxisSegment[] = ordered.map((station, i) => {
    const endYear = effectiveEnd(station, nowYear)
    const offsetPct = toPct(station.startYear)
    // Mindestbreite, damit eine Station von einem Jahr nicht zum Strich zusammenfällt.
    const widthPct = Math.max(toPct(endYear) - offsetPct, 1.5)

    return {
      key: stationKey(station),
      station,
      startYear: station.startYear,
      endYear,
      lane: lanes[i] ?? 0,
      offsetPct,
      widthPct,
      showLabel: widthPct >= LABEL_MIN_WIDTH_PCT,
      current: station.endYear === undefined,
    }
  })

  const ticks: CvAxisTick[] = []
  for (let year = minYear; year <= maxYear; year++) {
    ticks.push({ year, major: year % 5 === 0, decade: year % 10 === 0, offsetPct: toPct(year) })
  }

  return {
    segments,
    ticks,
    minYear,
    maxYear,
    laneCount: lanes.length === 0 ? 0 : Math.max(...lanes) + 1,
  }
}
