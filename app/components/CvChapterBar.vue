<script setup lang="ts">
import type { CvChapter } from '#shared/types/cv'

/**
 * Die Sticky-Leiste unter dem Header — beantwortet "wo bin ich?", während
 * CvChapters.vue oben "was kommt noch?" beantwortet. Beide lesen dasselbe
 * Kapitelmodell, es gibt keine zweite Liste, die auseinanderlaufen könnte.
 *
 * Sie erscheint, sobald `activeId` gesetzt ist — also genau dann, wenn die erste
 * Kapitel-Sektion den oberen Rand erreicht und die Übersicht herausgescrollt ist.
 * Deshalb braucht es kein zusätzliches Beobachtungselement für "Intro vorbei"
 * (siehe docs/ueber-mich-navigation.md).
 */
defineProps<{
  chapters: CvChapter[]
  activeId: string | null
}>()
</script>

<template>
  <div class="bar" :class="{ 'bar--visible': activeId !== null }">
    <div class="bar__inner">
      <UContainer>
        <nav class="bar__nav" aria-label="Kapitel dieser Seite">
          <a
            v-for="chapter in chapters"
            :key="chapter.id"
            :href="`#${chapter.id}`"
            class="bar__link"
            :class="{ 'bar__link--active': chapter.id === activeId }"
            :aria-current="chapter.id === activeId ? 'true' : undefined"
          >
            <span class="bar__num">{{ chapter.num }}</span>
            <span class="bar__label">{{ chapter.label }}</span>
          </a>
        </nav>
      </UContainer>

      <!--
        Lesefortschritt als reines CSS über eine Scroll-Timeline: kein Scroll-Listener,
        kein Layout-Thrashing. Wo der Browser das nicht kann (Stand 2026: Firefox),
        bleibt der Balken schlicht auf 0 stehen — akzeptierter Ausfall, kein Fehler.
      -->
      <span class="bar__progress" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
/*
 * Höhe hier UND als HEADER_PX/BAR_PX im Aktivierungsband von useScrollSpy.ts:
 * IntersectionObserver rechnet in Pixeln, CSS hier in rem. Ändert sich die eine
 * Seite, gehört die andere mitgezogen.
 */
.bar {
  --bar-height: 3rem;

  position: sticky;
  /* Direkt unter dem h-16-Header aus Header.vue. */
  top: 4rem;
  /* Unter dem Header (z-index 50), über dem Seiteninhalt. */
  z-index: 40;
  height: 0;
}

.bar__inner {
  height: var(--bar-height);
  background: color-mix(in oklab, var(--color-graphite-950) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-graphite-700);

  /* Vor dem ersten Kapitel unsichtbar und nicht anklickbar. */
  opacity: 0;
  translate: 0 -0.5rem;
  pointer-events: none;
  transition: opacity 320ms ease, translate 320ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bar--visible .bar__inner {
  opacity: 1;
  translate: 0 0;
  pointer-events: auto;
}

.bar__nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: var(--bar-height);
  /* Mobil reicht die Breite nicht für vier Kapitel — dann horizontal scrollen,
     statt zu quetschen oder umzubrechen (die Leiste hat eine feste Höhe). */
  overflow-x: auto;
  scrollbar-width: none;
  /* Zur Container-Kante ausbluten lassen, damit am Rand nichts abgeschnitten wirkt. */
  margin-inline: -0.6rem;
  padding-inline: 0.6rem;
}
.bar__nav::-webkit-scrollbar {
  display: none;
}

.bar__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  padding: 0.35rem 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--color-steel-500);
  transition: color 200ms ease;
}
.bar__link:hover {
  color: var(--color-steel-200);
}

/* Aktives Kapitel: Teal-Marke unter dem Label — der Indexstrich des Zifferblatts. */
.bar__link::after {
  content: '';
  position: absolute;
  inset: auto 0.6rem 0 0.6rem;
  height: 2px;
  background: var(--color-accent-500);
  scale: 0 1;
  transform-origin: left;
  transition: scale 320ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bar__link--active {
  color: var(--color-steel-100);
}
.bar__link--active::after {
  scale: 1 1;
}

.bar__num {
  font-variant-numeric: tabular-nums;
  color: var(--color-accent-300);
}
/*
 * Die Labels bleiben auch auf 375 px stehen: Die Leiste scrollt horizontal, es
 * ist also Platz da. Ohne sie blieben nur nackte Nummern ("01 02 03 04") übrig,
 * die niemandem sagen, wo er ist — real beobachtet und wieder verworfen.
 */

/* ── Lesefortschritt ────────────────────────────────────────────────────── */
.bar__progress {
  display: block;
  height: 1px;
  background: var(--color-accent-500);
  transform-origin: left;
  scale: 0 1;
}

@supports (animation-timeline: scroll()) {
  @media screen and (prefers-reduced-motion: no-preference) {
    .bar__progress {
      animation: bar-progress linear both;
      animation-timeline: scroll(root block);
    }
  }
}

@keyframes bar-progress {
  from { scale: 0 1; }
  to { scale: 1 1; }
}
</style>
