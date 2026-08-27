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
 * (~870 KB pro Foto): NuxtImg auf Kachelbreite+WebP, client-only Lazy-Fetch,
 * Drift-Animation erst nach Leerlauf, Einblenden pro Kachel. Spaltenzahl, Bildanzahl
 * und angeforderte Bildbreite leiten sich aus der gemessenen Kachelgeometrie ab
 * (siehe `imagesPerColumn` / `tileImageWidth`), statt pro Breakpoint gesetzt zu sein.
 */
const COLUMN_COUNT_DESKTOP = 5
const COLUMN_COUNT_MOBILE = 3

/**
 * Abstand zwischen den Kacheln — muss mit `gap` in `.hero__col`/`.hero__wall`
 * übereinstimmen, weil die Kachelbreite unten daraus zurückgerechnet wird.
 */
const WALL_GAP = 12

/** `.hero__wall` sitzt auf `inset: -8% -2%`, ist also 4% breiter als der Viewport. */
const WALL_OVERHANG = 1.04

/**
 * Erlaubte Bildbreiten — muss eine Teilmenge von `image.screens` (nuxt.config.ts)
 * bleiben. Steht eine Breite dort nicht drin, rundet der Vercel-Provider still nach
 * oben und die Kachel lädt unnötig groß (genau der Fehler, der die Wand vorher
 * 24× 640px laden ließ, obwohl die Kachel 240px breit war).
 */
const TILE_SCREEN_WIDTHS = [240, 320, 480, 640]

/**
 * Wie scharf die Kacheln geladen werden, als Faktor auf die CSS-Kachelbreite.
 * 1,5 statt der sonst üblichen 2, weil die Wand reine Dekoration ist: Sie liegt
 * hinter `.hero__veil`, ist auf `opacity: 0.92` gedimmt und zusätzlich per
 * `grayscale(0.12) contrast(1.04)` gefiltert. Ein echtes 2x wäre dort nicht
 * sichtbar, würde die Wand aber fast verdoppeln.
 */
const TILE_SHARPNESS = 1.5

/** Kachel-Seitenverhältnis, muss zu `aspect-ratio: 4 / 3` in `.hero__tile` passen. */
const TILE_ASPECT = 4 / 3

/** `.hero__wall` sitzt auf `inset: -8%` oben und unten, ist also 16% höher als der Hero. */
const WALL_VERTICAL_OVERHANG = 1.16

/** `.hero`: `min-height: min(78vh, 44rem)` — 44rem sind 704px. */
const HERO_VH_FACTOR = 0.78
const HERO_MAX_HEIGHT = 704

/**
 * Sicherheitsaufschlag auf die Zahl der gleichzeitig sichtbaren Kacheln. Bei Faktor 1
 * stünde das erste Foto exakt am unteren Bildrand wieder im Bild; 1,35 hält die
 * Wiederholung zuverlässig außerhalb des Sichtfensters, ohne unnötig viele Bilder
 * zu laden.
 */
const TILE_REPEAT_HEADROOM = 1.35

/** Untergrenze, damit eine sehr niedrige Wand nicht zu einer Zwei-Bild-Schleife wird. */
const MIN_IMAGES_PER_COLUMN = 4

const { wallImages, status } = useBlogWallImages()

const isMobile = ref(false)
const wallActive = ref(false)
const loadedTiles = ref(new Set<string>())

/**
 * Startwert entspricht dem Desktop-Zweig; bis `onMounted` läuft, wird die Wand
 * ohnehin nicht gerendert (`ClientOnly` + `columns.length`).
 */
const viewportWidth = ref(1440)
const viewportHeight = ref(900)

const columnCount = computed(() =>
  isMobile.value ? COLUMN_COUNT_MOBILE : COLUMN_COUNT_DESKTOP,
)

/** Breite EINER Kachel in CSS-px — dieselbe Rechnung, die das Flex-Layout macht. */
const tileCssWidth = computed(() => {
  const wallWidth = viewportWidth.value * WALL_OVERHANG
  return (wallWidth - (columnCount.value - 1) * WALL_GAP) / columnCount.value
})

/**
 * Eine einzige Bildbreite statt `densities="1x 2x"`: Die Kachelgröße ist hier bekannt,
 * also lässt sich direkt die passende Datei anfordern, statt dem Browser zwei
 * Kandidaten anzubieten. Das war vorher sogar wirkungslos — 1x (240) und 2x (480)
 * rundeten beide auf 640 auf und lieferten dieselbe Datei zweimal im srcset.
 */
const tileImageWidth = computed(() => {
  const target = tileCssWidth.value * TILE_SHARPNESS
  return TILE_SCREEN_WIDTHS.find(w => w >= target) ?? TILE_SCREEN_WIDTHS.at(-1)!
})

/**
 * Einzigartige Bilder PRO SPALTE, bevor die Spalte für die Drift-Schleife per
 * `[...col, ...col]` verdoppelt wird. Muss über der Zahl der gleichzeitig sichtbaren
 * Kacheln liegen, sonst steht dasselbe Foto zweimal auf einem Screen.
 *
 * Bewusst gerechnet statt pro Breakpoint gesetzt: Der Bedarf hängt an der Kachelhöhe,
 * und die schwankt über die Viewports um mehr als das Doppelte. Auf einem 360px-Handy
 * ist eine Kachel nur 88px hoch, es passen 7,3 übereinander; auf 1920px sind es 292px
 * und nur noch 2,7. Zwei feste Werte für "Mobile" und "Desktop" träfen beides daneben —
 * Mobile bekäme zu wenige Bilder (sichtbare Wiederholung), Tablet zu viele (unnötiger
 * Transfer). Genau dieser Fehler steckte vorher drin: 4 Bilder pro Spalte bei
 * 4,24 sichtbaren Kacheln.
 *
 * Die Formel ist gegen echte Messungen geprüft (27.08.2026) — berechnet vs. im Browser
 * gemessen: 7,26 / 7,26 (Android 360), 3,98 / 3,96 (Tablet 768), 3,55 / 3,54 (1440).
 */
const imagesPerColumn = computed(() => {
  const heroHeight = Math.min(viewportHeight.value * HERO_VH_FACTOR, HERO_MAX_HEIGHT)
  const wallHeight = heroHeight * WALL_VERTICAL_OVERHANG
  const tileHeight = tileCssWidth.value / TILE_ASPECT
  const visibleTiles = wallHeight / (tileHeight + WALL_GAP)
  return Math.max(MIN_IMAGES_PER_COLUMN, Math.ceil(visibleTiles * TILE_REPEAT_HEADROOM))
})

onMounted(() => {
  const mediaQuery = window.matchMedia('(max-width: 900px)')
  isMobile.value = mediaQuery.matches
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches
  }
  mediaQuery.addEventListener('change', handleChange)

  // Nur die gerundete Bildbreite hängt hieran, und die kennt genau vier Stufen —
  // deshalb reicht ein grobes Raster statt eines Resize-Observers pro Pixel.
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
  const handleResize = () => {
    viewportWidth.value = window.innerWidth
    viewportHeight.value = window.innerHeight
  }
  window.addEventListener('resize', handleResize, { passive: true })

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
    window.removeEventListener('resize', handleResize)
  })
})

const columns = computed<string[][]>(() => {
  const count = columnCount.value
  const imgs = wallImages.value.slice(0, count * imagesPerColumn.value)
  if (imgs.length === 0) return []
  const cols: string[][] = Array.from({ length: count }, () => [])
  imgs.forEach((img, i) => {
    cols[i % count]!.push(img)
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
              :width="tileImageWidth"
              densities="1x"
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
          Uhrmachermeister, der Startup-Gründer wurde. Kettenraucher, der
          Marathonläufer wurde. Heute verbinde ich Blogs und Brands. Und schreibe
          über alles, was zwischen Start und Ziel passiert.
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
  opacity: 0.92;
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
  filter: grayscale(0.12) contrast(1.04) saturate(1.05);
  transition: opacity 500ms ease;
}
.hero__tile-img--loaded {
  opacity: 1;
}

/*
 * Schleier bewusst als GEFORMTE Fläche statt als gleichmäßiger Verlauf über alles:
 * Er ist nur dort dicht, wo Text steht (linke Spalte), und gibt die rechten zwei
 * Drittel fast vollständig frei. So bleiben Eddys Fotos kräftig, ohne dass die
 * Schrift an Kontrast verliert — ein gleichmäßiger Verlauf müsste überall so dicht
 * sein wie an der schwierigsten Stelle und würde die Wand grau waschen.
 */
.hero__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(
      100deg,
      rgba(14, 15, 18, 0.96) 0%,
      rgba(14, 15, 18, 0.9) 30%,
      rgba(14, 15, 18, 0.52) 56%,
      rgba(14, 15, 18, 0.14) 80%,
      rgba(14, 15, 18, 0.06) 100%
    ),
    /* Kanten leicht abdunkeln, damit die Sektion sauber abschließt */
    linear-gradient(
      to bottom,
      rgba(14, 15, 18, 0.5) 0%,
      transparent 18%,
      transparent 82%,
      rgba(14, 15, 18, 0.55) 100%
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
      rgba(14, 15, 18, 0.45) 0%,
      rgba(14, 15, 18, 0.82) 25%,
      rgba(14, 15, 18, 0.9) 55%,
      rgba(14, 15, 18, 0.94) 100%
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
  color: var(--color-steel-300);
  text-shadow: 0 1px 16px rgba(14, 15, 18, 0.9);
}
/* Hochkant lief die weite Laufweite bis an den Bildschirmrand und die Zeile
   landete mitten auf einem hellen Foto — enger gesetzt bleibt sie im Textblock. */
@media (max-width: 560px) {
  .hero__kicker {
    letter-spacing: 0.14em;
    font-size: var(--text-2xs);
    gap: 0.6rem;
  }
  .hero__kicker-mark {
    width: 1.5rem;
  }
}
.hero__kicker-mark {
  width: 2.25rem;
  height: 2px;
  background: var(--color-accent-400);
}

.hero__name {
  font-size: clamp(2.75rem, 9.5vw, 6.25rem);
  line-height: 0.92;
  letter-spacing: -0.045em;
  color: var(--color-steel-100);
  text-shadow: 0 2px 40px rgba(14, 15, 18, 0.9);
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
  max-width: 36rem;
  font-size: clamp(1.0625rem, 1.35vw, 1.1875rem);
  line-height: 1.65;
  color: var(--color-steel-200);
  /* Der Text liegt auf Fotos — ein weicher Schatten hält ihn auch dort ruhig,
     wo unter dem Schleier eine helle Bildstelle durchkommt. */
  text-shadow: 0 1px 24px rgba(14, 15, 18, 0.85);
}

/* ── CTAs ───────────────────────────────────────────────────────────────── */
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
  margin-top: clamp(2.25rem, 4vw, 3rem);
}

.hero__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-steel-500);
  padding: 1.05rem 2rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-100);
  background: rgba(14, 15, 18, 0.68);
  backdrop-filter: blur(8px);
  transition: background 250ms ease, border-color 250ms ease, color 250ms ease;
}
.hero__cta:hover {
  border-color: var(--color-accent-300);
  color: var(--color-accent-200);
  background: rgba(14, 15, 18, 0.9);
}

/*
 * Teal-Fläche mit DUNKLER Schrift: 6,30:1. Weiße Schrift auf demselben Teal
 * käme nur auf 3,04:1 und verfehlte AA für diese Schriftgröße — deshalb hier
 * bewusst invertiert statt der naheliegenden weißen Beschriftung.
 */
.hero__cta--primary {
  border-color: var(--color-accent-500);
  background: var(--color-accent-500);
  color: var(--color-graphite-950);
  font-weight: 600;
}
.hero__cta--primary:hover {
  border-color: var(--color-accent-300);
  background: var(--color-accent-300);
  color: var(--color-graphite-950);
}

.hero__cta-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.hero__cta:hover .hero__cta-icon {
  translate: 0.3rem 0;
}
</style>
