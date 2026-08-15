<script setup lang="ts">
const { filteredPosts, status } = useBlog()

const recentPosts = computed(() => filteredPosts.value.slice(0, 3))

function formatExcerpt(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}
</script>

<template>
  <div>
    <KnifeHero />

    <!-- ═══════════════ ÜBER MICH (Platzhalter) ═══════════════ -->
    <section class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="font-mono text-xs tracking-[0.3em] text-steel-400 uppercase">
        Über mich
      </p>
      <p class="mt-6 text-lg text-steel-300">
        Werdegang, Schwerpunkte und alles, was dieses Messer im Detail kann — dieser
        Abschnitt wird als Nächstes befüllt.
      </p>
    </section>

    <!-- ═══════════════ BLOG-VORSCHAU (live von eduard-andrae.de) ═══════════════ -->
    <section class="border-t border-graphite-700 bg-graphite-950/40">
      <div class="mx-auto max-w-5xl px-6 py-24">
        <div class="mb-10 flex items-end justify-between">
          <div>
            <p class="font-mono text-xs tracking-[0.3em] text-steel-400 uppercase">
              Blog
            </p>
            <h2 class="mt-3 text-2xl font-semibold sm:text-3xl">
              Zuletzt geschrieben
            </h2>
          </div>
        </div>

        <div v-if="status === 'pending'" class="text-steel-400">
          Lade Beiträge …
        </div>
        <div v-else-if="status === 'error'" class="text-swiss-400">
          Beiträge konnten gerade nicht geladen werden.
        </div>
        <div v-else-if="recentPosts.length === 0" class="text-steel-400">
          Noch keine Beiträge gefunden.
        </div>
        <div v-else class="grid gap-6 sm:grid-cols-3">
          <article
            v-for="post in recentPosts"
            :key="post.id"
            class="rounded-2xl border border-graphite-700 bg-graphite-800/60 p-5 transition hover:border-swiss-600"
          >
            <NuxtImg
              v-if="post.featuredImage"
              :src="post.featuredImage"
              :alt="post.title"
              class="mb-4 h-36 w-full rounded-lg object-cover"
              loading="lazy"
            />
            <h3 class="font-display text-lg font-semibold" v-text="post.title" />
            <p class="mt-2 text-sm text-steel-400" v-text="formatExcerpt(post.excerpt)" />
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
