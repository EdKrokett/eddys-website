<script setup lang="ts">
import type { CvChapter } from '#shared/types/cv'

/**
 * Die Kapitelübersicht direkt nach dem Intro — beantwortet "was kommt noch?", bevor
 * jemand in die Tapete scrollt (Eddys Anstoß, 30.08.2026).
 *
 * Bewusst reine Anker-Links, kein JavaScript: Das ist ein Inhaltsverzeichnis, keine
 * Anwendung. Der weiche Sprung kommt aus `scroll-behavior: smooth` in main.css, der
 * Abstand zur Überschrift aus dem `scroll-margin-top` der Zielsektion.
 *
 * Optisch das Haarlinien-Raster der Fakten-Leiste darüber — dieselbe Bauart, damit die
 * beiden Blöcke als ein zusammengehörendes Instrument gelesen werden und nicht als
 * zwei Widgets.
 */
defineProps<{ chapters: CvChapter[] }>()
</script>

<template>
  <nav class="chapters" aria-label="Inhalt dieser Seite">
    <a
      v-for="chapter in chapters"
      :key="chapter.id"
      :href="`#${chapter.id}`"
      class="chapter"
    >
      <span class="chapter__head">
        <span class="chapter__num">{{ chapter.num }}</span>
        <span class="chapter__mark" aria-hidden="true" />
      </span>

      <span class="chapter__title">{{ chapter.title }}</span>
      <span class="chapter__teaser">{{ chapter.teaser }}</span>

      <span class="chapter__metrics">
        <span v-for="metric in chapter.metrics" :key="metric" class="chapter__metric">
          {{ metric }}
        </span>
      </span>

      <span class="chapter__go" aria-hidden="true">
        <Icon name="lucide:arrow-down-right" class="size-4" />
      </span>
    </a>
  </nav>
</template>

<style scoped>
/* 1px-Gap auf dunklem Grund: die Trennlinien sind der durchscheinende Hintergrund —
   gleiche Bauart wie .facts auf der Seite, damit beide Raster exakt gleich sitzen. */
.chapters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}
@media (min-width: 900px) {
  .chapters {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.chapter {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.25rem 1.5rem;
  background: var(--color-graphite-900);
  transition: background 260ms ease;
}
.chapter:hover {
  background: var(--color-graphite-850);
}

/* Aufziehender Index über der Kachel — das Motiv, das auch Sektionsköpfe tragen. */
.chapter::before {
  content: '';
  position: absolute;
  inset: -1px auto auto -1px;
  width: 0;
  height: 2px;
  background: var(--color-accent-500);
  transition: width 420ms cubic-bezier(0.16, 1, 0.3, 1);
}
.chapter:hover::before,
.chapter:focus-visible::before {
  width: calc(100% + 2px);
}

.chapter__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chapter__num {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.1em;
  color: var(--color-accent-300);
}

.chapter__mark {
  flex: 1;
  height: 1px;
  background: var(--color-graphite-700);
}

.chapter__title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--color-steel-100);
}

.chapter__teaser {
  font-size: var(--text-sm);
  line-height: 1.55;
  color: var(--color-steel-400);
}

/*
 * Kennzahlen ohne Trennzeichen, nur durch Abstand geschieden.
 *
 * Zwei Varianten mit Punkt sind daran gescheitert, dass die dritte Kennzahl im
 * Datenblatt-Kapitel umbricht: Vorangestellt begann die neue Zeile mit "·",
 * nachgestellt hing der Punkt am Ende der ersten. CSS kann ein Trennzeichen an
 * Zeilenenden nicht unterdrücken — also gar keins. Der großzügige Abstand trennt
 * in Mono ohnehin deutlich und liest sich wie eine Instrumentenanzeige.
 */
.chapter__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
}

.chapter__metric {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  color: var(--color-steel-600);
}

.chapter__go {
  position: absolute;
  top: 1.15rem;
  right: 1.15rem;
  color: var(--color-graphite-600);
  transition: color 220ms ease, translate 320ms cubic-bezier(0.16, 1, 0.3, 1);
}
.chapter:hover .chapter__go {
  color: var(--color-accent-400);
  translate: 0.15rem 0.15rem;
}
</style>
