<script setup lang="ts">
const { filteredPosts, searchQuery, status } = useBlog()

const route = useRoute()
const initialQuery = route.query.q
if (typeof initialQuery === 'string') {
  searchQuery.value = initialQuery
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatExcerpt(text: string, max = 160) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-16">
    <p class="font-mono text-xs tracking-[0.3em] text-steel-400 uppercase">
      Blog
    </p>
    <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">
      Alle Beiträge
    </h1>

    <div class="mt-8 flex items-center gap-2 rounded-full border border-graphite-600 px-4 py-2.5">
      <Icon name="lucide:search" class="size-4 shrink-0 text-steel-400" />
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Beiträge durchsuchen …"
        class="w-full bg-transparent text-sm text-white placeholder:text-steel-400 focus:outline-none"
      >
    </div>

    <div v-if="status === 'pending'" class="mt-10 text-steel-400">
      Lade Beiträge …
    </div>
    <div v-else-if="status === 'error'" class="mt-10 text-swiss-400">
      Beiträge konnten gerade nicht geladen werden.
    </div>
    <div v-else-if="filteredPosts.length === 0" class="mt-10 text-steel-400">
      Keine Beiträge gefunden.
    </div>
    <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="post in filteredPosts"
        :key="post.id"
        :to="`/blog/${post.slug}`"
        class="rounded-2xl border border-graphite-700 bg-graphite-800/60 p-5 transition hover:border-swiss-600"
      >
        <NuxtImg
          v-if="post.featuredImage"
          :src="post.featuredImage"
          :alt="post.title"
          class="mb-4 h-36 w-full rounded-lg object-cover"
          loading="lazy"
        />
        <p class="font-mono text-xs text-steel-500">
          {{ formatDate(post.date) }}
        </p>
        <h2 class="mt-2 font-display text-lg font-semibold" v-text="post.title" />
        <p class="mt-2 text-sm text-steel-400" v-text="formatExcerpt(post.excerpt)" />
      </NuxtLink>
    </div>
  </div>
</template>
