<script setup lang="ts">
import type { ReihenPunkt } from '~/utils/statistik'

/**
 * Jeder Marathon ein Balken, Länge = Zeit, Achse ab null (es geht um die Größe der Zeit).
 * Ersetzt das handgepflegte PNG von 2012, das unter der alten TablePress-Tabelle hing.
 *
 * Jeder Balken trägt Jahr, Name und Zeit direkt. Bei zehn Einträgen ist das lesbarer als ein
 * Tooltip, und die Werte sind auch ohne Maus und ohne Farbe vollständig.
 *
 * Die Stundenlinien liegen in der Spur jeder Zeile (Hintergrund), nicht in einer eigenen
 * Ebene darüber: So stehen sie bei jeder Breite exakt unter dem Balken, ohne dass eine
 * zweite Rechnung die Spaltenbreiten nachbauen muss.
 */
const props = defineProps<{ reihe: ReihenPunkt[] }>()

/** Die Achse endet an der nächsten vollen Stunde über dem langsamsten Marathon. */
const achseStunden = computed(() => Math.max(1, Math.ceil(Math.max(...props.reihe.map(p => p.sekunden)) / 3600)))
const stunden = computed(() => Array.from({ length: achseStunden.value + 1 }, (_, h) => h))
const anteil = (sekunden: number) => `${(sekunden / (achseStunden.value * 3600)) * 100}%`
</script>

<template>
  <figure class="balken" :style="{ '--stunden': achseStunden }">
    <ol class="balken__liste">
      <li
        v-for="punkt in reihe"
        :key="punkt.lauf.id"
        class="zeile"
        :class="{ 'zeile--best': punkt.bestzeit }"
      >
        <span class="zeile__jahr">{{ punkt.lauf.jahr }}</span>
        <span class="zeile__name">{{ punkt.lauf.titel }}</span>
        <span class="zeile__spur">
          <span class="zeile__balken" :style="{ width: anteil(punkt.sekunden) }" />
        </span>
        <span class="zeile__zeit">
          {{ formatDauer(punkt.sekunden) }}
          <span v-if="punkt.bestzeit" class="zeile__best">Bestzeit</span>
        </span>
      </li>
    </ol>

    <div class="zeile zeile--achse" aria-hidden="true">
      <span />
      <span />
      <span class="zeile__spur">
        <span
          v-for="h in stunden"
          :key="h"
          class="achse__label"
          :style="{ left: `${(h / achseStunden) * 100}%` }"
        >{{ h }}<template v-if="h === achseStunden">&nbsp;h</template></span>
      </span>
      <span />
    </div>
  </figure>
</template>

<style scoped>
.balken {
  margin-top: clamp(2rem, 5vw, 3rem);
}

.zeile {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 14rem) minmax(0, 1fr) 6.5rem;
  column-gap: 1rem;
  align-items: stretch;
  min-height: 2.75rem;
}

.zeile > * {
  align-self: center;
}

.zeile__jahr,
.zeile__zeit {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-300);
}

.zeile__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--color-steel-200);
}

/* Spur: volle Zeilenhöhe, darin die Stundenlinien als Hintergrund */
.zeile__spur {
  position: relative;
  align-self: stretch;
  display: flex;
  align-items: center;
  background-image: repeating-linear-gradient(
    to right,
    var(--color-graphite-700) 0 1px,
    transparent 1px calc(100% / var(--stunden))
  );
  /* die letzte Linie am rechten Ende */
  box-shadow: inset -1px 0 0 var(--color-graphite-700);
}

.zeile__balken {
  display: block;
  height: 10px;
  /* Datenende abgerundet, an der Nulllinie gerade */
  border-radius: 0 4px 4px 0;
  background: var(--color-accent-500);
  transform-origin: left;
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .zeile__balken {
      animation: wachsen linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }
  }
}

@keyframes wachsen {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.zeile--best .zeile__balken {
  background: var(--color-brass-mark);
}

.zeile--best .zeile__zeit,
.zeile--best .zeile__name {
  color: var(--color-steel-100);
}

.zeile__zeit {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.zeile__best {
  font-size: var(--text-2xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-brass-300);
}

.zeile:hover .zeile__name {
  color: var(--color-steel-100);
}

.zeile--achse {
  min-height: 1.75rem;
}

.zeile--achse .zeile__spur {
  background: none;
  box-shadow: none;
}

/* Einheit nur am letzten Wert („5 h“), sonst drängen sich die Labels auf dem Handy */
.achse__label {
  position: absolute;
  top: 0.4rem;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-steel-500);
}

.achse__label:first-child {
  transform: none;
}

.achse__label:last-child {
  transform: translateX(-100%);
}

/* Schmal: Name über die volle Breite, darunter Spur und Zeit */
@media (max-width: 639px) {
  .zeile {
    grid-template-columns: 2.75rem minmax(0, 1fr) 4.75rem;
    grid-template-areas:
      'jahr name name'
      'jahr spur zeit';
    row-gap: 0.3rem;
    padding: 0.55rem 0;
  }

  .zeile > :nth-child(1) { grid-area: jahr; align-self: start; }
  .zeile > :nth-child(2) { grid-area: name; white-space: normal; }
  .zeile > :nth-child(3) { grid-area: spur; min-height: 1.25rem; }
  .zeile > :nth-child(4) { grid-area: zeit; }

  .zeile--achse {
    padding-top: 0;
  }

  .zeile--achse > :nth-child(2) {
    display: none;
  }
}
</style>
