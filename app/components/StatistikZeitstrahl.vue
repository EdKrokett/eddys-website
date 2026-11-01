<script setup lang="ts">
import type { ZeitstrahlMarke, ZeitstrahlModell } from '~/utils/statistik'

/**
 * Alle Läufe seit 2006 als Indexstriche, wie die Minutenteilung eines Zifferblatts.
 * Strichlänge = Distanz (Wurzel-Skala), hohle Striche = DNS/DNF, Messing-Rauten unter der
 * Achse = Meilensteine.
 *
 * Die Achse ist nach Jahren gestaucht (baueZeitstrahl): Jedes Jahr ist ein Band, so breit wie
 * seine Einträge. Die abwechselnd getönten Bänder machen sichtbar, dass hier Jahre nebeneinander
 * stehen und keine maßstäbliche Zeitachse; leere Jahre sind schmale, schraffierte Streifen.
 *
 * Die Marken sind für Screenreader ausgeblendet: Dieselben Einträge stehen vollständig und
 * zugänglich im Protokoll darunter. Ein Klick auf eine Marke springt dorthin (`select`).
 */
const props = defineProps<{ modell: ZeitstrahlModell }>()
const emit = defineEmits<{ select: [id: number] }>()

const aktiv = ref<ZeitstrahlMarke | null>(null)

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
      <!-- Jahresbänder hinter Plot, Achse und Meilensteinen -->
      <div class="strahl__baender">
        <span
          v-for="(band, index) in modell.baender"
          :key="band.jahr"
          class="band"
          :class="{ 'band--getoent': index % 2 === 0, 'band--leer': !band.anzahl }"
          :style="{ left: `${band.startPct}%`, width: `${band.breitePct}%` }"
        />
      </div>

      <!-- Läufe über der Achse -->
      <div class="strahl__plot">
        <button
          v-for="marke in laeufe"
          :key="marke.lauf.id"
          type="button"
          tabindex="-1"
          class="marke"
          :class="[`marke--${marke.typ}`, { 'marke--aktiv': aktiv === marke }]"
          :style="{ 'left': `${marke.offsetPct}%`, 'width': `${marke.slotPct}%`, '--h': `${marke.hoehePct}%` }"
          @mouseenter="aktiv = marke"
          @focus="aktiv = marke"
          @click="emit('select', marke.lauf.id)"
        >
          <span class="marke__strich" />
        </button>
      </div>

      <div class="strahl__achse" />

      <!-- Meilensteine unter der Achse -->
      <div class="strahl__meilensteine">
        <button
          v-for="marke in meilensteine"
          :key="marke.lauf.id"
          type="button"
          tabindex="-1"
          class="raute"
          :class="{ 'raute--aktiv': aktiv === marke }"
          :style="{ left: `${marke.offsetPct}%`, width: `${marke.slotPct}%` }"
          @mouseenter="aktiv = marke"
          @click="emit('select', marke.lauf.id)"
        >
          <span class="raute__form" />
        </button>
      </div>

      <div class="strahl__jahre">
        <span
          v-for="label in modell.labels"
          :key="label.text"
          class="jahr"
          :class="{ 'jahr--neben': !label.haupt, 'jahr--phase': label.text.includes('–') }"
          :style="{ left: `${label.mittePct}%` }"
        ><span class="jahr__lang">{{ label.text }}</span><span class="jahr__kurz">{{ label.kurz }}</span></span>
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
      <span class="legende__hinweis">
        Jedes Jahr ist so breit wie seine Einträge. Klick auf eine Marke springt zum Eintrag im Protokoll.
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.strahl {
  margin-top: clamp(2rem, 5vw, 3rem);
}

.strahl__flaeche {
  position: relative;
}

/* Bänder reichen vom Plot bis unter die Meilensteine, nicht in die Jahreslabels */
.strahl__baender {
  position: absolute;
  inset: 0 0 1.75rem 0;
  pointer-events: none;
}

.band {
  position: absolute;
  top: 0;
  bottom: 0;
}

.band--getoent {
  background: rgba(255, 255, 255, 0.028);
}

.band--leer {
  background-image: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0 1px,
    transparent 1px 5px
  );
}

.strahl__plot {
  position: relative;
  height: clamp(170px, 26vw, 260px);
}

/* Trefferfläche = der ganze Platz des Eintrags; der Strich nimmt 60 % davon ein */
.marke {
  position: absolute;
  bottom: 0;
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
  width: clamp(2px, 60%, 14px);
  height: var(--h);
  /* oberes Ende abgerundet, an der Achse gerade */
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, var(--color-accent-400), var(--color-accent-600));
  transition: background-color 0.15s, box-shadow 0.15s, filter 0.15s;
}

.marke--ausfall .marke__strich {
  background: transparent;
  border: 1px solid var(--color-steel-500);
  border-bottom: 0;
}

.marke:hover .marke__strich,
.marke--aktiv .marke__strich {
  filter: brightness(1.25);
  box-shadow: 0 0 14px rgba(88, 197, 187, 0.5);
}

.marke--ausfall.marke--aktiv .marke__strich,
.marke--ausfall:hover .marke__strich {
  filter: none;
  box-shadow: none;
  border-color: var(--color-steel-200);
}

.strahl__achse {
  position: relative;
  height: 1px;
  background: var(--color-steel-500);
}

.strahl__meilensteine {
  position: relative;
  height: 26px;
}

.raute {
  position: absolute;
  top: 0;
  height: 100%;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  background: none;
  border: 0;
  padding: 0;
}

.raute__form {
  width: 9px;
  height: 9px;
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
  height: 1.75rem;
}

.jahr {
  position: absolute;
  top: 0.45rem;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-400);
}

.jahr--phase {
  color: var(--color-steel-500);
  letter-spacing: 0.04em;
}

.jahr__kurz {
  display: none;
}

/* Auf schmalen Bildschirmen nur Rand- und starke Jahre, und die nur zweistellig („’11“),
   sonst stoßen die Zahlen zusammen */
@media (max-width: 639px) {
  .jahr--neben {
    display: none;
  }

  .jahr__lang {
    display: none;
  }

  .jahr__kurz {
    display: inline;
  }
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
  width: 6px;
  height: 14px;
  border-radius: 2px 2px 0 0;
  background: var(--color-accent-500);
}

.legende__strich--hohl {
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
</style>
