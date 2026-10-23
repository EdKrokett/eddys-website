/**
 * Geometrie für das Räderwerk im Intro der Seite „trusted blogs“
 * (`app/components/WerkbankRaederwerk.vue`, Konzept in `docs/werkbank.md`).
 *
 * Bewusst echte Zahnradgeometrie statt frei gezeichneter Kreise mit Zacken: Die Räder
 * drehen sich gegeneinander, und nur wenn Modul, Achsabstand und Zahnphase stimmen,
 * greift jeder Zahn sauber in eine Lücke, statt sichtbar durch das Nachbarrad zu laufen.
 *
 * Alle Winkel in Grad, gemessen im Uhrzeigersinn ab der positiven x-Achse, weil SVG
 * die y-Achse nach unten zählt. Damit entspricht ein positiver Winkel genau der
 * Drehrichtung von CSS `rotate()`.
 */

export interface Point {
  x: number
  y: number
}

/** Ein Rad, wie es auf der Zeichnung steht: Zähnezahl und Lage des ersten Zahns. */
export interface MeshedGear {
  teeth: number
  /** Winkel des ersten Zahns in Grad. */
  phase: number
}

export interface GearShape {
  teeth: number
  /** Modul m: Teilkreisdurchmesser geteilt durch Zähnezahl. Gleich für kämmende Räder. */
  module: number
  /** Winkel des ersten Zahns in Grad. */
  phase?: number
  /** Anzahl der Speichen (Schenkel). 0 = volles Rad, wie bei einem Ritzel. */
  spokes?: number
  /** Radius der Nabe, an der die Speichen ansetzen. Nur mit `spokes > 0` relevant. */
  hubRadius?: number
  /** Radius der Bohrung für die Welle. 0 = keine Bohrung. */
  boreRadius?: number
}

/** Weniger Zähne ergeben kein erkennbares Zahnrad mehr, sondern einen Stern. */
export const MIN_TEETH = 6

const DEG = Math.PI / 180

function assertGear(teeth: number, module: number): void {
  if (!Number.isInteger(teeth) || teeth < MIN_TEETH) {
    throw new RangeError(`Zähnezahl muss eine ganze Zahl ≥ ${MIN_TEETH} sein, war ${teeth}`)
  }
  if (!Number.isFinite(module) || module <= 0) {
    throw new RangeError(`Modul muss eine positive Zahl sein, war ${module}`)
  }
}

/** Auf zwei Nachkommastellen, damit der Pfad im SSR-HTML nicht unnötig lang wird. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** Punkt auf einem Kreis um den Ursprung, Winkel in Bogenmaß. */
function polar(radius: number, angle: number): string {
  return `${round(radius * Math.cos(angle))} ${round(radius * Math.sin(angle))}`
}

/** Teilkreisradius r = m · z / 2. Auf diesem Kreis rollen zwei kämmende Räder ab. */
export function pitchRadius(teeth: number, module: number): number {
  assertGear(teeth, module)

  return (module * teeth) / 2
}

/** Kopfkreisradius: Teilkreis plus ein Modul. Die äußerste Kante des Rads. */
export function tipRadius(teeth: number, module: number): number {
  return pitchRadius(teeth, module) + module
}

/** Achsabstand zweier kämmender Räder: a = m · (z₁ + z₂) / 2. */
export function centerDistance(teethA: number, teethB: number, module: number): number {
  return pitchRadius(teethA, module) + pitchRadius(teethB, module)
}

/** Mittelpunkt eines Rads, das im Abstand `distance` unter dem Winkel `angle` liegt. */
export function meshCenter(center: Point, distance: number, angle: number): Point {
  return {
    x: center.x + distance * Math.cos(angle * DEG),
    y: center.y + distance * Math.sin(angle * DEG),
  }
}

/** Winkel auf [0, 360) normiert. */
function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360
}

/**
 * Phase des getriebenen Rads, damit es mit dem treibenden kämmt.
 *
 * Herleitung: Am Berührpunkt (Winkel θ vom treibenden Rad aus, θ + 180° vom getriebenen)
 * zählt man, wie viele Zahnteilungen der jeweils nächste Zahn entfernt ist: t₁ für das
 * treibende, t₂ für das getriebene Rad. Dreht das treibende um α, dreht das getriebene
 * um −α · z₁/z₂, und t₁ + t₂ bleibt dabei konstant. Steht beim treibenden ein Zahn am
 * Berührpunkt (t₁ ≡ 0), muss beim getriebenen eine Lücke stehen (t₂ ≡ ½). Also gilt
 * immer t₁ + t₂ ≡ ½, und daraus folgt die Phase. Weil die Summe konstant bleibt, kämmen
 * die Räder auch während der Drehung, solange die Drehzahlen im Verhältnis stehen.
 *
 * @param driver  Das treibende Rad.
 * @param drivenTeeth  Zähnezahl des getriebenen Rads.
 * @param angle  Richtung vom treibenden zum getriebenen Mittelpunkt, in Grad.
 * @returns Phase des getriebenen Rads in Grad, normiert auf [0, 360).
 */
export function meshPhase(driver: MeshedGear, drivenTeeth: number, angle: number): number {
  const driverPitch = 360 / driver.teeth
  const drivenPitch = 360 / drivenTeeth
  const t1 = (angle - driver.phase) / driverPitch

  return normalize(angle + 180 - (0.5 - t1) * drivenPitch)
}

/**
 * Drehdauer eines Rads, wenn das treibende Rad `driverSeconds` für eine Umdrehung braucht.
 * Das kleinere Rad dreht schneller, im Verhältnis der Zähnezahlen.
 */
export function turnSeconds(driverSeconds: number, driverTeeth: number, drivenTeeth: number): number {
  return (driverSeconds * drivenTeeth) / driverTeeth
}

/**
 * SVG-Pfad eines Zahnrads um den Ursprung, für `fill-rule: evenodd`.
 *
 * Besteht aus bis zu drei Teilpfaden: dem Zahnkranz, den Fenstern zwischen den Speichen
 * und der Bohrung. Mit `evenodd` werden Fenster und Bohrung zu Löchern, ohne dass es eine
 * Maske braucht.
 *
 * Die Zahnform ist die der Uhrmacherei, nicht die eines Maschinenbau-Zahnrads: gerade
 * Flanken bis zum Teilkreis, darüber ein gerundeter Kopf (Spitzbogen). Gleichmäßig auf
 * Zahn und Lücke verteilt, je eine halbe Teilung.
 */
export function gearPath(shape: GearShape): string {
  const { teeth, module, phase = 0, spokes = 0, hubRadius = 0, boreRadius = 0 } = shape
  const radius = pitchRadius(teeth, module)
  const tip = radius + module
  const root = radius - 1.25 * module
  const pitch = (2 * Math.PI) / teeth
  const halfTooth = pitch / 4
  const start = phase * DEG

  const parts: string[] = []
  let rim = `M ${polar(root, start - pitch / 2)}`
  for (let index = 0; index < teeth; index++) {
    const center = start + index * pitch
    rim += ` A ${round(root)} ${round(root)} 0 0 1 ${polar(root, center - halfTooth)}`
    rim += ` L ${polar(radius, center - halfTooth)}`
    rim += ` Q ${polar(tip, center - halfTooth)} ${polar(tip, center)}`
    rim += ` Q ${polar(tip, center + halfTooth)} ${polar(radius, center + halfTooth)}`
    rim += ` L ${polar(root, center + halfTooth)}`
    rim += ` A ${round(root)} ${round(root)} 0 0 1 ${polar(root, center + pitch / 2)}`
  }
  parts.push(`${rim} Z`)

  // Fenster nur, wenn zwischen Nabe und Kranz überhaupt Platz ist.
  const rimInner = root - Math.max(1.6 * module, radius * 0.07)
  const spokeHalf = Math.max(module * 0.9, radius * 0.035)
  if (spokes > 0 && hubRadius > spokeHalf && rimInner > hubRadius) {
    const step = (2 * Math.PI) / spokes
    // Konstante Speichenbreite: Am Kranz ist der Winkelabstand kleiner als an der Nabe.
    const outerGap = Math.asin(spokeHalf / rimInner)
    const innerGap = Math.asin(spokeHalf / hubRadius)
    for (let index = 0; index < spokes; index++) {
      const from = start + index * step
      const to = from + step
      const large = step - 2 * outerGap > Math.PI ? 1 : 0
      parts.push(
        `M ${polar(rimInner, from + outerGap)}`
        + ` A ${round(rimInner)} ${round(rimInner)} 0 ${large} 1 ${polar(rimInner, to - outerGap)}`
        + ` L ${polar(hubRadius, to - innerGap)}`
        + ` A ${round(hubRadius)} ${round(hubRadius)} 0 ${large} 0 ${polar(hubRadius, from + innerGap)} Z`,
      )
    }
  }

  if (boreRadius > 0) {
    const bore = round(boreRadius)
    parts.push(`M ${bore} 0 A ${bore} ${bore} 0 1 1 ${-bore} 0 A ${bore} ${bore} 0 1 1 ${bore} 0 Z`)
  }

  return parts.join(' ')
}
