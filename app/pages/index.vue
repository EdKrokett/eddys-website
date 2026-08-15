<script setup lang="ts">
const { filteredPosts, status } = useBlog()

const recentPosts = computed(() => filteredPosts.value.slice(0, 3))

function formatExcerpt(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}
</script>

<template>
  <div>
    <!-- ═══════════════ HERO ═══════════════ -->
    <section class="relative overflow-hidden border-b border-graphite-700">
      <div
        class="pointer-events-none absolute inset-0"
        style="background: radial-gradient(60% 50% at 50% 0%, rgb(200 16 46 / 12%), transparent 70%);"
      />

      <div class="relative mx-auto max-w-5xl px-6 pt-24 pb-16 text-center sm:pt-32">
        <p class="font-mono text-xs tracking-[0.3em] text-steel-400 uppercase">
          Eduard Andrae
        </p>
        <h1 class="mt-6 text-4xl leading-tight font-semibold text-balance sm:text-6xl">
          Vielseitig wie ein<br class="hidden sm:block">
          Schweizer Taschenmesser.
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-base text-steel-400 sm:text-lg">
          Jedes Werkzeug ein Skill. Unten aufklappen — mehr über mich folgt in Kürze.
        </p>
      </div>

      <SkillKnife class="relative" />

      <div class="h-16 sm:h-24" />
    </section>

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
