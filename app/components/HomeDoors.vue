<script setup lang="ts">
/**
 * Die zwei gleichwertigen Eingänge der Startseite (Eddys Vorgabe: "Über Mich"
 * und "Zum Blog" als zwei gleich starke Türen).
 *
 * Bewusst KEIN symmetrisches Card-Grid: Die linke Tür ist typografisch und ruhig
 * (Werdegang = Text), die rechte lebt von Eddys eigenen Blogfotos. Der Kontrast
 * zwischen beiden ist die Gestaltung.
 *
 * Lade-Disziplin der Bildwand 1:1 aus dem früheren Hero übernommen, weil rohe
 * WordPress-Uploads groß sind (~870 KB pro Foto): NuxtImg/IPX auf 240px+WebP,
 * client-only Lazy-Fetch, Drift-Animation erst nach Leerlauf, Einblenden pro Kachel.
 */
const COLUMN_COUNT_DESKTOP = 3
const COLUMN_COUNT_MOBILE = 2
const MIN_IMAGES_PER_COLUMN = 4

const { wallImages, status } = useBlogWallImages()

const isMobile = ref(false)
const wallActive = ref(false)
const loadedTiles = ref(new Set<string>())

onMounted(() => {
  const mediaQuery = window.matchMedia('(max-width: 900px)')
  isMobile.value = mediaQuery.matches
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches
  }
  mediaQuery.addEventListener('change', handleChange)

  const startWall = () => {
    wallActive.value = true
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startWall, { timeout: 2000 })
  } else {
    setTimeout(startWall, 1200)
  }

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleChange)
  })
})

const columns = computed<string[][]>(() => {
  const columnCount = isMobile.value ? COLUMN_COUNT_MOBILE : COLUMN_COUNT_DESKTOP
  const imgs = wallImages.value.slice(0, columnCount * MIN_IMAGES_PER_COLUMN)
  if (imgs.length === 0) return []
  const cols: string[][] = Array.from({ length: columnCount }, () => [])
  imgs.forEach((img, i) => {
    cols[i % columnCount]!.push(img)
  })
  return cols.filter(col => col.length > 0)
})

/** Die drei jüngsten Stationen als Vorschau auf den Werdegang. */
const stationPreview = computed(() => CV_STATIONS.slice(0, 3))
</script>

<template>
  <section class="doors">
    <!-- ═══════════ Tür 1: Über mich ═══════════ -->
    <NuxtLink to="/ueber-mich" class="door door--about">
      <div class="door__body">
        <p class="kicker">
          01 — Werdegang
        </p>

        <h2 class="door__title">
          Über mich
        </h2>

        <p class="door__text">
          Vom Uhrmacherhandwerk über zwei eigene Startups zum Agile Coach.
          Stationen, Projekte und was ich wirklich kann.
        </p>

        <ul class="door__stations">
          <li v-for="station in stationPreview" :key="station.company" class="door__station">
            <span class="door__station-period">{{ station.period }}</span>
            <span class="door__station-role">{{ station.role }}</span>
            <span class="door__station-company">{{ station.company }}</span>
          </li>
          <li class="door__station door__station--more">
            <span class="door__station-period">…</span>
            <span class="door__station-role">und {{ CV_STATIONS.length - 3 }} weitere bis 1991</span>
          </li>
        </ul>
      </div>

      <span class="door__cta">
        Werdegang ansehen
        <Icon name="lucide:arrow-right" class="door__cta-icon size-4" />
      </span>
    </NuxtLink>

    <!-- ═══════════ Tür 2: Blog ═══════════ -->
    <NuxtLink to="/blog" class="door door--blog">
      <ClientOnly>
        <div
          v-if="columns.length"
          class="door__wall"
          :class="{ 'door__wall--active': wallActive }"
          aria-hidden="true"
        >
          <div v-for="(col, ci) in columns" :key="ci" class="door__col">
            <div v-for="(img, ii) in [...col, ...col]" :key="ii" class="door__tile">
              <NuxtImg
                :src="img"
                alt=""
                width="240"
                densities="1x 2x"
                format="webp"
                quality="55"
                decoding="async"
                class="door__tile-img"
                :class="{ 'door__tile-img--loaded': loadedTiles.has(`${ci}-${ii}`) }"
                @load="loadedTiles.add(`${ci}-${ii}`)"
              />
            </div>
          </div>
        </div>
        <div
          v-else-if="status === 'pending' || status === 'idle'"
          class="door__wall door__wall--skeleton"
          aria-hidden="true"
        >
          <div v-for="ci in (isMobile ? COLUMN_COUNT_MOBILE : COLUMN_COUNT_DESKTOP)" :key="ci" class="door__col">
            <div v-for="ii in 4" :key="ii" class="door__tile animate-pulse" />
          </div>
        </div>
      </ClientOnly>

      <div class="door__veil" aria-hidden="true" />

      <div class="door__body door__body--blog">
        <p class="kicker">
          02 — Seit 2006
        </p>

        <h2 class="door__title">
          Der Blog
        </h2>

        <p class="door__text">
          Laufen, Wandern und Gedanken übers Bloggen. Angefangen als Protokoll
          eines Rauchers, der Marathon laufen wollte.
        </p>

        <ul class="door__cats">
          <li v-for="cat in BLOG_CATEGORIES" :key="cat.slug" class="door__cat">
            {{ cat.label }}
          </li>
        </ul>
      </div>

      <span class="door__cta">
        Beiträge lesen
        <Icon name="lucide:arrow-right" class="door__cta-icon size-4" />
      </span>
    </NuxtLink>
  </section>
</template>

<style scoped>
.doors {
  display: grid;
  gap: 1px;
  background: var(--color-graphite-700);
  border-bottom: 1px solid var(--color-graphite-700);
}
@media (min-width: 900px) {
  .doors {
    grid-template-columns: 1fr 1fr;
  }
}

.door {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.5rem;
  overflow: hidden;
  padding: clamp(2.25rem, 5vw, 4rem);
  min-height: clamp(26rem, 46vw, 34rem);
  transition: background 350ms ease;
}

.door--about {
  background: var(--color-graphite-900);
}
.door--about:hover {
  background: var(--color-graphite-850);
}

.door--blog {
  background: var(--color-graphite-950);
}

.door__body {
  position: relative;
  z-index: 2;
}

.door__title {
  margin-top: 1.25rem;
  font-size: clamp(2.25rem, 4.5vw, 3.5rem);
  line-height: 1;
  color: var(--color-steel-100);
}

.door__text {
  margin-top: 1.125rem;
  max-width: 26rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--color-steel-400);
}

/* ── Stationen-Vorschau ─────────────────────────────────────────────────── */
.door__stations {
  margin-top: 2rem;
  border-top: 1px solid var(--color-graphite-700);
}

.door__station {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}

.door__station-period {
  grid-row: span 2;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.6;
  color: var(--color-swiss-400);
  font-variant-numeric: tabular-nums;
}

.door__station-role {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-steel-200);
}

.door__station-company {
  font-size: 0.8rem;
  color: var(--color-steel-500);
}

.door__station--more .door__station-role {
  font-weight: 400;
  font-style: italic;
  color: var(--color-steel-500);
}
.door__station--more .door__station-period {
  color: var(--color-steel-600);
}

/* ── Kategorien ─────────────────────────────────────────────────────────── */
.door__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 2rem;
}

.door__cat {
  border: 1px solid var(--color-graphite-600);
  padding: 0.3rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-steel-300);
  background: rgba(14, 15, 18, 0.6);
  backdrop-filter: blur(4px);
}

/* ── CTA ────────────────────────────────────────────────────────────────── */
.door__cta {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  border-bottom: 1px solid var(--color-swiss-500);
  padding-bottom: 0.4rem;
}
.door__cta-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.door:hover .door__cta-icon {
  translate: 0.35rem 0;
}

/* ── Bildwand (Tür 2) ───────────────────────────────────────────────────── */
.door__wall {
  position: absolute;
  inset: -10% -4%;
  z-index: 0;
  display: flex;
  gap: 10px;
  opacity: 0.5;
  transition: opacity 500ms ease;
}
.door--blog:hover .door__wall {
  opacity: 0.65;
}

.door__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: door-drift 64s linear infinite;
  animation-play-state: paused;
  will-change: transform;
}
.door__wall--active .door__col {
  animation-play-state: running;
}
.door__col:nth-child(2) {
  animation-duration: 78s;
  animation-direction: reverse;
}
.door__col:nth-child(3) {
  animation-duration: 70s;
}

.door__tile {
  position: relative;
  flex: none;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--color-graphite-800);
}

.door__tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  filter: grayscale(0.35) contrast(1.05);
  transition: opacity 500ms ease, filter 500ms ease;
}
.door__tile-img--loaded {
  opacity: 1;
}
.door--blog:hover .door__tile-img--loaded {
  filter: grayscale(0) contrast(1);
}

.door__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    165deg,
    rgba(14, 15, 18, 0.94) 0%,
    rgba(14, 15, 18, 0.82) 45%,
    rgba(14, 15, 18, 0.55) 100%
  );
}

@keyframes door-drift {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .door__col {
    animation: none;
  }
  .door__tile-img {
    opacity: 1;
  }
}
</style>
