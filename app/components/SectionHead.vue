<script setup lang="ts">
/**
 * Einheitlicher Sektionskopf: Mono-Kicker mit Indexstrich über einer Fraunces-
 * Überschrift. Hält den Rhythmus über alle Seiten gleich.
 */
defineProps<{
  kicker: string
  title: string
  lead?: string
}>()
</script>

<template>
  <header class="head">
    <p class="kicker">
      <span class="head__mark" aria-hidden="true" />{{ kicker }}
    </p>

    <h2 class="head__title">
      {{ title }}
    </h2>

    <p v-if="lead" class="head__lead">
      {{ lead }}
    </p>
  </header>
</template>

<style scoped>
.head__mark {
  width: 2rem;
  height: 2px;
  background: var(--color-accent-400);
}

.head__title {
  margin-top: 1rem;
  font-size: clamp(1.6rem, 3.2vw, 2.35rem);
  line-height: 1.1;
  color: var(--color-steel-100);
}

.head__lead {
  margin-top: 1.15rem;
  max-width: 40rem;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-steel-300);
}
</style>
