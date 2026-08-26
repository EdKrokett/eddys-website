<script setup lang="ts">
/**
 * Hero im Konzept "Präzisionswerk" (siehe main.css): Der Name steht wie eine
 * Gravur, dahinter liegt ein Zifferblatt-Bezel aus Indexstrichen. Ein einziger
 * Strich ist rot — der Sekundenzeiger, der einzige Farbakzent im Bild.
 *
 * Der Bezel ist reines SVG (kein Bild, kein Canvas): skaliert verlustfrei,
 * kostet keinen Netzwerk-Request und ist SSR-fest.
 */

/** 60 Indexstriche wie auf einem Zifferblatt; jeder 5. ist ein betonter Hauptindex. */
const TICKS = Array.from({ length: 60 }, (_, i) => ({
  angle: i * 6,
  major: i % 5 === 0,
  /** Position 8 markiert den roten Strich — bewusst asymmetrisch, nicht auf 12. */
  accent: i === 8,
}))
</script>

<template>
  <section class="hero">
    <!-- Zifferblatt-Bezel -->
    <svg
      class="hero__dial"
      viewBox="-110 -110 220 220"
      aria-hidden="true"
      focusable="false"
    >
      <circle r="104" class="hero__dial-ring" />
      <circle r="86" class="hero__dial-ring hero__dial-ring--inner" />
      <g v-for="tick in TICKS" :key="tick.angle">
        <line
          :transform="`rotate(${tick.angle})`"
          x1="0"
          :y1="tick.major ? -104 : -104"
          x2="0"
          :y2="tick.major ? -93 : -99"
          :class="[
            'hero__tick',
            tick.major && 'hero__tick--major',
            tick.accent && 'hero__tick--accent',
          ]"
        />
      </g>
    </svg>

    <UContainer class="relative z-10">
      <div class="hero__inner">
        <p class="kicker hero__kicker">
          <span class="hero__kicker-mark" />Bremen · seit 1966 unterwegs
        </p>

        <h1 class="hero__name">
          Eduard<span class="hero__name-break" />Andrae
        </h1>

        <p class="hero__lead">
          Uhrmachermeister, der Unternehmer wurde. Kettenraucher, der Marathon lief.
          Heute verbinde ich Marken mit Blogs — und schreibe über alles, was
          zwischen Start und Ziel passiert.
        </p>

        <!-- Fakten als Messwerte, nicht als Fließtext -->
        <dl class="hero__facts">
          <div v-for="fact in CV_FACTS" :key="fact.label" class="hero__fact">
            <dt class="hero__fact-value">
              {{ fact.value }}
            </dt>
            <dd class="hero__fact-label">
              {{ fact.label }}
            </dd>
          </div>
        </dl>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-bottom: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(120% 90% at 15% 0%, rgba(200, 16, 46, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
}

.hero__inner {
  padding: clamp(4.5rem, 13vw, 9rem) 0 clamp(3rem, 7vw, 5rem);
  max-width: 46rem;
  animation: var(--animate-rise);
}

/* ── Bezel ──────────────────────────────────────────────────────────────── */
.hero__dial {
  position: absolute;
  z-index: 0;
  top: 50%;
  right: -14%;
  width: min(760px, 88vw);
  aspect-ratio: 1;
  translate: 0 -50%;
  opacity: 0.75;
  pointer-events: none;
}

.hero__dial-ring {
  fill: none;
  stroke: var(--color-graphite-700);
  stroke-width: 0.4;
}
.hero__dial-ring--inner {
  stroke-dasharray: 1 5;
  opacity: 0.7;
}

.hero__tick {
  stroke: var(--color-graphite-600);
  stroke-width: 0.7;
}
.hero__tick--major {
  stroke: var(--color-steel-600);
  stroke-width: 1.4;
}
.hero__tick--accent {
  stroke: var(--color-swiss-500);
  stroke-width: 2;
}

/* ── Typografie ─────────────────────────────────────────────────────────── */
.hero__kicker {
  margin-bottom: 1.75rem;
}
.hero__kicker-mark {
  width: 2rem;
  height: 1px;
  background: var(--color-swiss-500);
}

.hero__name {
  font-size: clamp(3rem, 11vw, 7.5rem);
  line-height: 0.92;
  letter-spacing: -0.045em;
  color: var(--color-steel-100);
}
/* Auf schmalen Screens umbrechen, auf breiten in einer Zeile halten. */
.hero__name-break::before {
  content: '\A';
  white-space: pre;
}
@media (min-width: 640px) {
  .hero__name-break::before {
    content: ' ';
  }
}

.hero__lead {
  margin-top: clamp(1.5rem, 3vw, 2.25rem);
  max-width: 34rem;
  font-size: clamp(1.0625rem, 1.6vw, 1.25rem);
  line-height: 1.7;
  color: var(--color-steel-300);
}

/* ── Fakten ─────────────────────────────────────────────────────────────── */
.hero__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}
@media (min-width: 720px) {
  .hero__facts {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.hero__fact {
  padding: 1rem 1.125rem 1.125rem;
  background: var(--color-graphite-950);
}
/* Fünf Fakten in zwei Spalten lassen unten rechts ein leeres Feld stehen —
   der letzte Eintrag nimmt deshalb die ganze Breite ein. */
@media (max-width: 719px) {
  .hero__fact:last-child {
    grid-column: 1 / -1;
  }
}

.hero__fact-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  color: var(--color-steel-100);
}

.hero__fact-label {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-steel-500);
}
</style>
