<script setup lang="ts">
import type { AboutPhoto } from '#shared/types/ueber-mich'

/**
 * Ein Foto als Tafel: Haarlinienrahmen, Passermarken an den Ecken, darunter eine
 * Mono-Unterschrift. Die Sprache eines technischen Tafelwerks
 * hält die farbigen, lauten Lauffotos im Präzisionswerk-Design zusammen.
 * Konzept: docs/ueber-mich-einstieg.md.
 */
const props = withDefaults(defineProps<{
  photo: AboutPhoto
  /** Responsive Breiten für NuxtImg, abhängig vom Platz im Raster. */
  sizes: string
  /** Im ersten Bildschirm sofort laden statt lazy. */
  eager?: boolean
}>(), {
  eager: false,
})
</script>

<template>
  <figure class="plate">
    <div class="plate__frame">
      <NuxtImg
        :src="props.photo.src"
        :alt="props.photo.alt"
        :width="props.photo.width"
        :height="props.photo.height"
        :sizes="props.sizes"
        :loading="props.eager ? 'eager' : 'lazy'"
        :fetchpriority="props.eager ? 'high' : 'auto'"
        format="webp"
        quality="82"
        class="plate__img"
      />
      <span class="plate__mark plate__mark--tl" aria-hidden="true" />
      <span class="plate__mark plate__mark--tr" aria-hidden="true" />
      <span class="plate__mark plate__mark--bl" aria-hidden="true" />
      <span class="plate__mark plate__mark--br" aria-hidden="true" />
    </div>

    <figcaption class="plate__caption">
      {{ props.photo.caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.plate {
  position: relative;
}

/*
 * Innenabstand zwischen Rahmen und Bild wie das Passepartout einer Tafel. Das Bild
 * selbst bekommt keine Rundung: --ui-radius ist ohnehin fast 0, und eine Tafel ist
 * rechtwinklig.
 */
.plate__frame {
  position: relative;
  padding: 0.5rem;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
}

.plate__img {
  display: block;
  width: 100%;
  height: auto;
  /* Minimal zurückgenommen, damit die Farben des Color Run nicht aus dem dunklen
     Grund herausschreien. Beim Hover die volle Sättigung. */
  filter: saturate(0.88) contrast(1.02);
  transition: filter 500ms ease;
}
.plate:hover .plate__img {
  filter: none;
}

/*
 * Passermarken: kleine Winkel, die über die Ecken des Rahmens hinausragen, wie die
 * Schnittmarken auf einem Druckbogen. Je ein Winkel aus zwei Rändern.
 */
.plate__mark {
  position: absolute;
  width: 0.875rem;
  height: 0.875rem;
  border-color: var(--color-accent-500);
  border-style: solid;
  border-width: 0;
  pointer-events: none;
}
.plate__mark--tl { top: -0.3125rem; left: -0.3125rem; border-top-width: 1px; border-left-width: 1px; }
.plate__mark--tr { top: -0.3125rem; right: -0.3125rem; border-top-width: 1px; border-right-width: 1px; }
.plate__mark--bl { bottom: -0.3125rem; left: -0.3125rem; border-bottom-width: 1px; border-left-width: 1px; }
.plate__mark--br { bottom: -0.3125rem; right: -0.3125rem; border-bottom-width: 1px; border-right-width: 1px; }

.plate__caption {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.875rem;
  margin-top: 0.875rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  line-height: 1.5;
  color: var(--color-steel-400);
}
</style>
