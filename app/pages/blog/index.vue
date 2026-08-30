<script setup lang="ts">
const {
  filteredPosts,
  posts,
  searchQuery,
  activeCategory,
  status,
  loadMore,
  hasMore,
  isLoadingMore,
} = useBlog({ paginated: true })

const route = useRoute()

// Suchbegriff aus der URL übernehmen, damit sich ein Suchergebnis teilen und
// verlinken lässt (`/blog?q=marathon`). Innerhalb der Seite läuft die Suche über
// das Feld im Filterbereich.
//
// Bewusst in `onMounted` und NICHT im Setup: Diese Seite wird per ISR am Edge
// gecacht (routeRules in nuxt.config.ts), und alle Query-Varianten teilen sich dort
// einen Eintrag. Würde der Server bereits gefiltert rendern, bekäme der nächste
// Besucher das Suchergebnis eines fremden Besuchers ausgeliefert. Serverseitig
// entsteht deshalb immer die ungefilterte Liste; der Filter greift erst nach der
// Hydration. Im Setup gelesen, würde der Client sofort anders rendern als das
// gecachte HTML — ein Hydration-Mismatch. Siehe docs/performance.md, Schicht 4.
onMounted(() => {
  const initialQuery = route.query.q
  if (typeof initialQuery === 'string') {
    searchQuery.value = initialQuery
  }
})

/** Nur Kategorien anzeigen, zu denen es auch wirklich Beiträge gibt. */
const availableCategories = computed(() =>
  BLOG_CATEGORIES.filter(cat =>
    posts.value.some(post => post.categories.some(c => c.slug === cat.slug)),
  ),
)

function toggleCategory(slug: string) {
  activeCategory.value = activeCategory.value === slug ? null : slug
}

function resetFilters() {
  searchQuery.value = ''
  activeCategory.value = null
}

const hasActiveFilter = computed(() =>
  searchQuery.value.trim().length > 0 || activeCategory.value !== null,
)

useSeoMeta({
  title: 'Blog — Eduard Andrae',
  description:
    'Laufen, Wandern und Gedanken übers Bloggen. Seit 2006 dokumentiert Eduard Andrae seine Wettkämpfe, Touren und Erfahrungen.',
})
</script>

<template>
  <div>
    <!-- ═══════════════ KOPF ═══════════════ -->
    <section class="head">
      <UContainer>
        <p class="kicker">
          <span class="head__mark" aria-hidden="true" />Seit 2006
        </p>

        <h1 class="head__title">
          Der Blog
        </h1>

        <p class="head__lead">
          Angefangen als Protokoll eines Rauchers, der Marathon laufen wollte.
          Heute: Laufen, Wandern und alles, was beim Bloggen dazugehört.
        </p>
      </UContainer>
    </section>

    <!-- ═══════════════ FILTER ═══════════════ -->
    <section class="filters">
      <UContainer>
        <div class="filters__inner">
          <div class="filters__cats">
            <button
              type="button"
              class="chip"
              :class="{ 'chip--active': activeCategory === null }"
              @click="activeCategory = null"
            >
              Alle
            </button>
            <button
              v-for="cat in availableCategories"
              :key="cat.slug"
              type="button"
              class="chip"
              :class="{ 'chip--active': activeCategory === cat.slug }"
              @click="toggleCategory(cat.slug)"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="filters__search">
            <Icon name="lucide:search" class="size-4 shrink-0 text-steel-500" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Beiträge durchsuchen"
              aria-label="Beiträge durchsuchen"
              class="filters__input"
            >
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ LISTE ═══════════════ -->
    <section class="list">
      <UContainer>
        <div v-if="status === 'pending' || status === 'idle'" class="state">
          Lade Beiträge …
        </div>

        <div v-else-if="status === 'error'" class="state state--error">
          <p>Die Beiträge konnten gerade nicht geladen werden.</p>
          <p class="state__hint">
            Der Blog ist auch direkt erreichbar:
            <a href="https://blog.eduard-andrae.de" class="state__link">blog.eduard-andrae.de</a>
          </p>
        </div>

        <div v-else-if="filteredPosts.length === 0" class="state">
          <p v-if="hasActiveFilter">
            Keine Treffer unter den {{ posts.length }} geladenen Beiträgen.
          </p>
          <p v-else>
            Noch keine Beiträge vorhanden.
          </p>

          <div class="state__actions">
            <button v-if="hasActiveFilter" type="button" class="state__reset" @click="resetFilters">
              Filter zurücksetzen
            </button>
            <button
              v-if="hasMore"
              type="button"
              class="state__reset"
              :disabled="isLoadingMore"
              @click="loadMore"
            >
              {{ isLoadingMore ? 'Lade …' : 'Ältere Beiträge laden' }}
            </button>
          </div>
        </div>

        <template v-else>
          <p class="list__count">
            {{ filteredPosts.length }} {{ filteredPosts.length === 1 ? 'Beitrag' : 'Beiträge' }}
            <!-- Klarstellen, dass gefiltert nur wird, was auch geladen ist. -->
            <span v-if="hasActiveFilter && hasMore" class="list__count-hint">
              von {{ posts.length }} geladenen
            </span>
          </p>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <BlogCard v-for="post in filteredPosts" :key="post.id" :post="post" />
          </div>

          <!-- Das Archiv reicht bis 2006 — WordPress liefert es seitenweise. -->
          <div v-if="hasMore" class="more">
            <button
              type="button"
              class="more__button"
              :disabled="isLoadingMore"
              @click="loadMore"
            >
              <template v-if="isLoadingMore">
                Lade …
              </template>
              <template v-else>
                Ältere Beiträge laden
                <Icon name="lucide:arrow-down" class="size-4" />
              </template>
            </button>
          </div>
        </template>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* ── Kopf ───────────────────────────────────────────────────────────────── */
.head {
  padding: clamp(3.5rem, 8vw, 5.5rem) 0 clamp(2.5rem, 5vw, 3.5rem);
  background:
    radial-gradient(80% 70% at 88% 0%, rgba(33, 164, 163, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
}

.head__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

.head__title {
  margin-top: 1.25rem;
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

.head__lead {
  margin-top: 1.25rem;
  max-width: 34rem;
  font-size: var(--text-lg);
  line-height: 1.65;
  color: var(--color-steel-300);
}

/* ── Filter ─────────────────────────────────────────────────────────────── */
.filters {
  position: sticky;
  top: 4rem;
  z-index: 20;
  border-block: 1px solid var(--color-graphite-700);
  background: color-mix(in oklab, var(--color-graphite-950) 92%, transparent);
  backdrop-filter: blur(12px);
}

.filters__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 0;
}

.filters__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  border: 1px solid var(--color-graphite-700);
  padding: 0.4rem 0.9rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-steel-400);
  transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
}
.chip:hover {
  color: var(--color-steel-100);
  border-color: var(--color-graphite-500);
}
.chip--active {
  color: var(--color-steel-100);
  border-color: var(--color-accent-500);
  background: color-mix(in oklab, var(--color-accent-500) 14%, transparent);
}

.filters__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-graphite-700);
  padding: 0.45rem 0.85rem;
  min-width: 14rem;
  transition: border-color 200ms ease;
}
.filters__search:focus-within {
  border-color: var(--color-graphite-500);
}

.filters__input {
  width: 100%;
  background: transparent;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-100);
}
.filters__input::placeholder {
  color: var(--color-steel-600);
}
.filters__input:focus {
  outline: none;
}

/* ── Liste ──────────────────────────────────────────────────────────────── */
.list {
  padding: clamp(2.5rem, 6vw, 4rem) 0 clamp(4rem, 9vw, 7rem);
}

.list__count {
  margin-bottom: 1.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-600);
  font-variant-numeric: tabular-nums;
}

.state {
  padding: 3rem 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-steel-500);
}
.state--error {
  color: var(--color-accent-300);
}
.state__hint {
  margin-top: 0.5rem;
  color: var(--color-steel-500);
}
.state__link {
  color: var(--color-steel-300);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.list__count-hint {
  margin-left: 0.5rem;
  color: var(--color-steel-500);
  text-transform: none;
  letter-spacing: 0.08em;
}

.state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.state__reset {
  margin-top: 1rem;
  border-bottom: 1px solid var(--color-accent-500);
  padding-bottom: 0.2rem;
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-steel-200);
}

/* ── Nachladen ──────────────────────────────────────────────────────────── */
.more {
  display: flex;
  justify-content: center;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
}

.more__button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-graphite-600);
  padding: 0.9rem 2rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  transition: background 250ms ease, border-color 250ms ease, color 250ms ease;
}
.more__button:hover:not(:disabled) {
  border-color: var(--color-accent-500);
  color: var(--color-accent-300);
}
.more__button:disabled {
  color: var(--color-steel-600);
  cursor: default;
}
</style>
