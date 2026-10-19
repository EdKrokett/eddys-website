<script setup lang="ts">
/**
 * Einheitlicher Sektionskopf: Mono-Kicker mit Indexstrich über einer Fraunces-
 * Überschrift. Hält den Rhythmus über alle Seiten gleich.
 *
 * Der Vorspann kommt entweder als `lead`-Prop (reiner Text, der Normalfall) oder
 * über den `lead`-Slot, wenn er Auszeichnung braucht — etwa einen Link mitten im
 * Satz. Der Slot gewinnt, wenn beides gesetzt ist.
 *
 * Die Klassen heißen bewusst `section-head`, nicht `head`: Das Wurzelelement einer
 * Komponente trägt auch das Scope-Attribut der Elternseite. Mehrere Seiten haben ein
 * eigenes scoped `.head` für ihren Seitenkopf, und das traf hier mit (dunkler Kasten
 * um jeden Sektionskopf auf /1apreis, docs/error-catalog.md).
 */
defineProps<{
  kicker: string
  title: string
  lead?: string
}>()

const slots = useSlots()
</script>

<template>
  <header class="section-head">
    <p class="kicker">
      <span class="section-head__mark" aria-hidden="true" />{{ kicker }}
    </p>

    <h2 class="section-head__title">
      {{ title }}
    </h2>

    <p v-if="slots.lead || lead" class="section-head__lead">
      <slot name="lead">{{ lead }}</slot>
    </p>
  </header>
</template>

<style scoped>
.section-head__mark {
  width: 2rem;
  height: 2px;
  background: var(--color-accent-400);
}

.section-head__title {
  margin-top: 1rem;
  font-size: clamp(1.6rem, 3.2vw, 2.35rem);
  line-height: 1.1;
  color: var(--color-steel-100);
}

.section-head__lead {
  margin-top: 1.15rem;
  max-width: 40rem;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-steel-300);
}
</style>
