<script setup lang="ts">
import type { ZeitstrahlModell } from '~/utils/statistik'

/**
 * Der Zeitstrahl als Zifferblatt, für den Seitenkopf. Die Lünette läuft von 12 Uhr im
 * Uhrzeigersinn vom ersten Eintrag bis heute; jeder Lauf ist ein Strich nach außen (Länge =
 * Distanz, dieselbe Wurzel-Skala wie der Zeitstrahl), Meilensteine sind Messing-Rauten innen.
 * Der Zeiger steht auf dem jüngsten Lauf.
 *
 * Rein dekorativ (aria-hidden): Dieselben Daten stehen im Zeitstrahl und vollständig im
 * Protokoll. Das hier ist der Moment, der von der Seite hängen bleiben soll.
 */
const props = defineProps<{ modell: ZeitstrahlModell }>()

const MITTE = 220
/** Oben bleibt eine Lücke von 10°, damit Anfang und Ende nicht ineinanderlaufen (die „12“). */
const LUECKE = 10

const winkel = (pct: number) => -90 + LUECKE / 2 + (pct / 100) * (360 - LUECKE)

function punkt(grad: number, radius: number) {
  const rad = (grad * Math.PI) / 180
  return { x: Math.round((MITTE + radius * Math.cos(rad)) * 100) / 100, y: Math.round((MITTE + radius * Math.sin(rad)) * 100) / 100 }
}

function strich(grad: number, innen: number, aussen: number) {
  const a = punkt(grad, innen)
  const b = punkt(grad, aussen)
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
}

const laeufe = computed(() => props.modell.marken
  .filter(m => m.typ !== 'meilenstein')
  .map((m, index) => ({
    id: m.lauf.id,
    typ: m.typ,
    index,
    ...strich(winkel(m.offsetPct), 158, 158 + m.hoehePct * 0.4),
  })))

const meilensteine = computed(() => props.modell.marken
  .filter(m => m.typ === 'meilenstein')
  .map(m => ({ id: m.lauf.id, ...punkt(winkel(m.offsetPct), 128), grad: winkel(m.offsetPct) })))

const jahre = computed(() => props.modell.ticks.map(tick => ({
  jahr: tick.jahr,
  major: tick.major,
  ...strich(winkel(tick.offsetPct), tick.major ? 140 : 145, 150),
  label: punkt(winkel(tick.offsetPct), 112),
})))

/** Zeiger auf den jüngsten Lauf (nicht Meilenstein). */
const zeigerGrad = computed(() => {
  const letzter = props.modell.marken.filter(m => m.typ === 'lauf').at(-1)
  return letzter ? winkel(letzter.offsetPct) + 90 : 0
})
</script>

<template>
  <svg class="blatt" viewBox="0 0 440 440" aria-hidden="true" focusable="false">
    <!-- Lünette -->
    <circle :cx="MITTE" :cy="MITTE" r="214" class="blatt__luenette" />
    <circle :cx="MITTE" :cy="MITTE" r="156" class="blatt__ring" />

    <!-- Jahresteilung, Fünferjahre länger und beschriftet -->
    <line
      v-for="j in jahre"
      :key="`t${j.jahr}`"
      v-bind="{ x1: j.x1, y1: j.y1, x2: j.x2, y2: j.y2 }"
      class="blatt__tick"
      :class="{ 'blatt__tick--major': j.major }"
    />
    <template v-for="j in jahre" :key="`l${j.jahr}`">
      <text
        v-if="j.major"
        :x="j.label.x"
        :y="j.label.y"
        class="blatt__jahr"
        text-anchor="middle"
        dominant-baseline="central"
      >{{ j.jahr }}</text>
    </template>

    <!-- Läufe -->
    <line
      v-for="l in laeufe"
      :key="l.id"
      v-bind="{ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }"
      class="blatt__lauf"
      :class="`blatt__lauf--${l.typ}`"
      :style="{ '--i': l.index }"
    />

    <!-- Meilensteine -->
    <rect
      v-for="m in meilensteine"
      :key="m.id"
      :x="m.x - 3.5"
      :y="m.y - 3.5"
      width="7"
      height="7"
      class="blatt__meilenstein"
      :transform="`rotate(${m.grad + 45} ${m.x} ${m.y})`"
    />

    <!-- Zeiger -->
    <g class="blatt__zeiger" :style="{ '--grad': `${zeigerGrad}deg` }">
      <line :x1="MITTE" :y1="MITTE + 24" :x2="MITTE" :y2="MITTE - 150" />
      <circle :cx="MITTE" :cy="MITTE - 150" r="3" />
    </g>
    <circle :cx="MITTE" :cy="MITTE" r="6" class="blatt__achse" />
    <circle :cx="MITTE" :cy="MITTE" r="2" class="blatt__achse-kern" />

    <text :x="MITTE" :y="MITTE + 52" class="blatt__seit" text-anchor="middle">SEIT</text>
    <text :x="MITTE" :y="MITTE + 78" class="blatt__startjahr" text-anchor="middle">{{ modell.vonJahr }}</text>
  </svg>
</template>

<style scoped>
.blatt {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.blatt__luenette {
  fill: none;
  stroke: var(--color-graphite-600);
  stroke-width: 1;
}

.blatt__ring {
  fill: rgba(255, 255, 255, 0.012);
  stroke: var(--color-graphite-700);
  stroke-width: 1;
}

.blatt__tick {
  stroke: var(--color-graphite-500);
  stroke-width: 1;
}

.blatt__tick--major {
  stroke: var(--color-steel-400);
  stroke-width: 1.5;
}

.blatt__jahr {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  fill: var(--color-steel-500);
}

.blatt__lauf {
  stroke: var(--color-accent-500);
  stroke-width: 2;
  stroke-linecap: round;
}

.blatt__lauf--ausfall {
  stroke: var(--color-steel-500);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.blatt__meilenstein {
  fill: var(--color-brass-mark);
}

.blatt__zeiger {
  stroke: var(--color-accent-300);
  fill: var(--color-accent-300);
  stroke-width: 1.5;
  transform-origin: 220px 220px;
  transform: rotate(var(--grad));
}

.blatt__achse {
  fill: var(--color-graphite-950);
  stroke: var(--color-accent-300);
  stroke-width: 1.5;
}

.blatt__achse-kern {
  fill: var(--color-accent-300);
}

.blatt__seit {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  fill: var(--color-steel-500);
}

.blatt__startjahr {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
  fill: var(--color-steel-200);
}

/*
 * Der Auftritt: Die Striche wachsen nacheinander aus dem Ring, der Zeiger läuft von 12 Uhr
 * auf den jüngsten Lauf. Einmal beim Laden, nicht beim Scrollen.
 */
@media (prefers-reduced-motion: no-preference) {
  .blatt__lauf {
    transform-box: fill-box;
    transform-origin: center;
    animation: strich 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(0.3s + var(--i) * 18ms);
  }

  .blatt__zeiger {
    animation: zeiger 2.2s cubic-bezier(0.65, 0, 0.35, 1) 0.2s both;
  }
}

@keyframes strich {
  from { opacity: 0; transform: scale(0.2); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes zeiger {
  from { transform: rotate(0deg); }
  to { transform: rotate(var(--grad)); }
}
</style>
