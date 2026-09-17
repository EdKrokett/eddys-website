/**
 * Typen der Werkbank-Seite (`app/pages/werkbank.vue`).
 *
 * Konzept, Quellen und die Begründung für jede Zahl: `docs/werkbank.md`.
 */

/**
 * Ein Make-Szenario mit seinen Kennzahlen.
 *
 * `modules` ist die tragende Zahl, nicht `runs`: Eine Promotion ist kein Massenprozess,
 * die Laufzahlen sind dreistellig. Bemerkenswert ist die Komplexität eines einzelnen
 * Ablaufs — 115 Module in einer Kette, verdrahtet ohne eine Zeile Code.
 */
export interface WerkbankScenario {
  name: string
  /** Anzahl der Module im Szenario — steuert auch die Balkenlänge in der Tabelle. */
  modules: number
  runs: number
  operations: number
}

/**
 * Ein Werkzeug mit seiner Rolle.
 *
 * Bewusst mit `role` statt als Logo-Leiste: Eine Reihe fremder Markenlogos ist genau
 * die generische Ästhetik, die diese Seite vermeidet — und sie sagt nichts darüber,
 * wofür das Werkzeug eigentlich gut ist.
 */
export interface WerkbankTool {
  name: string
  role: string
}

/** Eine Lektion aus der Praxis — Titel plus das, was dabei schiefging. */
export interface WerkbankLesson {
  title: string
  text: string
}

/** Eine Kennzahl in der Datenleiste: großer Wert, kleines Label. */
export interface WerkbankMetric {
  value: string
  label: string
  /** Hebt den Wert farblich hervor — für die eine Zahl, auf die es ankommt. */
  accent?: boolean
}

/**
 * Eine Seite im Balkenvergleich „Altsystem gegen Neubau".
 *
 * `commits` und `months` sind die Rohwerte; die Balkenlänge wird daraus gerechnet,
 * nicht als Prozentzahl gepflegt — sonst laufen Zahl und Balken auseinander.
 */
export interface WerkbankBuild {
  label: string
  period: string
  commits: number
  months: number
  /** Der Neubau wird farblich abgesetzt, das Altsystem bleibt zurückgenommen. */
  current?: boolean
}

/**
 * Ein ausgestelltes Bild in der Vitrine — Screenshot mit allem, was der Rahmen braucht.
 *
 * `width` und `height` sind Pflicht, nicht optional: Ohne sie reserviert der Browser
 * keinen Platz, und das Layout springt, sobald das Bild nachlädt oder ausfällt.
 *
 * `href` unterscheidet die beiden Vitrinen der Seite. Ist es gesetzt, führt das Bild
 * nach außen zum Original; fehlt es, öffnet ein Klick die Lightbox. Das ist keine
 * Kosmetik, sondern folgt dem Inhalt: Ein Make-Szenario mit 115 Modulen ist bei
 * Seitenbreite unlesbar und braucht Zoom. Eine Website wird durch Zoom nicht
 * aussagekräftiger — ihre Vergrößerung ist das Original.
 */
export interface WerkbankShot {
  src: string
  width: number
  height: number
  alt: string
  /** Ziel des Bildlinks. Fehlt es, bekommt das Bild stattdessen eine Lightbox. */
  href?: string
}
