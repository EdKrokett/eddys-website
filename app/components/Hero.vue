<script setup lang="ts">
/**
 * Hero-Muster 1:1 von trusted-blogs HeroSectionNew.vue übernommen (driftende
 * Bildkachelwand + Verlaufsschleier + Text-Panel), auf Eddys Wunsch inkl. Teal/Dunkel-
 * Optik statt der verworfenen Taschenmesser-Farbwelt. Bilder kommen jetzt aus den
 * echten Blogartikel-Headern (useBlogWallImages) statt Picsum-Platzhaltern.
 *
 * Lade-Disziplin bewusst 1:1 wie im Original, weil rohe WordPress-Uploads groß sind
 * (Beispielmessung: ~870 KB volles Kamerafoto) — ohne diese Maßnahmen würde die Wand
 * genau den Ladezeit-Fehler machen, den trusted-blogs vermeidet:
 * - NuxtImg statt <img>: IPX transformiert jedes Bild bei Bedarf auf 240px/WebP/Q55
 *   (keine manuelle Vorverarbeitung nötig, siehe Analyse im Chat).
 * - Fetch lazy + client-only (useBlogWallImages) → blockiert nicht die SSR-LCP.
 * - ClientOnly + Lade-Skelett statt leerer Fläche, während die Bilder kommen.
 * - Sichtbare Spaltenzahl reaktiv an den Mobile-Breakpoint gekoppelt, damit auf
 *   schmalen Screens gar nicht erst zusätzliche Bilder geladen werden.
 * - Drift-Animation erst nach Leerlauf (requestIdleCallback) aktiv, damit sie nicht
 *   während der Hydration Hauptthread-Zeit kostet.
 * - Jede Kachel blendet einzeln ein, sobald ihr eigenes Bild geladen ist.
 */
const COLUMN_COUNT_DESKTOP = 4
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
</script>

<template>
  <section class="hero relative isolate overflow-hidden">
    <ClientOnly>
      <div v-if="columns.length" class="hero__wall" :class="{ 'hero__wall-active': wallActive }" aria-hidden="true">
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
              :class="{ 'hero__tile-img-loaded': loadedTiles.has(`${ci}-${ii}`) }"
              @load="loadedTiles.add(`${ci}-${ii}`)"
            />
          </div>
        </div>
      </div>
      <div v-else-if="status === 'pending' || status === 'idle'" class="hero__wall hero__wall-skeleton" aria-hidden="true">
        <div v-for="ci in (isMobile ? COLUMN_COUNT_MOBILE : COLUMN_COUNT_DESKTOP)" :key="ci" class="hero__col">
          <div v-for="ii in 4" :key="ii" class="hero__tile animate-pulse" />
        </div>
      </div>
    </ClientOnly>

    <div class="hero__veil" aria-hidden="true" />

    <UContainer class="relative z-10 py-24 sm:py-28 lg:py-32">
      <div class="max-w-2xl">
        <p class="hero__kicker">Platzhalter-Kicker</p>

        <h1 class="text-4xl leading-[1.1] font-bold text-white sm:text-5xl lg:text-6xl">
          Platzhalter-Überschrift für den Hero
        </h1>

        <p class="mt-5 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
          Platzhaltertext — echter Inhalt folgt.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-full bg-white px-6 py-3 font-semibold text-[#17222B] transition hover:-translate-y-0.5 hover:bg-white/90"
          >
            Platzhalter-CTA 1 →
          </button>
          <button
            type="button"
            class="rounded-full border border-white/50 px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Platzhalter-CTA 2 →
          </button>
        </div>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.hero {
  min-height: 620px;
  background: #0f1a21;
}
@media (min-width: 1024px) {
  .hero {
    min-height: 78vh;
  }
}

.hero__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9fe7e0;
}
.hero__kicker::before {
  content: '';
  width: 26px;
  height: 2px;
  background: #21a4a3;
}

.hero__wall {
  position: absolute;
  inset: -8% -2%;
  z-index: 0;
  display: flex;
  gap: 14px;
  opacity: 0.55;
}
.hero__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: hero-drift 60s linear infinite;
  animation-play-state: paused;
  will-change: transform;
}
.hero__wall-active .hero__col {
  animation-play-state: running;
}
.hero__col:nth-child(2) {
  animation-duration: 75s;
  animation-direction: reverse;
}
.hero__col:nth-child(3) {
  animation-duration: 66s;
}
.hero__col:nth-child(4) {
  animation-duration: 82s;
  animation-direction: reverse;
}
.hero__tile {
  position: relative;
  flex: none;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 12px;
  background: #1c2a34;
}
.hero__tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.hero__tile-img-loaded {
  opacity: 1;
}

.hero__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    100deg,
    rgba(15, 26, 33, 0.95) 0%,
    rgba(15, 26, 33, 0.78) 42%,
    rgba(15, 26, 33, 0.35) 75%,
    rgba(15, 26, 33, 0.2) 100%
  );
}

@keyframes hero-drift {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

@media (max-width: 900px) {
  .hero__wall {
    opacity: 0.8;
  }
  .hero__veil {
    background: linear-gradient(
      180deg,
      rgba(15, 26, 33, 0.5) 0%,
      rgba(15, 26, 33, 0.68) 55%,
      rgba(15, 26, 33, 0.82) 100%
    );
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__col {
    animation: none;
  }
  .hero__tile-img {
    transition: none;
    opacity: 1;
  }
}
</style>
