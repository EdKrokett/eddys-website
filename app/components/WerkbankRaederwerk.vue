<script setup lang="ts">
import type { MeshedGear, Point } from '~/utils/raederwerk'

/**
 * Das Räderwerk im Intro der Seite „trusted blogs“: eine Konstruktionszeichnung, die rechts
 * hinter Überschrift und Faksimile liegt und nach links und unten ausblendet.
 *
 * Konzept und Begründung in `docs/werkbank.md` („Das Räderwerk im Intro“). Kurz: Es
 * verbindet Uhrmacher-Herkunft und Automatisierung. Die Räder drehen sich von selbst, sehr
 * langsam, so wie im Intro steht, dass alles abläuft, „ohne dass jemand es anstößt“.
 *
 * Aufbau in zwei Ebenen:
 * - `.raederwerk__plan`: ein statisches SVG mit allem, was sich nicht dreht — Raster,
 *   Teilkreise, Mittellinien, Maßlinie, Beschriftung, Schriftfeld.
 * - `.raederwerk__arbor`: je Welle ein eigenes Element mit eigenem SVG. Gedreht wird das
 *   Element per CSS-`transform`, damit der Compositor die Drehung übernimmt und das SVG
 *   nicht in jedem Frame neu gezeichnet werden muss.
 *
 * Beide Ebenen teilen das Koordinatensystem `VIEW × VIEW`; die Wellen werden in Prozent
 * davon positioniert. Das funktioniert, weil der Rahmen quadratisch ist (`aspect-ratio: 1`).
 */

/** Seitenlänge des gemeinsamen Koordinatensystems. */
const VIEW = 900
/** Gemeinsamer Modul aller Räder; ohne gleichen Modul kämmen sie nicht. */
const MODULE = 5
/** Eine Umdrehung des großen Rads in Sekunden. Langsam genug, dass man es erst beim zweiten Hinsehen bemerkt. */
const DRIVER_SECONDS = 720

/*
 * Das Getriebe: großes Rad A treibt Ritzel B (auf derselben Welle Rad B2), B2 treibt
 * Ritzel C (mit Rad C2), und A treibt außerdem Rad E nach links unten. Die Winkel geben
 * an, in welche Richtung das jeweils getriebene Rad vom treibenden aus liegt.
 */
const centerA: Point = { x: 560, y: 400 }
const gearA: MeshedGear = { teeth: 72, phase: 0 }

const angleB = -50
const centerB = meshCenter(centerA, centerDistance(72, 18, MODULE), angleB)
const gearB: MeshedGear = { teeth: 18, phase: meshPhase(gearA, 18, angleB) }
const gearB2: MeshedGear = { teeth: 36, phase: 4 }

const angleC = 40
const centerC = meshCenter(centerB, centerDistance(36, 15, MODULE), angleC)
const gearC: MeshedGear = { teeth: 15, phase: meshPhase(gearB2, 15, angleC) }
const gearC2: MeshedGear = { teeth: 30, phase: 0 }

const angleE = 135
const centerE = meshCenter(centerA, centerDistance(72, 40, MODULE), angleE)
const gearE: MeshedGear = { teeth: 40, phase: meshPhase(gearA, 40, angleE) }

const secondsB = turnSeconds(DRIVER_SECONDS, 72, 18)

interface ArborPart {
  path: string
  /** Liegt unter dem Rad derselben Welle: gestrichelt, wie eine verdeckte Kante. */
  hidden?: boolean
}

interface Arbor {
  key: string
  center: Point
  /** Größter Kopfkreis auf der Welle; bestimmt die Größe des Elements. */
  extent: number
  seconds: number
  /** Gegen den Uhrzeigersinn. Kämmende Räder drehen immer gegenläufig. */
  reverse: boolean
  parts: ArborPart[]
}

const arbors: Arbor[] = [
  {
    key: 'a',
    center: centerA,
    extent: tipRadius(72, MODULE),
    seconds: DRIVER_SECONDS,
    reverse: false,
    parts: [{ path: gearPath({ ...gearA, module: MODULE, spokes: 5, hubRadius: 30, boreRadius: 7 }) }],
  },
  {
    key: 'e',
    center: centerE,
    extent: tipRadius(40, MODULE),
    seconds: turnSeconds(DRIVER_SECONDS, 72, 40),
    reverse: true,
    parts: [{ path: gearPath({ ...gearE, module: MODULE, spokes: 5, hubRadius: 18, boreRadius: 5 }) }],
  },
  {
    key: 'b',
    center: centerB,
    extent: tipRadius(36, MODULE),
    seconds: secondsB,
    reverse: true,
    parts: [
      { path: gearPath({ ...gearB, module: MODULE }), hidden: true },
      { path: gearPath({ ...gearB2, module: MODULE, spokes: 4, hubRadius: 17, boreRadius: 5 }) },
    ],
  },
  {
    key: 'c',
    center: centerC,
    extent: tipRadius(30, MODULE),
    seconds: turnSeconds(secondsB, 36, 15),
    reverse: false,
    parts: [
      { path: gearPath({ ...gearC, module: MODULE }), hidden: true },
      { path: gearPath({ ...gearC2, module: MODULE, spokes: 4, hubRadius: 14, boreRadius: 4 }) },
    ],
  },
]

/** Lage und Größe einer Welle in Prozent des quadratischen Rahmens. */
function arborStyle(arbor: Arbor): Record<string, string> {
  const box = arbor.extent + 2
  const percent = (value: number) => `${(value / VIEW) * 100}%`

  return {
    'left': percent(arbor.center.x - box),
    'top': percent(arbor.center.y - box),
    'width': percent(box * 2),
    'height': percent(box * 2),
    '--turn': `${arbor.seconds}s`,
    '--direction': arbor.reverse ? 'reverse' : 'normal',
  }
}

/** Teilkreise aller Räder, gestrichelt: Auf ihnen rollen die Räder aufeinander ab. */
const pitchCircles = [
  { center: centerA, r: pitchRadius(72, MODULE) },
  { center: centerB, r: pitchRadius(18, MODULE) },
  { center: centerB, r: pitchRadius(36, MODULE) },
  { center: centerC, r: pitchRadius(15, MODULE) },
  { center: centerC, r: pitchRadius(30, MODULE) },
  { center: centerE, r: pitchRadius(40, MODULE) },
]

/** Mittelkreuze der kleineren Wellen; das große Rad bekommt durchgehende Mittellinien. */
const centerMarks = [
  { center: centerB, size: tipRadius(36, MODULE) + 14 },
  { center: centerC, size: tipRadius(30, MODULE) + 14 },
  { center: centerE, size: tipRadius(40, MODULE) + 14 },
]

const labels = [
  { center: centerA, text: 'z 72' },
  { center: centerB, text: 'z 18 / 36' },
  { center: centerC, text: 'z 15 / 30' },
  { center: centerE, text: 'z 40' },
]

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** Winkelbogen am großen Rad, von der Mittellinie bis zur Achslinie nach B. */
const angleArc = (() => {
  const radius = 64
  const end = meshCenter(centerA, radius, angleB)
  const label = meshCenter(centerA, radius + 16, angleB / 2)

  return {
    path: `M ${centerA.x + radius} ${centerA.y} A ${radius} ${radius} 0 0 0 ${round(end.x)} ${round(end.y)}`,
    label: { x: round(label.x), y: round(label.y) },
    text: `${Math.abs(angleB)}°`,
  }
})()

/**
 * Maßlinie für den Achsabstand A–B, parallel versetzt zur Achslinie nach links oben,
 * mit Schrägstrichen an den Enden wie in einer Bauzeichnung.
 */
const dimension = (() => {
  const offset = 34
  const normalAngle = angleB - 90
  const from = meshCenter(centerA, offset, normalAngle)
  const to = meshCenter(centerB, offset, normalAngle)
  const mid = meshCenter({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, 8, normalAngle)
  const tick = (point: Point) => {
    const a = meshCenter(point, 6, angleB - 45)
    const b = meshCenter(point, 6, angleB + 135)

    return `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`
  }

  return {
    line: `M ${round(from.x)} ${round(from.y)} L ${round(to.x)} ${round(to.y)}`,
    // Hilfslinien von den Wellen bis knapp über die Maßlinie.
    extensions: [centerA, centerB].map((point) => {
      const end = meshCenter(point, offset + 8, normalAngle)

      return `M ${round(point.x)} ${round(point.y)} L ${round(end.x)} ${round(end.y)}`
    }).join(' '),
    ticks: `${tick(from)} ${tick(to)}`,
    label: { x: round(mid.x), y: round(mid.y), rotate: angleB },
    text: `a ${centerDistance(72, 18, MODULE)}`,
  }
})()

const axisLines = [
  [centerA, centerB],
  [centerB, centerC],
  [centerA, centerE],
].map(([from, to]) => `M ${round(from!.x)} ${round(from!.y)} L ${round(to!.x)} ${round(to!.y)}`).join(' ')
</script>

<template>
  <div class="raederwerk" aria-hidden="true">
    <svg class="raederwerk__plan" :viewBox="`0 0 ${VIEW} ${VIEW}`" fill="none">
      <defs>
        <pattern id="raederwerk-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" class="raederwerk__grid" />
        </pattern>
        <radialGradient id="raederwerk-grid-fade" cx="0.66" cy="0.44" r="0.5">
          <stop offset="0.2" stop-color="#fff" />
          <stop offset="1" stop-color="#000" />
        </radialGradient>
        <mask id="raederwerk-grid-mask">
          <rect :width="VIEW" :height="VIEW" fill="url(#raederwerk-grid-fade)" />
        </mask>
      </defs>

      <rect :width="VIEW" :height="VIEW" fill="url(#raederwerk-grid)" mask="url(#raederwerk-grid-mask)" />

      <!-- Mittellinien durch die Hauptwelle, strichpunktiert wie in der Norm. -->
      <path
        class="raederwerk__centerline"
        :d="`M ${centerA.x - 250} ${centerA.y} H ${VIEW} M ${centerA.x} ${centerA.y - 250} V ${centerA.y + 250}`"
      />
      <path
        v-for="(mark, index) in centerMarks"
        :key="`mark-${index}`"
        class="raederwerk__centerline"
        :d="`M ${round(mark.center.x - mark.size)} ${round(mark.center.y)} h ${mark.size * 2}`
          + ` M ${round(mark.center.x)} ${round(mark.center.y - mark.size)} v ${mark.size * 2}`"
      />

      <path class="raederwerk__axis" :d="axisLines" />

      <circle
        v-for="(circle, index) in pitchCircles"
        :key="`pitch-${index}`"
        class="raederwerk__pitch"
        :cx="round(circle.center.x)"
        :cy="round(circle.center.y)"
        :r="circle.r"
      />

      <path class="raederwerk__dim" :d="angleArc.path" />
      <text class="raederwerk__label" :x="angleArc.label.x" :y="angleArc.label.y" dominant-baseline="middle">
        {{ angleArc.text }}
      </text>

      <path class="raederwerk__dim" :d="`${dimension.line} ${dimension.extensions} ${dimension.ticks}`" />
      <text
        class="raederwerk__label"
        :transform="`translate(${dimension.label.x} ${dimension.label.y}) rotate(${dimension.label.rotate})`"
        text-anchor="middle"
      >
        {{ dimension.text }}
      </text>

      <text
        v-for="label in labels"
        :key="label.text"
        class="raederwerk__label"
        :x="round(label.center.x + 10)"
        :y="round(label.center.y - 10)"
      >
        {{ label.text }}
      </text>

      <!-- Schriftfeld unten rechts, wie auf jedem Zeichnungsblatt. -->
      <g class="raederwerk__titleblock" transform="translate(520 800)">
        <rect width="280" height="72" />
        <path d="M 0 24 H 280 M 0 48 H 280 M 196 24 V 72" />
        <text x="10" y="16">TRUSTED BLOGS · NEUBAU</text>
        <text x="10" y="40">RÄDERWERK</text>
        <text x="206" y="40">M 1:1</text>
        <text x="10" y="64">02 – 05 / 2026</text>
        <text x="206" y="64">BLATT 01</text>
      </g>
    </svg>

    <div
      v-for="arbor in arbors"
      :key="arbor.key"
      class="raederwerk__arbor"
      :style="arborStyle(arbor)"
    >
      <svg :viewBox="`${-(arbor.extent + 2)} ${-(arbor.extent + 2)} ${(arbor.extent + 2) * 2} ${(arbor.extent + 2) * 2}`">
        <path
          v-for="(part, index) in arbor.parts"
          :key="index"
          :d="part.path"
          class="raederwerk__gear"
          :class="{ 'raederwerk__gear--hidden': part.hidden }"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/*
  Rechts angeschlagen und über den Rand hinaus: Das Werk soll angeschnitten wirken, als
  sähe man nur einen Ausschnitt eines größeren Blatts. Die Maske blendet nach links (zum
  Text hin) und nach unten aus; was übrig bleibt, ist eine Andeutung, kein Bild.
*/
.raederwerk {
  position: absolute;
  /* Tief genug, dass die Räder unter der Überschrift beginnen und nicht an ihr kleben. */
  top: 5rem;
  right: -4rem;
  width: min(64vw, 60rem);
  aspect-ratio: 1;
  pointer-events: none;
  user-select: none;
  opacity: 0.8;
  mask-image:
    linear-gradient(to right, transparent 8%, rgba(0, 0, 0, 0.3) 38%, #000 72%),
    linear-gradient(to bottom, #000 70%, transparent 100%);
  mask-composite: intersect;
}

.raederwerk__plan {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.raederwerk__plan * {
  vector-effect: non-scaling-stroke;
}

.raederwerk__grid {
  stroke: var(--color-graphite-700);
  stroke-width: 1;
  fill: none;
}

/* Strichpunkt nach DIN: langer Strich, Lücke, Punkt, Lücke. */
.raederwerk__centerline {
  stroke: var(--color-steel-600);
  stroke-width: 1;
  stroke-dasharray: 14 4 2 4;
  opacity: 0.55;
}

.raederwerk__axis {
  stroke: var(--color-steel-600);
  stroke-width: 1;
  opacity: 0.4;
}

.raederwerk__pitch {
  stroke: var(--color-accent-500);
  stroke-width: 1;
  stroke-dasharray: 3 5;
  opacity: 0.35;
}

.raederwerk__dim {
  stroke: var(--color-steel-500);
  stroke-width: 1;
  opacity: 0.6;
}

.raederwerk__label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  fill: var(--color-steel-500);
  opacity: 0.8;
}

.raederwerk__titleblock rect,
.raederwerk__titleblock path {
  stroke: var(--color-steel-600);
  stroke-width: 1;
  opacity: 0.7;
}

.raederwerk__titleblock text {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  fill: var(--color-steel-500);
}

.raederwerk__arbor {
  position: absolute;
}

.raederwerk__arbor svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/*
  Haarlinie in Teal, Fläche nur ein Hauch davon. Weil die Flächen fast durchsichtig sind,
  scheinen überlappende Räder durcheinander durch — gewollt, so liest es sich als
  Durchsicht-Zeichnung statt als Foto eines Uhrwerks.
*/
.raederwerk__gear {
  fill: var(--color-accent-500);
  fill-opacity: 0.045;
  fill-rule: evenodd;
  stroke: var(--color-accent-400);
  stroke-width: 1;
  stroke-opacity: 0.6;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.raederwerk__gear--hidden {
  fill: none;
  stroke-dasharray: 3 3;
  stroke-opacity: 0.4;
}

@media (prefers-reduced-motion: no-preference) {
  .raederwerk__arbor {
    will-change: transform;
    animation: raederwerk-turn var(--turn) linear infinite var(--direction);
  }
}

@keyframes raederwerk-turn {
  to {
    transform: rotate(360deg);
  }
}

/*
  Auf schmalen Bildschirmen steht der Text über die ganze Breite. Das Werk rückt deshalb
  nach rechts oben aus dem Bild und wird noch leiser, damit es hinter Überschrift und
  Fließtext nur noch als Struktur zu ahnen ist.
*/
@media (max-width: 767px) {
  .raederwerk {
    top: -2rem;
    right: -55vw;
    width: 130vw;
    opacity: 0.5;
    mask-image:
      linear-gradient(to right, transparent 0%, #000 45%),
      linear-gradient(to bottom, #000 55%, transparent 85%);
  }
}
</style>
