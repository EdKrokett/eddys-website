<script setup lang="ts">
import type { ZeitstrahlMarke, ZeitstrahlModell } from '~/utils/statistik'

/**
 * Alle Läufe seit 2006 als Indexstriche auf einer Achse, wie die Minutenteilung eines
 * Zifferblatts. Strichlänge = Distanz (Wurzel-Skala, siehe baueZeitstrahl), hohle Striche
 * = DNS/DNF, Messing-Rauten unter der Achse = Meilensteine.
 *
 * Die Marken sind für Screenreader ausgeblendet: Dieselben Einträge stehen vollständig und
 * zugänglich im Protokoll darunter. Ein Klick auf eine Marke springt dorthin (`select`).
 */
const props = defineProps<{ modell: ZeitstrahlModell }>()
const emit = defineEmits<{ select: [id: number] }>()

const aktiv = ref<ZeitstrahlMarke | null>(null)

/**
 * Beschriftet: erstes Jahr, jedes fünfte und das letzte. Das letzte nur, wenn es mindestens
 * drei Jahre hinter dem letzten Fünferjahr liegt; „2025“ und „2026“ standen sonst übereinander.
 */
const jahresLabels = computed(() => {
  const { vonJahr, bisJahr } = props.modell
  const letztesFuenferjahr = Math.floor(bisJahr / 5) * 5
  return props.modell.ticks.filter(tick =>
    tick.major
    || tick.jahr === vonJahr
    || (tick.jahr === bisJahr && bisJahr - letztesFuenferjahr >= 3),
  )
})

const laeufe = computed(() => props.modell.marken.filter(m => m.typ !== 'meilenstein'))
const meilensteine = computed(() => props.modell.marken.filter(m => m.typ === 'meilenstein'))

function beschreibe(marke: ZeitstrahlMarke): string {
  const { lauf } = marke
  if (marke.typ === 'meilenstein') return 'Meilenstein'
  const teile = [lauf.distanzKm !== null ? `${formatDistanz(lauf.distanzKm)} km` : null]
  if (lauf.ergebnis === 'dns') teile.push('nicht gestartet')
  else if (lauf.ergebnis === 'dnf') teile.push('nicht im Ziel')
  else if (lauf.sekunden) teile.push(formatDauer(lauf.sekunden))
  return teile.filter(Boolean).join(' · ')
}
</script>

<template>
  <figure class="strahl">
    <div class="strahl__flaeche" aria-hidden="true" @mouseleave="aktiv = null">
      <!-- Läufe über der Achse -->
      <div class="strahl__plot">
        <button
          v-for="marke in laeufe"
          :key="marke.lauf.id"
          type="button"
          tabindex="-1"
          class="marke"
          :class="[`marke--${marke.typ}`, { 'marke--aktiv': aktiv === marke }]"
          :style="{ 'left': `${marke.offsetPct}%`, '--h': `${marke.hoehePct}%` }"
          @mouseenter="aktiv = marke"
          @focus="aktiv = marke"
          @click="emit('select', marke.lauf.id)"
        >
          <span class="marke__strich" />
        </button>
      </div>

      <!-- Achse mit Jahresteilung -->
      <div class="strahl__achse">
        <span
          v-for="tick in modell.ticks"
          :key="tick.jahr"
          class="tick"
          :class="{ 'tick--major': tick.major }"
          :style="{ left: `${tick.offsetPct}%` }"
        />
      </div>

      <!-- Meilensteine unter der Achse -->
      <div class="strahl__meilensteine">
        <button
          v-for="marke in meilensteine"
          :key="marke.lauf.id"
          type="button"
          tabindex="-1"
          class="raute"
          :class="{ 'raute--aktiv': aktiv === marke }"
          :style="{ left: `${marke.offsetPct}%` }"
          @mouseenter="aktiv = marke"
          @click="emit('select', marke.lauf.id)"
        >
          <span class="raute__form" />
        </button>
      </div>

      <div class="strahl__jahre">
        <span
          v-for="tick in jahresLabels"
          :key="tick.jahr"
          class="jahr"
          :style="{ left: `${tick.offsetPct}%` }"
        >{{ tick.jahr }}</span>
      </div>

      <!-- Tooltip oben neben der Marke: in der linken Hälfte rechts davon, sonst links.
           So verdeckt er nie den Strich, auf den man gerade zeigt. -->
      <div
        v-if="aktiv"
        class="tipp"
        :class="{ 'tipp--links': aktiv.offsetPct > 50 }"
        :style="{ left: `${aktiv.offsetPct}%` }"
      >
        <span class="tipp__datum">{{ formatTagMonat(aktiv.lauf.datum) }}{{ aktiv.lauf.jahr }}</span>
        <span class="tipp__titel">{{ aktiv.lauf.titel }}</span>
        <span class="tipp__werte">{{ beschreibe(aktiv) }}</span>
      </div>
    </div>

    <figcaption class="legende">
      <span class="legende__eintrag">
        <span class="legende__strich" aria-hidden="true" />Lauf, Länge nach Distanz
      </span>
      <span class="legende__eintrag">
        <span class="legende__strich legende__strich--hohl" aria-hidden="true" />nicht gestartet oder nicht im Ziel
      </span>
      <span class="legende__eintrag">
        <span class="legende__raute" aria-hidden="true" />Meilenstein
      </span>
      <span class="legende__hinweis">Klick auf eine Marke springt zum Eintrag im Protokoll.</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.strahl {
  margin-top: clamp(2rem, 5vw, 3rem);
}

.strahl__flaeche {
  position: relative;
  /* Platz links/rechts, damit Marken am Rand und der Tooltip nicht anstoßen */
  padding: 0 0.25rem;
}

.strahl__plot {
  position: relative;
  height: clamp(150px, 26vw, 240px);
}

/* Trefferfläche breiter als der Strich: 2px Strich, 12px greifbar */
.marke {
  position: absolute;
  bottom: 0;
  width: 12px;
  height: 100%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: none;
  border: 0;
  padding: 0;
}

.marke__strich {
  display: block;
  width: 2px;
  height: var(--h);
  /* oberes Ende abgerundet, an der Achse gerade */
  border-radius: 2px 2px 0 0;
  background: var(--color-accent-500);
  transition: background-color 0.15s, box-shadow 0.15s;
}

.marke--ausfall .marke__strich {
  width: 4px;
  background: transparent;
  border: 1px solid var(--color-steel-500);
  border-bottom: 0;
}

.marke:hover .marke__strich,
.marke--aktiv .marke__strich {
  background: var(--color-accent-300);
  box-shadow: 0 0 0 2px var(--color-graphite-900), 0 0 12px rgba(88, 197, 187, 0.45);
}

.marke--ausfall.marke--aktiv .marke__strich {
  background: transparent;
  border-color: var(--color-steel-200);
}

.strahl__achse {
  position: relative;
  height: 10px;
  border-top: 1px solid var(--color-steel-500);
}

.tick {
  position: absolute;
  top: 0;
  width: 1px;
  height: 5px;
  background: var(--color-graphite-500);
}

.tick--major {
  height: 10px;
  background: var(--color-steel-400);
}

.strahl__meilensteine {
  position: relative;
  height: 22px;
}

.raute {
  position: absolute;
  top: 4px;
  width: 16px;
  height: 16px;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  background: none;
  border: 0;
  padding: 0;
}

.raute__form {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  background: var(--color-brass-mark);
  box-shadow: 0 0 0 2px var(--color-graphite-900);
}

.raute:hover .raute__form,
.raute--aktiv .raute__form {
  background: var(--color-brass-300);
}

.strahl__jahre {
  position: relative;
  height: 1.5rem;
}

.jahr {
  position: absolute;
  top: 0.25rem;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-400);
}

/* Erstes Label nicht über den linken Rand schieben */
.jahr:first-child {
  transform: none;
}

.tipp {
  position: absolute;
  top: 0;
  transform: translateX(0.75rem);
  z-index: 2;
  display: grid;
  gap: 0.15rem;
  width: max-content;
  max-width: 13rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-graphite-600);
  background: var(--color-graphite-950);
  pointer-events: none;
}

.tipp--links {
  transform: translateX(calc(-100% - 0.75rem));
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

.legende {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  margin-top: 1.25rem;
  font-size: var(--text-sm);
  color: var(--color-steel-300);
}

.legende__eintrag {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.legende__strich {
  width: 2px;
  height: 14px;
  border-radius: 2px 2px 0 0;
  background: var(--color-accent-500);
}

.legende__strich--hohl {
  width: 4px;
  background: transparent;
  border: 1px solid var(--color-steel-500);
  border-bottom: 0;
}

.legende__raute {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  background: var(--color-brass-mark);
}

.legende__hinweis {
  flex-basis: 100%;
  font-size: var(--text-xs);
  color: var(--color-steel-500);
}

@media (hover: none) {
  .legende__hinweis {
    display: none;
  }
}
</style>
