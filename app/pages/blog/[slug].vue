<script setup lang="ts">
import type { WordPressBlogPostDetail } from '#shared/types/wordpress'

const route = useRoute()
const slug = route.params.slug as string

const { data: post, status } = await useFetch<WordPressBlogPostDetail>(`/api/blog/${slug}`, {
  key: `blog-post-${slug}`,
})

if (status.value === 'error') {
  throw createError({ statusCode: 404, statusMessage: 'Blogbeitrag nicht gefunden' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <article v-if="post" class="mx-auto max-w-3xl px-6 py-16">
    <NuxtLink to="/blog" class="text-sm font-semibold text-swiss-400 hover:text-swiss-300">
      ← Alle Beiträge
    </NuxtLink>

    <p class="mt-6 font-mono text-xs text-steel-500">
      {{ formatDate(post.date) }}
    </p>
    <h1 class="mt-2 font-display text-3xl font-semibold sm:text-4xl" v-text="post.title" />

    <div class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="tag in post.tags"
        :key="tag.id"
        class="rounded-full border border-graphite-600 px-3 py-1 text-xs text-steel-400"
      >
        {{ tag.name }}
      </span>
    </div>

    <NuxtImg
      v-if="post.featuredImage"
      :src="post.featuredImage"
      :alt="post.title"
      class="mt-8 h-72 w-full rounded-2xl object-cover"
    />

    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="wp-content mt-8" v-html="post.content" />
  </article>
</template>

<style scoped>
/* Kein @tailwindcss/typography im Projekt — minimale manuelle Regeln fürs
   WordPress-HTML, damit Absätze/Überschriften/Links im dunklen Theme lesbar sind. */
.wp-content :deep(p) {
  margin-bottom: 1.25em;
  line-height: 1.75;
  color: #d6d3ca;
}
.wp-content :deep(h2),
.wp-content :deep(h3) {
  margin-top: 1.75em;
  margin-bottom: 0.5em;
}
.wp-content :deep(a) {
  color: #58c5bb;
  text-decoration: underline;
}
.wp-content :deep(img) {
  border-radius: 12px;
  margin: 1.5em 0;
}
.wp-content :deep(ul),
.wp-content :deep(ol) {
  margin: 1em 0 1.25em 1.5em;
  color: #d6d3ca;
}
.wp-content :deep(li) {
  margin-bottom: 0.4em;
}
</style>
