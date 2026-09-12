<script setup lang="ts">
/**
 * Einheitlicher Sektionskopf: Mono-Kicker mit Indexstrich über einer Fraunces-
 * Überschrift. Hält den Rhythmus über alle Seiten gleich.
 *
 * Der Vorspann kommt entweder als `lead`-Prop (reiner Text, der Normalfall) oder
 * über den `lead`-Slot, wenn er Auszeichnung braucht — etwa einen Link mitten im
 * Satz. Der Slot gewinnt, wenn beides gesetzt ist.
 */
defineProps<{
  kicker: string
  title: string
  lead?: string
}>()

const slots = useSlots()
</script>

<template>
  <header class="head">
    <p class="kicker">
      <span class="head__mark" aria-hidden="true" />{{ kicker }}
    </p>

    <h2 class="head__title">
      {{ title }}
    </h2>

    <p v-if="slots.lead || lead" class="head__lead">
      <slot name="lead">{{ lead }}</slot>
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
