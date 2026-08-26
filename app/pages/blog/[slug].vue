<script setup lang="ts">
import type { WordPressBlogPostDetail } from '#shared/types/wordpress'

const route = useRoute()
const slug = route.params.slug as string

const { data: post, status } = await useFetch<WordPressBlogPostDetail>(`/api/blog/${slug}`, {
  key: `blog-post-${slug}`,
})

if (status.value === 'error' || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blogbeitrag nicht gefunden' })
}

useSeoMeta({
  title: () => `${post.value?.title ?? 'Beitrag'} — Eduard Andrae`,
  description: () => post.value?.excerpt ?? '',
  ogImage: () => post.value?.featuredImage ?? '',
})
</script>

<template>
  <article v-if="post" class="post">
    <!-- ═══════════════ KOPF ═══════════════ -->
    <header class="post__head">
      <UContainer>
        <NuxtLink to="/blog" class="post__back">
          <Icon name="lucide:arrow-left" class="size-3.5" />
          Alle Beiträge
        </NuxtLink>

        <p class="post__meta">
          <NuxtTime
            :datetime="post.date"
            day="2-digit"
            month="long"
            year="numeric"
            locale="de-DE"
          />
          <template v-if="post.categories.length">
            <span class="post__meta-sep" aria-hidden="true" />
            <span class="post__cat">{{ post.categories[0]!.name }}</span>
          </template>
        </p>

        <h1 class="post__title" v-text="post.title" />
      </UContainer>
    </header>

    <!-- ═══════════════ BEITRAGSBILD ═══════════════ -->
    <UContainer v-if="post.featuredImage">
      <NuxtImg
        :src="post.featuredImage"
        :alt="post.title"
        width="1200"
        densities="1x 2x"
        format="webp"
        quality="78"
        class="post__hero-img"
      />
    </UContainer>

    <!-- ═══════════════ INHALT ═══════════════ -->
    <UContainer>
      <div class="post__body">
        <!-- v-html bewusst: Content stammt aus der eigenen, vertrauten WP-Instanz.
             Titel/Excerpt laufen dagegen über v-text (siehe BlogCard.vue). -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="wp-content" v-html="post.content" />

        <div v-if="post.tags.length" class="post__tags">
          <span class="post__tags-label">Schlagwörter</span>
          <span v-for="tag in post.tags" :key="tag.id" class="post__tag">
            {{ tag.name }}
          </span>
        </div>
      </div>
    </UContainer>

    <!-- ═══════════════ ABSCHLUSS ═══════════════ -->
    <div class="post__foot">
      <UContainer>
        <NuxtLink to="/blog" class="post__foot-link">
          <Icon name="lucide:arrow-left" class="size-4" />
          Weiter im Blog
        </NuxtLink>
      </UContainer>
    </div>
  </article>
</template>

<style scoped>
.post__head {
  padding: clamp(2.5rem, 6vw, 4rem) 0 clamp(2rem, 4vw, 3rem);
  background:
    radial-gradient(70% 80% at 10% 0%, rgba(33, 164, 163, 0.06) 0%, transparent 60%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

.post__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-400);
  transition: color 200ms ease;
}
.post__back:hover {
  color: var(--color-accent-400);
}

.post__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
}

.post__meta-sep {
  width: 1px;
  height: 0.75rem;
  background: var(--color-graphite-600);
}

.post__cat {
  text-transform: uppercase;
  color: var(--color-accent-400);
}

.post__title {
  margin-top: 0.875rem;
  max-width: 46rem;
  font-size: clamp(1.9rem, 5vw, 3.25rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: var(--color-steel-100);
}

.post__hero-img {
  width: 100%;
  max-height: 30rem;
  object-fit: cover;
  margin-top: clamp(2rem, 4vw, 3rem);
  border: 1px solid var(--color-graphite-700);
}

/* Lesespalte bewusst schmal — Fließtext bleibt lesbar. */
.post__body {
  max-width: 44rem;
  margin-inline: auto;
  padding: clamp(2.5rem, 6vw, 4rem) 0 clamp(3rem, 6vw, 4.5rem);
}

.post__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  padding-top: 1.75rem;
  border-top: 1px solid var(--color-graphite-700);
}

.post__tags-label {
  margin-right: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-600);
}

.post__tag {
  border: 1px solid var(--color-graphite-700);
  padding: 0.25rem 0.7rem;
  font-size: var(--text-xs);
  color: var(--color-steel-400);
}

.post__foot {
  border-top: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
  padding: clamp(2.5rem, 5vw, 3.5rem) 0;
}

.post__foot-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  border-bottom: 1px solid var(--color-accent-500);
  padding-bottom: 0.35rem;
  transition: color 200ms ease;
}
.post__foot-link:hover {
  color: var(--color-accent-400);
}
</style>
