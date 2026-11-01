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

/**
 * Ohne Klick keine Verbindung zu Drittanbietern, so sagt es die Datenschutzerklärung zu:
 * Bilder von fremden Servern laufen über den eigenen Bild-Proxy, fremde Einbettungen
 * (YouTube, Vimeo, …) werden zu Platzhaltern. Hier statt in der Server-Route, weil nur
 * `useImage()` die URL-Form des jeweiligen Bild-Providers kennt.
 * Hintergrund: docs/blog-einbettungen.md.
 */
const img = useImage()
const content = computed(() => {
  const withProxiedImages = proxyForeignImages(post.value?.content, url =>
    img(url, { width: 640, quality: 80 }))

  return guardEmbeds(withProxiedImages, {
    youtubeThumbnail: id => img(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, {
      width: 640,
      format: 'webp',
      quality: 75,
    }),
  })
})

/** Ein Listener für alle Platzhalter, weil `v-html` keine Vue-Handler kennt. */
function onContentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return
  const placeholder = target.closest('.embed-consent__button')?.closest('.embed-consent')
  if (placeholder instanceof HTMLElement) activateEmbed(placeholder)
}

/** Banner-Zuschnitt oder ganzes Bild, je nach Seitenverhältnis (shared/utils/hero-bild.ts). */
const heroFormat = computed(() => heroBildFormat(post.value?.featuredImageSize))

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
      <!--
        Hochformat und fast quadratische Bilder ganz zeigen statt beschneiden: Der mittige
        Zuschnitt auf ein Banner ließ beim Halloween-Beitrag die Köpfe weg. Dahinter dieselbe
        Datei unscharf als Füllung (gleiche URL, also kein zweiter Download).
      -->
      <div v-if="heroFormat === 'ganz'" class="post__hero post__hero--ganz">
        <NuxtImg
          :src="post.featuredImage"
          alt=""
          aria-hidden="true"
          width="1200"
          densities="1x 2x"
          format="webp"
          quality="78"
          class="post__hero-fuellung"
        />
        <NuxtImg
          :src="post.featuredImage"
          :alt="post.title"
          width="1200"
          densities="1x 2x"
          format="webp"
          quality="78"
          class="post__hero-bild"
        />
      </div>
      <NuxtImg
        v-else
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
        <div class="wp-content" @click="onContentClick" v-html="content" />

        <div v-if="post.tags.length" class="post__tags">
          <span class="post__tags-label">Schlagwörter</span>
          <span v-for="tag in post.tags" :key="tag.id" class="post__tag">
            {{ tag.name }}
          </span>
        </div>
      </div>

      <BlogComments :slug="post.slug" />
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
  font-size: clamp(1.75rem, 4.2vw, 2.75rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: var(--color-steel-100);
}

.post__hero-img {
  width: 100%;
  max-height: 30rem;
  object-fit: cover;
  /* Leicht über der Mitte: Gesichter stehen meist im oberen Drittel */
  object-position: 50% 30%;
  margin-top: clamp(2rem, 4vw, 3rem);
  border: 1px solid var(--color-graphite-700);
}

.post__hero--ganz {
  position: relative;
  display: flex;
  justify-content: center;
  height: clamp(22rem, 52vw, 34rem);
  margin-top: clamp(2rem, 4vw, 3rem);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
}

/* Dieselbe Datei, stark vergrößert, unscharf und abgedunkelt: füllt die Breite ohne neues Motiv */
.post__hero-fuellung {
  position: absolute;
  inset: -10%;
  z-index: -1;
  width: 120%;
  height: 120%;
  object-fit: cover;
  filter: blur(36px) saturate(0.8) brightness(0.45);
}

.post__hero-bild {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 1.5rem 4rem rgba(0, 0, 0, 0.55);
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
