<script setup lang="ts">
import type { CvStation } from '#shared/types/cv'

/**
 * Werdegang als Chronograf-Skala: eine durchgehende Haarlinie mit Indexpunkten,
 * Jahreszahlen in Mono. Laufende Stationen bekommen einen roten, pulsierenden
 * Punkt — der einzige bewegte Akzent auf der Seite.
 */
defineProps<{ stations: CvStation[] }>()
</script>

<template>
  <ol class="timeline">
    <li
      v-for="station in stations"
      :key="`${station.company}-${station.startYear}`"
      class="timeline__item"
    >
      <div class="timeline__rail" aria-hidden="true">
        <span
          class="timeline__dot"
          :class="{ 'timeline__dot--current': station.current }"
        />
      </div>

      <div class="timeline__content">
        <p class="timeline__period">
          {{ station.period }}
          <span v-if="station.current" class="timeline__badge">läuft</span>
        </p>

        <h3 class="timeline__role">
          {{ station.role }}
        </h3>

        <p class="timeline__company">
          {{ station.company }}
          <span v-if="station.location" class="timeline__location">· {{ station.location }}</span>
        </p>

        <p class="timeline__description">
          {{ station.description }}
        </p>
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
}
.timeline__dot--current {
  background: var(--color-accent-500);
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
  padding-bottom: 3.75rem;
}
.timeline__item:last-child .timeline__content {
  padding-bottom: 0;
}

.timeline__period {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-400);
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

.timeline__description {
  margin-top: 1rem;
  max-width: 42rem;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-300);
}
</style>
