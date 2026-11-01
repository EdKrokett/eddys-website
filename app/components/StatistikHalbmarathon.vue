<script setup lang="ts">
import type { ZeitPlotModell } from '~/utils/statistik'

/**
 * Alle Halbmarathons als Punkte: Zeit über Datum, mit der Zwei-Stunden-Linie als Referenz.
 * Je tiefer ein Punkt, desto schneller. Wettkämpfe gefüllt, Trainingsläufe hohl, die
 * Bestzeit in Messing. Beschriftet werden nur Bestzeit und letzter Lauf, alles andere
 * zeigt der Tooltip (und vollständig das Protokoll).
 */
const props = defineProps<{ modell: ZeitPlotModell }>()

type Punkt = ZeitPlotModell['punkte'][number]
const aktiv = ref<Punkt | null>(null)

const letzter = computed(() => props.modell.punkte.at(-1) ?? null)
const beschriftet = (punkt: Punkt) => punkt.bestzeit || punkt === letzter.value
</script>

<template>
  <figure class="plot">
    <div class="plot__rahmen" aria-hidden="true" @mouseleave="aktiv = null">
      <!-- y-Achse: Zeitraster -->
      <div class="plot__y">
        <span
          v-for="tick in modell.yTicks"
          :key="tick.sekunden"
          class="ytick"
          :style="{ bottom: `${tick.pct}%` }"
        >{{ tick.label.replace(/:00$/, '') }}</span>
      </div>

      <div class="plot__flaeche">
        <span
          v-for="tick in modell.yTicks"
          :key="tick.sekunden"
          class="gitter"
          :style="{ bottom: `${tick.pct}%` }"
        />

        <span
          v-if="modell.referenzPct !== null"
          class="referenz"
          :style="{ bottom: `${modell.referenzPct}%` }"
        ><span class="referenz__label">2 Stunden</span></span>

        <button
          v-for="punkt in modell.punkte"
          :key="punkt.lauf.id"
          type="button"
          tabindex="-1"
          class="punkt"
          :class="{
            'punkt--training': punkt.lauf.art === 'training',
            'punkt--best': punkt.bestzeit,
            'punkt--aktiv': aktiv === punkt,
          }"
          :style="{ left: `${punkt.xPct}%`, bottom: `${punkt.yPct}%` }"
          @mouseenter="aktiv = punkt"
        >
          <span class="punkt__form" />
          <!-- Neben dem Punkt statt darunter: Die Bestzeit liegt ganz unten und saß sonst
               auf den Jahreszahlen. Am rechten Rand nach links geklappt. -->
          <span
            v-if="beschriftet(punkt)"
            class="punkt__label"
            :class="{ 'punkt__label--links': punkt.xPct > 80 }"
          >
            {{ punkt.bestzeit ? 'Bestzeit' : punkt.lauf.jahr }} {{ formatDauer(punkt.sekunden) }}
          </span>
        </button>

        <div
          v-if="aktiv"
          class="tipp"
          :class="{ 'tipp--links': aktiv.xPct > 50, 'tipp--unten': aktiv.yPct > 60 }"
          :style="{ left: `${aktiv.xPct}%`, bottom: `${aktiv.yPct}%` }"
        >
          <span class="tipp__datum">{{ formatTagMonat(aktiv.lauf.datum) }}{{ aktiv.lauf.jahr }}</span>
          <span class="tipp__titel">{{ aktiv.lauf.titel }}</span>
          <span class="tipp__werte">
            {{ formatDauer(aktiv.sekunden) }}{{ aktiv.lauf.art === 'training' ? ' · Training' : '' }}
          </span>
        </div>
      </div>

      <div class="plot__x">
        <span
          v-for="tick in modell.xTicks"
          :key="tick.jahr"
          class="xtick"
          :style="{ left: `${tick.pct}%` }"
        >{{ tick.jahr }}</span>
      </div>
    </div>

    <figcaption class="legende">
      <span class="legende__eintrag"><span class="legende__punkt" aria-hidden="true" />Wettkampf</span>
      <span class="legende__eintrag"><span class="legende__punkt legende__punkt--hohl" aria-hidden="true" />Trainingslauf</span>
      <span class="legende__eintrag"><span class="legende__punkt legende__punkt--best" aria-hidden="true" />Bestzeit</span>
      <span class="legende__eintrag"><span class="legende__linie" aria-hidden="true" />zwei Stunden</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.plot {
  margin-top: clamp(2rem, 5vw, 3rem);
}

.plot__rahmen {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr);
  grid-template-rows: clamp(220px, 34vw, 340px) 1.75rem;
}

.plot__y {
  position: relative;
}

.ytick {
  position: absolute;
  right: 0.75rem;
  transform: translateY(50%);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-500);
}

.plot__flaeche {
  position: relative;
  border-left: 1px solid var(--color-graphite-600);
  border-bottom: 1px solid var(--color-steel-500);
}

.gitter {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-graphite-700);
}

.referenz {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1px dashed var(--color-steel-300);
}

/* Links am Anfang der Linie und knapp darunter: rechts liegen die jüngsten Läufe, und der
   erste (Köln 2007, 2:01:11) sitzt direkt über der Linie */
.referenz__label {
  position: absolute;
  left: 0.5rem;
  top: 0.35rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-steel-300);
}

/* Trefferfläche 24px, sichtbarer Punkt 10px */
.punkt {
  position: absolute;
  width: 24px;
  height: 24px;
  transform: translate(-50%, 50%);
  display: grid;
  place-items: center;
  background: none;
  border: 0;
  padding: 0;
}

.punkt__form {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent-500);
  /* 2px Ring in Flächenfarbe trennt überlappende Punkte */
  box-shadow: 0 0 0 2px var(--color-graphite-900);
  transition: transform 0.15s;
}

.punkt--training .punkt__form {
  background: var(--color-graphite-900);
  border: 2px solid var(--color-accent-500);
}

.punkt--best .punkt__form {
  background: var(--color-brass-mark);
  border-color: var(--color-brass-mark);
}

.punkt:hover .punkt__form,
.punkt--aktiv .punkt__form {
  transform: scale(1.35);
}

.punkt__label {
  position: absolute;
  left: calc(100% - 0.25rem);
  top: 50%;
  transform: translateY(-50%);
  padding: 0 0.3rem;
  background: var(--color-graphite-900);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-200);
}

.punkt__label--links {
  left: auto;
  right: calc(100% - 0.25rem);
}

.tipp {
  position: absolute;
  z-index: 2;
  display: grid;
  gap: 0.15rem;
  width: max-content;
  max-width: 13rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-graphite-600);
  background: var(--color-graphite-950);
  pointer-events: none;
  transform: translate(1rem, -0.5rem);
}

.tipp--links {
  transform: translate(calc(-100% - 1rem), -0.5rem);
}

.tipp--unten {
  transform: translate(1rem, 100%);
}

.tipp--links.tipp--unten {
  transform: translate(calc(-100% - 1rem), 100%);
}

.tipp__datum,
.tipp__werte {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-400);
}

.tipp__titel {
  font-size: var(--text-sm);
  line-height: 1.3;
  color: var(--color-steel-100);
}

.plot__x {
  grid-column: 2;
  position: relative;
}

.xtick {
  position: absolute;
  top: 0.4rem;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-steel-400);
}

.xtick:first-child {
  transform: none;
}

.legende {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  margin-top: 1rem;
  padding-left: 3.25rem;
  font-size: var(--text-sm);
  color: var(--color-steel-300);
}

.legende__eintrag {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.legende__punkt {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent-500);
}

.legende__punkt--hohl {
  background: transparent;
  border: 2px solid var(--color-accent-500);
}

.legende__punkt--best {
  background: var(--color-brass-mark);
}

.legende__linie {
  width: 18px;
  border-top: 1px dashed var(--color-steel-300);
}

/* Schmal: höher, damit sich die Punkte nicht stapeln; das Linien-Label übernimmt die Legende */
@media (max-width: 639px) {
  .plot__rahmen {
    grid-template-columns: 2.5rem minmax(0, 1fr);
    grid-template-rows: 320px 1.75rem;
  }

  .referenz__label {
    display: none;
  }

  .legende {
    padding-left: 2.5rem;
  }
}
</style>
