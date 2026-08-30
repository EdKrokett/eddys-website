<script setup lang="ts">
import type { CvStation } from '#shared/types/cv'

/**
 * Der Werdegang als Chronografen-Skala: 35 Jahre auf einen Blick, bevor man eine
 * einzige Station liest. Klick auf einen Balken springt zur Station und klappt sie auf.
 *
 * Das ist der spielerische Teil, den Eddy gesucht hat (30.08.2026) — und der einzige,
 * der hier trägt: Er ersetzt keine Information, er macht die vorhandene erst greifbar.
 * Die Balkenlängen zeigen sofort, was im Fließtext untergeht — acht Jahre Uhrmacher,
 * sieben Jahre erstes Startup, ein Jahr Product Owner.
 *
 * Reine Darstellung; gerechnet wird in app/utils/cv-axis.ts (dort auch getestet).
 */
const props = defineProps<{
  stations: CvStation[]
  /** Referenzjahr aus dem SSR-Payload — nie ein frisches `new Date()` (Hydration). */
  nowYear: number
  /** Schlüssel der gerade aufgeklappten Stationen; hebt die Balken hervor. */
  openKeys: string[]
}>()

const emit = defineEmits<{ select: [key: string] }>()

const model = computed(() => buildAxisModel(props.stations, props.nowYear))

/** Nur die Haupt-Ticks bekommen eine Beschriftung — sonst überlagern sich die Zahlen. */
const labelledTicks = computed(() => model.value.ticks.filter(tick => tick.major))
</script>

<template>
  <div class="axis">
    <p class="axis__caption">
      <span class="axis__caption-mark" aria-hidden="true" />
      <!-- Eigener Textblock: Als lose Textknoten im Flex-Container riss die Zeile
           bei 375 px auseinander (Rest der Zeile rechts abgesetzt), real beobachtet. -->
      <span class="axis__caption-text">
        {{ model.minYear }}—heute · {{ stations.length }} Stationen<span class="axis__hint"> · Balken führt zur Station</span>
      </span>
    </p>

    <!-- Die Skala selbst ist Dekoration: die Stationen stehen als echte Liste
         darunter in der Timeline. Screenreader bekommen hier nur die Buttons. -->
    <div
      class="axis__scale"
      :style="{ '--lanes': model.laneCount }"
    >
      <!-- Indexstriche wie auf dem Zifferblatt: jeder Strich ein Jahr, jeder fünfte betont -->
      <div class="axis__ticks" aria-hidden="true">
        <span
          v-for="tick in model.ticks"
          :key="tick.year"
          class="axis__tick"
          :class="{ 'axis__tick--major': tick.major }"
          :style="{ left: `${tick.offsetPct}%` }"
        />
      </div>

      <div class="axis__lanes">
        <button
          v-for="segment in model.segments"
          :key="segment.key"
          type="button"
          class="axis__segment"
          :class="{
            'axis__segment--current': segment.current,
            'axis__segment--open': openKeys.includes(segment.key),
          }"
          :style="{
            'left': `${segment.offsetPct}%`,
            'width': `${segment.widthPct}%`,
            '--lane': segment.lane,
          }"
          :title="`${segment.station.company} · ${segment.station.period}`"
          :aria-label="`${segment.station.role} bei ${segment.station.company}, ${segment.station.period} — zur Station springen`"
          @click="emit('select', segment.key)"
        >
          <span class="axis__segment-fill" />
          <!-- Nur wo der Balken den Namen wirklich trägt; sonst blieben unlesbare
               Stummel ("Halt…", "t…") stehen. Der Name steckt im title und im
               aria-label und steht vollständig in der Timeline darunter. -->
          <span v-if="segment.showLabel" class="axis__segment-name">{{ segment.station.company }}</span>
        </button>
      </div>
    </div>

    <div class="axis__years" aria-hidden="true">
      <span
        v-for="tick in labelledTicks"
        :key="tick.year"
        class="axis__year"
        :class="{ 'axis__year--decade': tick.decade }"
        :style="{ left: `${tick.offsetPct}%` }"
      >{{ tick.year }}</span>
    </div>
  </div>
</template>

<style scoped>
.axis {
  --lane-height: 1.75rem;
  --lane-gap: 0.375rem;

  margin-bottom: clamp(2.5rem, 5vw, 3.5rem);
}

.axis__caption {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-500);
}

.axis__caption-mark {
  width: 1.75rem;
  height: 1px;
  flex: none;
  background: var(--color-accent-500);
}

.axis__caption-text {
  min-width: 0;
}

.axis__hint {
  color: var(--color-steel-600);
}

/* ── Skala ──────────────────────────────────────────────────────────────── */
.axis__scale {
  position: relative;
  /* Höhe folgt der TATSÄCHLICHEN Spurenzahl: kommt eine dritte Parallel-Station
     dazu, wächst die Skala mit, statt sie abzuschneiden. */
  height: calc(var(--lanes) * var(--lane-height) + (var(--lanes) - 1) * var(--lane-gap));
  border-bottom: 1px solid var(--color-graphite-700);
  padding-bottom: 0.5rem;
}

.axis__ticks {
  position: absolute;
  inset: 0;
}

.axis__tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-graphite-800);
}
.axis__tick--major {
  background: var(--color-graphite-700);
}

.axis__lanes {
  position: absolute;
  inset: 0;
}

/* ── Balken ─────────────────────────────────────────────────────────────── */
.axis__segment {
  position: absolute;
  top: calc(var(--lane) * (var(--lane-height) + var(--lane-gap)));
  height: var(--lane-height);
  /* Abstand am rechten Rand, damit nahtlos aneinander anschließende Stationen
     (1991—1999 → 1999—2006) als zwei Balken lesbar bleiben und nicht verkleben.
     Das ist Darstellung — die Spurenlogik behandelt sie bewusst als eine Reihe. */
  padding-right: 2px;
  display: flex;
  align-items: center;
  text-align: left;
  background: none;
  border: none;
}

.axis__segment-fill {
  position: absolute;
  inset: 0 2px 0 0;
  background: var(--color-graphite-700);
  border-left: 2px solid var(--color-steel-600);
  transition: background 240ms ease, border-color 240ms ease;
}
.axis__segment:hover .axis__segment-fill,
.axis__segment:focus-visible .axis__segment-fill {
  background: var(--color-graphite-600);
  border-left-color: var(--color-accent-300);
}

.axis__segment--current .axis__segment-fill {
  background: color-mix(in oklab, var(--color-accent-900) 70%, transparent);
  border-left-color: var(--color-accent-500);
}

/* Aufgeklappte Station: der Balken zeigt, was unten gerade offen steht. */
.axis__segment--open .axis__segment-fill {
  background: color-mix(in oklab, var(--color-accent-700) 45%, transparent);
  border-left-color: var(--color-accent-300);
}

.axis__segment-name {
  position: relative;
  z-index: 1;
  padding-inline: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-steel-400);
  transition: color 240ms ease;
}
.axis__segment:hover .axis__segment-name,
.axis__segment--open .axis__segment-name {
  color: var(--color-steel-100);
}
.axis__segment--current .axis__segment-name {
  color: var(--color-accent-200);
}

/*
 * Auf schmalen Screens ist für Firmennamen im Balken kein Platz — dort bleibt die
 * Skala rein grafisch. Die Namen stehen ohnehin in der Timeline darunter, und die
 * aria-labels der Buttons tragen sie weiterhin.
 */
@media (max-width: 767px) {
  .axis {
    --lane-height: 1.25rem;
  }
  .axis__segment-name {
    display: none;
  }
  /* Bei 375 px klebten die Fünfjahres-Zahlen aneinander ("19901995") — dort
     tragen nur noch die vollen Jahrzehnte. */
  .axis__year:not(.axis__year--decade) {
    display: none;
  }
}

/* ── Jahreszahlen ───────────────────────────────────────────────────────── */
.axis__years {
  position: relative;
  height: 1.25rem;
  margin-top: 0.5rem;
}

.axis__year {
  position: absolute;
  top: 0;
  translate: -50% 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-600);
}
/* Erste und letzte Zahl an den Rand ziehen, sonst ragen sie aus dem Container. */
.axis__year:first-child {
  translate: 0 0;
}
.axis__year:last-child {
  translate: -100% 0;
}
</style>
