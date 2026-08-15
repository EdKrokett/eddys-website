<script setup lang="ts">
/**
 * Hero: fotorealistisches Taschenmesser-Bild (KI-generiert, Eddy hat die Rechte —
 * siehe CLAUDE.md Design-Priorität) als Vollbild-Hintergrund (geblurrte Cover-Ebene)
 * + scharfes, seitenverhältnis-treues Vordergrundbild. Skills als Hotspot-Marker über
 * den einzelnen Werkzeugen, Koordinaten kalibriert auf public/images/knife-hero.webp
 * (1915×821). Platzhalter-Skillnamen, echte Inhalte folgen.
 */
interface Skill {
  id: string
  label: string
  icon: string
  /** Position der Werkzeugspitze in % des Originalbilds (1915×821). */
  xPct: number
  yPct: number
}

const skills: Skill[] = [
  { id: 'strategie', label: 'Strategie', icon: 'lucide:compass', xPct: 26, yPct: 45 },
  { id: 'code', label: 'Entwicklung', icon: 'lucide:terminal', xPct: 37, yPct: 43 },
  { id: 'design', label: 'Design', icon: 'lucide:pen-tool', xPct: 48, yPct: 36 },
  { id: 'content', label: 'Content', icon: 'lucide:feather', xPct: 58, yPct: 36 },
  { id: 'daten', label: 'Automatisierung', icon: 'lucide:workflow', xPct: 67, yPct: 42 },
  { id: 'kommunikation', label: 'Kommunikation', icon: 'lucide:megaphone', xPct: 76, yPct: 55 },
]

const activeId = ref<string | null>(null)
const revealed = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    revealed.value = true
  })
})
</script>

<template>
  <section class="hero">
    <div class="hero__backdrop" aria-hidden="true" />
    <div class="hero__scrim" aria-hidden="true" />

    <div class="hero__text">
      <p class="font-mono text-xs tracking-[0.3em] text-steel-300 uppercase">
        Eduard Andrae
      </p>
      <h1 class="mt-6 text-4xl leading-tight font-semibold text-balance sm:text-6xl">
        Vielseitig wie ein<br class="hidden sm:block">
        Schweizer Taschenmesser.
      </h1>
      <p class="mx-auto mt-6 max-w-xl text-base text-steel-300 sm:text-lg">
        Jedes Werkzeug ein Skill — mehr über mich folgt in Kürze.
      </p>
    </div>

    <div class="hero__frame">
      <div class="hero__image-wrap">
        <img
          src="/images/knife-hero.webp"
          width="1915"
          height="821"
          fetchpriority="high"
          alt="Aufgeklapptes Taschenmesser, Sinnbild für vielseitige Fähigkeiten"
          class="hero__image"
        >

        <button
          v-for="(skill, i) in skills"
          :key="skill.id"
          type="button"
          class="hotspot"
          :class="{ 'is-revealed': revealed, 'is-active': activeId === skill.id }"
          :style="{ 'left': `${skill.xPct}%`, 'top': `${skill.yPct}%`, '--delay': `${i * 90}ms` }"
          @mouseenter="activeId = skill.id"
          @mouseleave="activeId = null"
          @focus="activeId = skill.id"
          @blur="activeId = null"
        >
          <span class="hotspot__dot" />
          <span class="hotspot__label">
            <Icon :name="skill.icon" class="size-3.5" />
            {{ skill.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Mobile: Pins überlappen auf schmalen Bildern unlesbar — einfache Liste statt Karte. -->
    <ul class="hero__mobile-skills">
      <li v-for="skill in skills" :key="skill.id" class="hero__mobile-chip">
        <Icon :name="skill.icon" class="size-3.5" />
        {{ skill.label }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  min-height: 78vh;
  display: flex;
  flex-direction: column;
}

.hero__backdrop {
  position: absolute;
  inset: -5%;
  background-image: url('/images/knife-hero.webp');
  background-size: cover;
  background-position: center 60%;
  filter: blur(60px) brightness(0.42) saturate(1.15);
  transform: scale(1.1);
}

.hero__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, var(--color-graphite-900) 0%, rgb(23 24 27 / 55%) 22%, transparent 45%),
    linear-gradient(to top, var(--color-graphite-900) 0%, transparent 30%);
}

.hero__text {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 6rem 1.5rem 1rem;
}

.hero__frame {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem 4rem;
}

.hero__image-wrap {
  position: relative;
  width: 100%;
  max-width: 78rem;
  aspect-ratio: 1915 / 821;
}

.hero__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 30px 60px rgb(0 0 0 / 55%));
}

.hotspot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transform: translate(-50%, -100%);
  background: none;
  border: none;
  padding: 0;
  opacity: 0;
  transition: opacity 500ms ease var(--delay);
}

.hotspot.is-revealed {
  opacity: 1;
}

.hotspot__dot {
  order: 2;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-swiss-500);
  box-shadow: 0 0 0 4px rgb(200 16 46 / 25%);
}

.hotspot__label {
  order: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
  border-radius: 999px;
  border: 1px solid var(--color-graphite-600);
  background: rgb(23 24 27 / 90%);
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  color: #cdd0d6;
  backdrop-filter: blur(6px);
  transition: color 200ms ease, border-color 200ms ease, transform 200ms ease;
}

.hotspot:hover .hotspot__label,
.hotspot.is-active .hotspot__label {
  color: #fff;
  border-color: var(--color-swiss-500);
  transform: translateY(-2px);
}

.hero__mobile-skills {
  display: none;
}

@media (max-width: 768px) {
  .hero {
    min-height: 0;
  }

  .hero__text {
    padding: 4rem 1.5rem 0.5rem;
  }

  .hero__frame {
    padding: 0.5rem 1.5rem 2rem;
  }

  /* Pins würden auf der geschrumpften Breite unlesbar überlappen. */
  .hotspot {
    display: none;
  }

  .hero__mobile-skills {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1.5rem 3rem;
    list-style: none;
  }

  .hero__mobile-chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    border-radius: 999px;
    border: 1px solid var(--color-graphite-600);
    background: rgb(23 24 27 / 90%);
    padding: 0.4rem 0.8rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: #cdd0d6;
  }
}
</style>
