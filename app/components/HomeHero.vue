<script setup lang="ts">
/**
 * Startseiten-Hero: vollflächige Kachelwand aus Eddys eigenen Blogfotos, darüber
 * Name, Einleitung und die beiden Einstiege.
 *
 * Die Wand lag vorher nur hinter der Blog-Kachel in HomeDoors und ist auf Eddys
 * Wunsch hierher gewandert (26.08.2026) — sie trägt jetzt die ganze Breite. Das
 * Zifferblatt-Motiv und die Fakten-Leiste sind im Gegenzug auf /ueber-mich
 * umgezogen, wo sie inhaltlich hingehören.
 *
 * Lade-Disziplin unverändert übernommen, weil rohe WordPress-Uploads groß sind
 * (~870 KB pro Foto): NuxtImg/IPX auf 240px+WebP, client-only Lazy-Fetch,
 * Drift-Animation erst nach Leerlauf, Einblenden pro Kachel. Auf schmalen Screens
 * werden weniger Spalten gerendert, damit dort gar nicht erst mehr Bilder laden.
 */
const COLUMN_COUNT_DESKTOP = 6
const COLUMN_COUNT_MOBILE = 3
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
</script>

<template>
  <section class="hero">
    <ClientOnly>
      <div
        v-if="columns.length"
        class="hero__wall"
        :class="{ 'hero__wall--active': wallActive }"
        aria-hidden="true"
      >
        <div v-for="(col, ci) in columns" :key="ci" class="hero__col">
          <div v-for="(img, ii) in [...col, ...col]" :key="ii" class="hero__tile">
            <NuxtImg
              :src="img"
              alt=""
              width="240"
              densities="1x 2x"
              format="webp"
              quality="55"
              decoding="async"
              class="hero__tile-img"
              :class="{ 'hero__tile-img--loaded': loadedTiles.has(`${ci}-${ii}`) }"
              @load="loadedTiles.add(`${ci}-${ii}`)"
            />
          </div>
        </div>
      </div>
      <div
        v-else-if="status === 'pending' || status === 'idle'"
        class="hero__wall hero__wall--skeleton"
        aria-hidden="true"
      >
        <div v-for="ci in (isMobile ? COLUMN_COUNT_MOBILE : COLUMN_COUNT_DESKTOP)" :key="ci" class="hero__col">
          <div v-for="ii in 4" :key="ii" class="hero__tile animate-pulse" />
        </div>
      </div>
    </ClientOnly>

    <div class="hero__veil" aria-hidden="true" />

    <UContainer class="relative z-10">
      <div class="hero__inner">
        <p class="kicker hero__kicker">
          <span class="hero__kicker-mark" />Bremen · seit 1966 unterwegs
        </p>

        <h1 class="hero__name">
          Eduard<span class="hero__name-break" />Andrae
        </h1>

        <p class="hero__lead">
          Uhrmachermeister, der Unternehmer wurde. Kettenraucher, der Marathon lief.
          Heute verbinde ich Marken mit Blogs — und schreibe über alles, was
          zwischen Start und Ziel passiert.
        </p>

        <div class="hero__actions">
          <NuxtLink to="/ueber-mich" class="hero__cta hero__cta--primary">
            Über mich
            <Icon name="lucide:arrow-right" class="hero__cta-icon size-4" />
          </NuxtLink>
          <NuxtLink to="/blog" class="hero__cta">
            Zum Blog
            <Icon name="lucide:arrow-right" class="hero__cta-icon size-4" />
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-bottom: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
  min-height: min(78vh, 44rem);
  display: flex;
  align-items: center;
}

.hero__inner {
  padding: clamp(4.5rem, 12vw, 8rem) 0;
  max-width: 46rem;
  animation: var(--animate-rise);
}

/* ── Kachelwand ─────────────────────────────────────────────────────────── */
.hero__wall {
  position: absolute;
  inset: -8% -2%;
  z-index: 0;
  display: flex;
  gap: 12px;
  opacity: 0.6;
}

.hero__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: hero-drift 64s linear infinite;
  animation-play-state: paused;
  will-change: transform;
}
.hero__wall--active .hero__col {
  animation-play-state: running;
}
.hero__col:nth-child(2n) {
  animation-duration: 78s;
  animation-direction: reverse;
}
.hero__col:nth-child(3n) {
  animation-duration: 70s;
}
.hero__col:nth-child(5n) {
  animation-duration: 86s;
}

.hero__tile {
  position: relative;
  flex: none;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--color-graphite-800);
}

.hero__tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  filter: grayscale(0.3) contrast(1.05);
  transition: opacity 500ms ease;
}
.hero__tile-img--loaded {
  opacity: 1;
}

/* Schleier: links dicht genug für den Text, rechts offener, damit die Fotos
   sichtbar bleiben — sonst wäre die Wand nur teure Dekoration. */
.hero__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    100deg,
    rgba(14, 15, 18, 0.97) 0%,
    rgba(14, 15, 18, 0.93) 45%,
    rgba(14, 15, 18, 0.72) 72%,
    rgba(14, 15, 18, 0.45) 100%
  );
}

@keyframes hero-drift {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

/* Hochkant liegt der Text mitten in der Wand statt daneben — der Schleier muss
   deshalb über die ganze Fläche dichter sein als im Querformat. */
@media (max-width: 900px) {
  .hero__veil {
    background: linear-gradient(
      180deg,
      rgba(14, 15, 18, 0.82) 0%,
      rgba(14, 15, 18, 0.93) 40%,
      rgba(14, 15, 18, 0.97) 100%
    );
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__col {
    animation: none;
  }
  .hero__tile-img {
    opacity: 1;
  }
}

/* ── Typografie ─────────────────────────────────────────────────────────── */
.hero__kicker {
  margin-bottom: 1.75rem;
}
.hero__kicker-mark {
  width: 2rem;
  height: 1px;
  background: var(--color-swiss-500);
}

.hero__name {
  font-size: clamp(3rem, 11vw, 7.5rem);
  line-height: 0.92;
  letter-spacing: -0.045em;
  color: var(--color-steel-100);
}
/* Auf schmalen Screens umbrechen, auf breiten in einer Zeile halten. */
.hero__name-break::before {
  content: '\A';
  white-space: pre;
}
@media (min-width: 640px) {
  .hero__name-break::before {
    content: ' ';
  }
}

.hero__lead {
  margin-top: clamp(1.5rem, 3vw, 2.25rem);
  max-width: 34rem;
  font-size: clamp(1.0625rem, 1.6vw, 1.25rem);
  line-height: 1.7;
  color: var(--color-steel-300);
}

/* ── CTAs ───────────────────────────────────────────────────────────────── */
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
  margin-top: clamp(2rem, 4vw, 2.75rem);
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-steel-600);
  padding: 0.9rem 1.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-100);
  background: rgba(14, 15, 18, 0.55);
  backdrop-filter: blur(6px);
  transition: background 250ms ease, border-color 250ms ease, color 250ms ease;
}
.hero__cta:hover {
  border-color: var(--color-steel-400);
  background: rgba(14, 15, 18, 0.85);
}

.hero__cta--primary {
  border-color: var(--color-swiss-500);
  background: var(--color-swiss-500);
  color: #fff;
}
.hero__cta--primary:hover {
  border-color: var(--color-swiss-400);
  background: var(--color-swiss-400);
}

.hero__cta-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.hero__cta:hover .hero__cta-icon {
  translate: 0.3rem 0;
}
</style>
