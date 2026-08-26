<script setup lang="ts">
import type { CvSkillGroup } from '#shared/types/cv'

/**
 * Kuratierte Skills mit Stärke-Skala (Eddys Wahl gegenüber "nur Liste" und
 * "alle ~70 filterbar"). Die Skala ist als Segmentanzeige gebaut, nicht als
 * weicher Balken — passt zum Instrumenten-Konzept und liest sich exakt.
 *
 * Die Werte sind Selbsteinschätzungen aus dem team-neusta-Kompetenzprofil;
 * die vollständige Liste steht in docs/content-sammlung.md.
 */
const SEGMENTS = 5

defineProps<{ groups: CvSkillGroup[] }>()
</script>

<template>
  <div class="skills">
    <section v-for="group in groups" :key="group.title" class="skills__group">
      <h3 class="skills__group-title">
        {{ group.title }}
      </h3>

      <ul class="skills__list">
        <li v-for="skill in group.skills" :key="skill.name" class="skills__item">
          <span class="skills__name">{{ skill.name }}</span>

          <span
            class="skills__meter"
            role="img"
            :aria-label="`${skill.name}: ${skill.level} von ${SEGMENTS}`"
          >
            <span
              v-for="segment in SEGMENTS"
              :key="segment"
              class="skills__segment"
              :class="{ 'skills__segment--on': segment <= skill.level }"
            />
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.skills {
  display: grid;
  gap: 2.5rem;
}
@media (min-width: 768px) {
  .skills {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 3rem 2.5rem;
  }
}

.skills__group-title {
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--color-graphite-700);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-400);
}

.skills__list {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skills__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.skills__name {
  font-size: 0.9rem;
  color: var(--color-steel-200);
}

/* Segmentanzeige statt weichem Balken — exakt ablesbar. */
.skills__meter {
  display: inline-flex;
  gap: 3px;
  flex: none;
}

.skills__segment {
  width: 14px;
  height: 3px;
  background: var(--color-graphite-700);
}
.skills__segment--on {
  background: var(--color-swiss-500);
}
</style>
