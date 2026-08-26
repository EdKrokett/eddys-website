<script setup lang="ts">
import type { WordPressBlogPost } from '#shared/types/wordpress'

/**
 * Beitragskachel für Startseite und Blog-Übersicht — eine Quelle, damit beide
 * Listen nicht auseinanderlaufen.
 *
 * Titel und Excerpt kommen aus WordPress und werden per `v-text` gerendert
 * (kein `v-html` für Fremdtext); HTML-Entities sind bereits serverseitig
 * dekodiert (shared/utils/html-entities.ts). Lange Titel/Excerpts werden per
 * `line-clamp` gekappt, damit die Kachelhöhen nicht auseinanderlaufen.
 */
defineProps<{ post: WordPressBlogPost }>()
</script>

<template>
  <NuxtLink :to="`/blog/${post.slug}`" class="card">
    <div class="card__media">
      <NuxtImg
        v-if="post.featuredImage"
        :src="post.featuredImage"
        :alt="post.title"
        width="420"
        densities="1x 2x"
        format="webp"
        quality="70"
        loading="lazy"
        decoding="async"
        class="card__img"
      />
      <!-- Ohne Beitragsbild (viele ältere Beiträge): Jahreszahl auf Indexraster
           statt einer leeren Fläche — nimmt das Zifferblatt-Motiv der Seite auf. -->
      <div v-else class="card__placeholder">
        <span class="card__placeholder-rail index-rail" aria-hidden="true" />
        <span class="card__placeholder-year" aria-hidden="true">
          {{ new Date(post.date).getFullYear() }}
        </span>
      </div>
    </div>

    <div class="card__body">
      <p class="card__meta">
        <NuxtTime :datetime="post.date" day="2-digit" month="2-digit" year="numeric" locale="de-DE" />
        <span v-if="post.categories.length" class="card__cat">
          {{ post.categories[0]!.name }}
        </span>
      </p>

      <h3 class="card__title" v-text="post.title" />

      <p v-if="post.excerpt" class="card__excerpt" v-text="post.excerpt" />
    </div>

    <span class="card__arrow" aria-hidden="true">
      <Icon name="lucide:arrow-up-right" class="size-4" />
    </span>
  </NuxtLink>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-850);
  transition: border-color 250ms ease, background 250ms ease, translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.card:hover {
  border-color: var(--color-graphite-500);
  background: var(--color-graphite-800);
  translate: 0 -3px;
}

.card__media {
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: var(--color-graphite-800);
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(0.3);
  transition: filter 400ms ease, scale 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.card:hover .card__img {
  filter: grayscale(0);
  scale: 1.04;
}

/* ── Platzhalter ohne Beitragsbild ──────────────────────────────────────── */
.card__placeholder {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(75% 100% at 50% 100%, rgba(200, 16, 46, 0.1) 0%, transparent 65%),
    var(--color-graphite-900);
}

.card__placeholder-rail {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 10px;
  opacity: 0.55;
}

.card__placeholder-year {
  font-family: var(--font-mono);
  font-size: 2.75rem;
  font-weight: 300;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--color-graphite-600);
  transition: color 350ms ease;
}
.card:hover .card__placeholder-year {
  color: var(--color-steel-600);
}

.card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.25rem 1.375rem 1.75rem;
}

.card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
}

.card__cat {
  border-left: 1px solid var(--color-graphite-600);
  padding-left: 0.75rem;
  text-transform: uppercase;
  color: var(--color-swiss-400);
}

.card__title {
  margin-top: 0.625rem;
  font-size: 1.125rem;
  line-height: 1.35;
  color: var(--color-steel-100);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.card__excerpt {
  margin-top: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-steel-400);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.card__arrow {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  background: var(--color-graphite-950);
  border-left: 1px solid var(--color-graphite-700);
  border-bottom: 1px solid var(--color-graphite-700);
  color: var(--color-steel-400);
  opacity: 0;
  transition: opacity 250ms ease, color 250ms ease;
}
.card:hover .card__arrow {
  opacity: 1;
  color: var(--color-swiss-400);
}
</style>
