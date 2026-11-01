<script setup lang="ts">
import type { ZeitPlotModell } from '~/utils/statistik'

/**
 * Alle Halbmarathons, Zeit über Datum, gemessen an der Zwei-Stunden-Marke.
 *
 * Gestaltung „Abstand zur Marke“ (Eddys Wunsch nach mehr Fläche, 01.11.2026): Jeder Punkt hängt
 * an einem Stiel, der an der Zwei-Stunden-Linie beginnt. Darunter (schneller) ist der Stiel
 * teal, darüber gedämpft. Die Zone unter zwei Stunden ist als Fläche getönt, damit das Ziel
 * auch ohne Lesen der Achse sichtbar ist. Wettkämpfe gefüllt, Trainingsläufe hohl, die
 * Bestzeit in Messing mit Hof. Beschriftet werden nur Bestzeit und letzter Lauf, alles andere
 * zeigt der Tooltip und vollständig das Protokoll.
 */
const props = defineProps<{ modell: ZeitPlotModell }>()

type Punkt = ZeitPlotModell['punkte'][number]
const aktiv = ref<Punkt | null>(null)

const letzter = computed(() => props.modell.punkte.at(-1) ?? null)
const beschriftet = (punkt: Punkt) => punkt.bestzeit || punkt === letzter.value

/** Stiel von der Referenzlinie zum Punkt; ohne Referenz im Bereich vom unteren Rand. */
function stiel(punkt: Punkt) {
  const basis = props.modell.referenzPct ?? 0
  return {
    left: `${punkt.xPct}%`,
    bottom: `${Math.min(basis, punkt.yPct)}%`,
    height: `${Math.abs(punkt.yPct - basis)}%`,
  }
}

const unterMarke = (punkt: Punkt) => props.modell.referenzPct !== null && punkt.yPct < props.modell.referenzPct
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
          :class="{ 'ytick--marke': tick.pct === modell.referenzPct }"
          :style="{ bottom: `${tick.pct}%` }"
        >{{ tick.label.replace(/:00$/, '') }}</span>
      </div>

      <div class="plot__flaeche">
        <!-- Zone unter zwei Stunden -->
        <div
          v-if="modell.referenzPct !== null"
          class="zone"
          :style="{ height: `${modell.referenzPct}%` }"
        >
          <span class="zone__label">unter zwei Stunden</span>
        </div>

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
        />

        <!-- Stiele zuerst, damit die Punkte darüber liegen -->
        <span
          v-for="punkt in modell.punkte"
          :key="`s${punkt.lauf.id}`"
          class="stiel"
          :class="{ 'stiel--unter': unterMarke(punkt), 'stiel--aktiv': aktiv === punkt }"
          :style="stiel(punkt)"
        />

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
            :class="{
              'punkt__label--links': punkt.xPct > 80,
              'punkt__label--best': punkt.bestzeit,
              'punkt__label--letzter': !punkt.bestzeit,
            }"
          >
            <span class="punkt__label-art">{{ punkt.bestzeit ? 'Bestzeit' : punkt.lauf.jahr }}</span>
            {{ formatDauer(punkt.sekunden) }}
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
      <span class="legende__eintrag"><span class="legende__zone" aria-hidden="true" />unter zwei Stunden</span>
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
  grid-template-rows: clamp(280px, 38vw, 420px) 2rem;
}

.plot__y {
  position: relative;
}

.ytick {
  position: absolute;
  right: 0.85rem;
  transform: translateY(50%);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-500);
}

.ytick--marke {
  color: var(--color-steel-100);
  font-weight: 600;
}

/* Fläche mit leichtem Licht von oben statt reinem Schwarz */
.plot__flaeche {
  position: relative;
  border-bottom: 1px solid var(--color-steel-500);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0.008));
}

.zone {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(33, 164, 163, 0.2), rgba(33, 164, 163, 0.04));
}

.zone__label {
  position: absolute;
  right: 0.75rem;
  bottom: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-300);
}

.gitter {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.referenz {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateY(1px);
  background: var(--color-steel-200);
  box-shadow: 0 0 18px rgba(88, 197, 187, 0.35);
}

.stiel {
  position: absolute;
  width: 2px;
  transform: translateX(-50%);
  background: var(--color-graphite-500);
  transition: background-color 0.15s;
}

.stiel--unter {
  background: var(--color-accent-400);
}

.stiel--aktiv {
  background: var(--color-steel-200);
}

/* Trefferfläche 32px, sichtbarer Punkt 16px */
.punkt {
  position: absolute;
  width: 32px;
  height: 32px;
  transform: translate(-50%, 50%);
  display: grid;
  place-items: center;
  background: none;
  border: 0;
  padding: 0;
}

.punkt__form {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent-500);
  /* 2px Ring in Flächenfarbe trennt überlappende Punkte */
  box-shadow: 0 0 0 2px var(--color-graphite-900);
  transition: transform 0.15s, box-shadow 0.15s;
}

.punkt--training .punkt__form {
  background: var(--color-graphite-900);
  border: 3px solid var(--color-accent-500);
}

.punkt--best .punkt__form {
  width: 20px;
  height: 20px;
  background: var(--color-brass-mark);
  border-color: var(--color-brass-mark);
  box-shadow: 0 0 0 2px var(--color-graphite-900), 0 0 0 7px rgba(189, 139, 48, 0.28);
}

.punkt:hover .punkt__form,
.punkt--aktiv .punkt__form {
  transform: scale(1.25);
  box-shadow: 0 0 0 2px var(--color-graphite-900), 0 0 16px rgba(88, 197, 187, 0.6);
}

.punkt__label {
  position: absolute;
  left: calc(100% - 0.2rem);
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--color-graphite-600);
  background: var(--color-graphite-950);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-100);
}

.punkt__label--best {
  border-color: var(--color-brass-500);
}

.punkt__label-art {
  font-size: var(--text-2xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-steel-400);
}

.punkt__label--best .punkt__label-art {
  color: var(--color-brass-300);
}

.punkt__label--links {
  left: auto;
  right: calc(100% - 0.2rem);
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
  transform: translate(1.25rem, -0.5rem);
}

.tipp--links {
  transform: translate(calc(-100% - 1.25rem), -0.5rem);
}

.tipp--unten {
  transform: translate(1.25rem, 100%);
}

.tipp--links.tipp--unten {
  transform: translate(calc(-100% - 1.25rem), 100%);
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
  top: 0.5rem;
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
  width: 12px;
  height: 12px;
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

.legende__zone {
  width: 18px;
  height: 12px;
  border-top: 2px solid var(--color-steel-200);
  background: linear-gradient(180deg, rgba(33, 164, 163, 0.35), rgba(33, 164, 163, 0.08));
}

/* Schmal: Punkte etwas kleiner, damit die Häufung 2011–2015 nicht zu einem Klumpen wird */
@media (max-width: 639px) {
  .plot__rahmen {
    grid-template-columns: 2.5rem minmax(0, 1fr);
    grid-template-rows: 340px 2rem;
  }

  .punkt__form {
    width: 12px;
    height: 12px;
  }

  .punkt--best .punkt__form {
    width: 15px;
    height: 15px;
  }

  /* Nur das Bestzeit-Schild bleibt; Zonen-Label und „letzter Lauf“ verdeckten hier Punkte.
     Beides steht in Legende und Tooltip. */
  .zone__label,
  .punkt__label--letzter {
    display: none;
  }

  .legende {
    padding-left: 2.5rem;
  }
}
</style>
