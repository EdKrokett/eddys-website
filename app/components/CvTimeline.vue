<script setup lang="ts">
import type { CvStation } from '#shared/types/cv'

/**
 * Werdegang als Chronograf-Skala: eine durchgehende Haarlinie mit Indexpunkten,
 * Jahreszahlen in Mono. Laufende Stationen bekommen einen roten, pulsierenden
 * Punkt — der einzige bewegte Akzent auf der Seite.
 *
 * Seit 30.08.2026 sind die Beschreibungen AUFKLAPPBAR (Eddys "lange Tapete"): Alle
 * acht Stationen bleiben als kompakte Zeilen sichtbar, das Skelett der 35 Jahre steht
 * damit auf einem Bildschirm statt auf dreien. Die laufenden Stationen sind offen
 * vorbelegt, gesteuert über `openKeys` von der Seite — dieselbe Quelle, aus der auch
 * die Jahresachse ihre Hervorhebung zieht.
 *
 * Bewusst KEIN <details>/<summary>: dessen Inhalt lässt sich weder sauber animieren
 * noch zuverlässig ausdrucken. Stattdessen ein Button mit aria-expanded/aria-controls
 * und ein Panel über `grid-template-rows: 0fr → 1fr`. Der Text steht damit IMMER im
 * DOM — für Suchmaschinen, Vorlesesoftware und den Druck ändert sich nichts.
 */
const props = defineProps<{
  stations: CvStation[]
  /** Schlüssel der aufgeklappten Stationen (`stationKey`). */
  openKeys: string[]
  /** Referenzjahr aus dem SSR-Payload — nie ein frisches `new Date()` (Hydration). */
  nowYear: number
}>()

const emit = defineEmits<{ toggle: [key: string] }>()

const items = computed(() =>
  props.stations.map(station => ({
    station,
    key: stationKey(station),
    duration: formatDuration(station, props.nowYear),
  })),
)

const isOpen = (key: string) => props.openKeys.includes(key)
</script>

<template>
  <ol class="timeline">
    <li
      v-for="item in items"
      :id="`station-${item.key}`"
      :key="item.key"
      class="timeline__item"
      :class="{ 'timeline__item--open': isOpen(item.key) }"
    >
      <div class="timeline__rail" aria-hidden="true">
        <span
          class="timeline__dot"
          :class="{ 'timeline__dot--current': item.station.current }"
        />
      </div>

      <div class="timeline__content">
        <button
          type="button"
          class="timeline__toggle"
          :aria-expanded="isOpen(item.key)"
          :aria-controls="`station-panel-${item.key}`"
          @click="emit('toggle', item.key)"
        >
          <p class="timeline__period">
            {{ item.station.period }}
            <span class="timeline__duration">{{ item.duration }}</span>
            <span v-if="item.station.current" class="timeline__badge">läuft</span>
          </p>

          <h3 class="timeline__role">
            {{ item.station.role }}
          </h3>

          <p class="timeline__company">
            {{ item.station.company }}
            <span v-if="item.station.location" class="timeline__location">· {{ item.station.location }}</span>
          </p>

          <span class="timeline__sign" aria-hidden="true">
            <span class="timeline__sign-bar" />
            <span class="timeline__sign-bar timeline__sign-bar--v" />
          </span>
        </button>

        <!-- Panel: Höhe animiert über grid-template-rows, Inhalt bleibt im DOM. -->
        <div :id="`station-panel-${item.key}`" class="timeline__panel" role="region">
          <div class="timeline__panel-inner">
            <p class="timeline__description">
              {{ item.station.description }}
            </p>
          </div>
        </div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline__item {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  gap: 0 1.5rem;
  /* Klare Sprungmarke, wenn die Jahresachse hierher springt: Header + Sticky-Leiste
     (7rem) plus Luft. Spiegelt das scroll-margin-top der Sektionen. */
  scroll-margin-top: 9rem;
}
@media (min-width: 768px) {
  .timeline__item {
    grid-template-columns: 1.5rem 1fr;
    gap: 0 2.5rem;
  }
}

/* ── Skala ──────────────────────────────────────────────────────────────── */
.timeline__rail {
  position: relative;
  display: flex;
  justify-content: center;
}
/* Durchgehende Linie, endet beim letzten Eintrag. */
.timeline__rail::before {
  content: '';
  position: absolute;
  inset-block: 0;
  width: 1px;
  background: var(--color-graphite-700);
}
.timeline__item:first-child .timeline__rail::before {
  top: 0.7rem;
}
.timeline__item:last-child .timeline__rail::before {
  bottom: calc(100% - 0.7rem);
}

.timeline__dot {
  position: relative;
  z-index: 1;
  margin-top: 0.5rem;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-graphite-500);
  outline: 4px solid var(--color-graphite-900);
  transition: background 240ms ease;
}
.timeline__dot--current {
  background: var(--color-accent-500);
}
.timeline__item--open .timeline__dot {
  background: var(--color-accent-300);
}
.timeline__dot--current::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid var(--color-accent-500);
  opacity: 0;
  animation: timeline-ping 2.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes timeline-ping {
  0% { opacity: 0.9; transform: scale(0.7); }
  70%, 100% { opacity: 0; transform: scale(1.9); }
}

/* ── Inhalt ─────────────────────────────────────────────────────────────── */
.timeline__content {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-graphite-800);
}
.timeline__item:last-child .timeline__content {
  border-bottom: none;
}
.timeline__item + .timeline__item .timeline__content {
  padding-top: 1.5rem;
}

/* ── Kopfzeile als Schalter ─────────────────────────────────────────────── */
.timeline__toggle {
  position: relative;
  display: block;
  width: 100%;
  padding-right: 2.5rem;
  text-align: left;
  background: none;
  border: none;
}

.timeline__period {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-400);
}

/* Dauer als eigenständige Kennzahl — macht Balkenlängen der Achse im Text nachlesbar. */
.timeline__duration {
  color: var(--color-steel-600);
  letter-spacing: 0.08em;
}
.timeline__duration::before {
  content: '·';
  margin-right: 0.75rem;
  color: var(--color-graphite-600);
}

.timeline__badge {
  border: 1px solid var(--color-accent-700);
  padding: 0.1rem 0.4rem;
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  color: var(--color-accent-300);
}

.timeline__role {
  margin-top: 0.6rem;
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  line-height: 1.2;
  color: var(--color-steel-100);
  transition: color 200ms ease;
}
.timeline__toggle:hover .timeline__role {
  color: var(--color-accent-200);
}

.timeline__company {
  margin-top: 0.35rem;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-brass-400);
}

.timeline__location {
  font-weight: 400;
  color: var(--color-steel-500);
}

/* ── Plus/Minus-Zeichen ─────────────────────────────────────────────────── */
.timeline__sign {
  position: absolute;
  top: 0.9rem;
  right: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.timeline__sign-bar {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--color-steel-500);
  transition: background 200ms ease, rotate 320ms cubic-bezier(0.16, 1, 0.3, 1);
}
/* Der senkrechte Balken dreht beim Aufklappen auf den waagerechten — aus + wird −. */
.timeline__sign-bar--v {
  rotate: 90deg;
}
.timeline__item--open .timeline__sign-bar--v {
  rotate: 0deg;
}
.timeline__toggle:hover .timeline__sign-bar {
  background: var(--color-accent-300);
}

/* ── Aufklapp-Panel ─────────────────────────────────────────────────────── */
/*
 * grid-template-rows 0fr → 1fr ist der einzige Weg, auf eine UNBEKANNTE Inhaltshöhe
 * zu animieren, ohne sie vorher in JavaScript zu messen. `min-height: 0` am Kind ist
 * dabei Pflicht — ohne das ignoriert das Grid-Item die 0fr und bleibt aufgeklappt.
 */
.timeline__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1);
}
.timeline__item--open .timeline__panel {
  grid-template-rows: 1fr;
}

.timeline__panel-inner {
  min-height: 0;
  overflow: hidden;
}

.timeline__description {
  margin-top: 1rem;
  max-width: 42rem;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-300);
  opacity: 0;
  transition: opacity 240ms ease;
}
.timeline__item--open .timeline__description {
  opacity: 1;
  transition-delay: 120ms;
}
</style>
