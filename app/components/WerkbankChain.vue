<script setup lang="ts">
/**
 * Ein Make-Szenario, nachgezeichnet in der Bildsprache dieser Seite.
 *
 * Warum nachgezeichnet und nicht nur der Screenshot: Der echte Screenshot (daneben in
 * der Vitrine) beweist, DASS es das gibt — er ist mit 115 Modulen aber unlesbar klein.
 * Diese Zeichnung erklärt, WIE so eine Kette läuft. Beide zusammen, keins statt des
 * anderen.
 *
 * Reines SVG statt Bild: skaliert verlustfrei, kostet keinen Request, ist SSR-fest und
 * folgt automatisch den Farb-Tokens (`currentColor` bzw. CSS-Variablen im Stylesheet).
 *
 * Die Zeichnung ist eine EHRLICHE VEREINFACHUNG. Sie zeigt die Bauform — Kette,
 * Verzweigung, Zusammenführung —, nicht alle 115 Module. Das steht auch als
 * Bildunterschrift auf der Seite, damit die Zeichnung nicht als Vollbild missverstanden
 * wird.
 */

/** Waagerechter Abstand zwischen zwei Knoten der Hauptkette. */
const STEP_X = 132
/** Erster Knoten mit Abstand vom linken Rand, damit der Beschriftungstext Platz hat. */
const START_X = 62
/** Mittellinie: Die Hauptkette läuft waagerecht, die Zweige spreizen sich darum. */
const MID_Y = 104
/** Senkrechter Abstand der Zweige zueinander. */
const BRANCH_GAP = 62

/** Die Hauptkette bis zur Verzweigung. */
const trunk = [
  { label: 'Auslöser', note: 'neue Zeile' },
  { label: 'Daten', note: 'Sheets' },
  { label: 'Text', note: 'KI' },
  { label: 'Bild', note: 'Placid' },
]

/** Die Zweige hinter dem Verteiler — je ein Netzwerk. */
const branches = ['LinkedIn', 'Facebook', 'Pinterest', 'X']

/** Waagerechte Position eines Kettenknotens. */
function trunkX(index: number): number {
  return START_X + index * STEP_X
}

/** Der Verteiler sitzt einen Schritt hinter dem letzten Kettenknoten. */
const routerX = trunkX(trunk.length)

/**
 * Senkrechte Position eines Zweigs, symmetrisch um die Mittellinie.
 *
 * Bei vier Zweigen liegen zwei über und zwei unter der Kette; die Mitte bleibt frei,
 * damit die Hauptlinie sichtbar durchläuft.
 */
function branchY(index: number): number {
  const offset = index - (branches.length - 1) / 2

  return MID_Y + offset * BRANCH_GAP
}

/** Endpunkt der Zweige — alle gleich weit rechts, damit die Kanten bündig stehen. */
const branchX = routerX + STEP_X

/**
 * Verbindung vom Verteiler zu einem Zweig als weiche Kurve.
 *
 * Kubische Bézier mit senkrechten Kontrollpunkten auf halber Strecke: Das ergibt den
 * S-Bogen, den Make selbst zeichnet, statt eines Knicks.
 */
function branchPath(index: number): string {
  const y = branchY(index)
  const midX = (routerX + branchX) / 2

  return `M ${routerX} ${MID_Y} C ${midX} ${MID_Y}, ${midX} ${y}, ${branchX} ${y}`
}

/**
 * Platz rechts für die Zweigbeschriftung.
 *
 * Die Labels beginnen bei `branchX + 20` und laufen nach rechts. Das längste ist
 * „Pinterest“: neun Zeichen JetBrains Mono auf 12px mit 0,08em Sperrung, also rund
 * 70px. Zu knapp bemessen schneidet die viewBox sie ab, ohne dass etwas überläuft —
 * genau das ist hier beim ersten Anlauf passiert („LinkedI“, „Faceboo“).
 */
const LABEL_SPACE = 110

const viewBoxWidth = branchX + LABEL_SPACE
const viewBoxHeight = MID_Y * 2
</script>

<template>
  <figure class="chain">
    <div class="chain__scroll">
      <svg
        class="chain__svg"
        :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
        role="img"
        aria-label="Ablauf eines Szenarios: Auslöser, Daten, Text, Bild, dann ein Verteiler auf LinkedIn, Facebook, Pinterest und X."
      >
        <!-- Hauptlinie: durchgehend vom ersten Knoten bis zum Verteiler. -->
        <line
          class="chain__line"
          :x1="trunkX(0)"
          :y1="MID_Y"
          :x2="routerX"
          :y2="MID_Y"
        />

        <!-- Zweige: erst die Kurven, damit die Knoten darüber liegen. -->
        <path
          v-for="(branch, i) in branches"
          :key="`path-${branch}`"
          class="chain__line chain__line--branch"
          :d="branchPath(i)"
          :style="{ '--delay': `${520 + i * 90}ms` }"
        />

        <!-- Kettenknoten -->
        <g
          v-for="(node, i) in trunk"
          :key="node.label"
          class="chain__node"
          :style="{ '--delay': `${i * 110}ms` }"
        >
          <circle class="chain__dot" :cx="trunkX(i)" :cy="MID_Y" r="13" />
          <text class="chain__label" :x="trunkX(i)" :y="MID_Y - 26">{{ node.label }}</text>
          <text class="chain__note" :x="trunkX(i)" :y="MID_Y + 34">{{ node.note }}</text>
        </g>

        <!-- Verteiler: als Raute abgesetzt, weil er etwas anderes tut als ein Modul. -->
        <g class="chain__node chain__node--router" :style="{ '--delay': `${trunk.length * 110}ms` }">
          <rect
            class="chain__dot chain__dot--router"
            :x="routerX - 12"
            :y="MID_Y - 12"
            width="24"
            height="24"
            :transform="`rotate(45 ${routerX} ${MID_Y})`"
          />
          <text class="chain__label" :x="routerX" :y="MID_Y - 30">Verteiler</text>
        </g>

        <!-- Zweigenden -->
        <g
          v-for="(branch, i) in branches"
          :key="branch"
          class="chain__node"
          :style="{ '--delay': `${760 + i * 90}ms` }"
        >
          <circle class="chain__dot chain__dot--leaf" :cx="branchX" :cy="branchY(i)" r="10" />
          <text class="chain__label chain__label--leaf" :x="branchX + 20" :y="branchY(i) + 4">
            {{ branch }}
          </text>
        </g>
      </svg>
    </div>

    <figcaption class="chain__caption">
      Die Bauform, nicht der Vollbestand: Das echte Szenario hat 115 Module.
    </figcaption>
  </figure>
</template>

<style scoped>
.chain {
  margin: 0;
}

/*
  Die Zeichnung hat ein festes Seitenverhältnis und wird unter ~620px unleserlich.
  Statt sie weiter zu stauchen, darf sie waagerecht scrollen — dieselbe Ausnahme, die
  in main.css für Tabellen und Codeblöcke gilt. Der Seitenkörper scrollt dadurch nicht.
*/
.chain__scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.chain__svg {
  display: block;
  width: 100%;
  min-width: 38rem;
  height: auto;
}

/* ── Linien ─────────────────────────────────────────────────────────────────── */
.chain__line {
  fill: none;
  stroke: var(--color-graphite-600);
  stroke-width: 1;
}

.chain__line--branch {
  stroke-dasharray: 3 4;
  stroke: var(--color-accent-800);
}

/* ── Knoten ─────────────────────────────────────────────────────────────────── */
.chain__dot {
  fill: var(--color-graphite-950);
  stroke: var(--color-accent-500);
  stroke-width: 1.5;
}

.chain__dot--router {
  fill: var(--color-graphite-950);
  stroke: var(--color-brass-400);
}

.chain__dot--leaf {
  stroke: var(--color-accent-700);
}

.chain__label {
  fill: var(--color-steel-300);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-anchor: middle;
}

.chain__label--leaf {
  text-anchor: start;
  fill: var(--color-steel-400);
}

.chain__note {
  fill: var(--color-steel-600);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-anchor: middle;
}

.chain__caption {
  margin-top: 1.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  color: var(--color-steel-600);
}

/*
  Einschalten beim Scrollen: Die Knoten blenden nacheinander auf, die Kette „läuft an“.
  Reine CSS-Animation über `animation-timeline: view()` — kein Scroll-Listener, gleiche
  Bauart wie die `reveal`-Utility in main.css.

  Browser ohne `view()` (Firefox, Stand 2026) zeigen die Zeichnung schlicht fertig: Die
  Startwerte stehen deshalb NICHT im Ruhezustand des Elements, sondern nur im Keyframe.
  Sonst bliebe die Kette dort unsichtbar.
*/
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .chain__node,
    .chain__line--branch {
      animation: chain-in 520ms ease both;
      animation-delay: var(--delay, 0ms);
      animation-timeline: view();
      animation-range: entry 10% cover 34%;
    }
  }
}

@keyframes chain-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
