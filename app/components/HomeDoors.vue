<script setup lang="ts">
/**
 * Die zwei gleichwertigen Eingänge der Startseite (Eddys Vorgabe: "Über Mich"
 * und "Zum Blog" als zwei gleich starke Türen).
 *
 * Beide Türen sind seit 26.08.2026 rein typografisch: Die Bildkachelwand, die
 * vorher hinter der Blog-Tür lag, trägt jetzt vollflächig den Hero (HomeHero.vue).
 * Damit die Blog-Tür dadurch nicht schwächer wird als die Werdegang-Tür, bekommt
 * sie eine gleichwertige Liste — dort die Stationen, hier die Themen.
 */
const stationPreview = computed(() => CV_STATIONS.slice(0, 3))

const topics = [
  { label: 'Laufen', note: 'Wettkämpfe, Training und ehrliche Rückschläge' },
  { label: 'Wandern', note: 'Touren, Etappen und lange Wochenenden' },
  { label: 'Bloggen', note: 'Übers Schreiben, Sichtbarkeit und KI' },
]
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

        <ul class="door__list">
          <li v-for="station in stationPreview" :key="station.company" class="door__row">
            <span class="door__row-key">{{ station.period }}</span>
            <span class="door__row-main">{{ station.role }}</span>
            <span class="door__row-note">{{ station.company }}</span>
          </li>
          <li class="door__row door__row--more">
            <span class="door__row-key">…</span>
            <span class="door__row-main">und {{ CV_STATIONS.length - 3 }} weitere bis 1991</span>
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
      <div class="door__body">
        <p class="kicker">
          02 — Seit 2006
        </p>

        <h2 class="door__title">
          Der Blog
        </h2>

        <p class="door__text">
          Angefangen als Protokoll eines Rauchers, der Marathon laufen wollte.
          Inzwischen sind es über 240 Beiträge.
        </p>

        <ul class="door__list">
          <li v-for="topic in topics" :key="topic.label" class="door__row">
            <span class="door__row-key door__row-key--topic">{{ topic.label }}</span>
            <span class="door__row-main door__row-main--note">{{ topic.note }}</span>
          </li>
          <!-- Vierte Zeile, damit beide Türen gleich hoch bleiben (links stehen
               drei Stationen plus die "und 5 weitere"-Zeile). -->
          <li class="door__row door__row--more">
            <span class="door__row-key">…</span>
            <span class="door__row-main">und alles dazwischen, seit 2006</span>
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.5rem;
  padding: clamp(2.25rem, 5vw, 4rem);
  min-height: clamp(24rem, 40vw, 30rem);
  transition: background 350ms ease;
}

.door--about {
  background: var(--color-graphite-900);
}
.door--blog {
  background: var(--color-graphite-950);
}
.door:hover {
  background: var(--color-graphite-850);
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
  font-size: var(--text-base);
  line-height: 1.65;
  color: var(--color-steel-400);
}

/* ── Listen (Stationen links, Themen rechts) ────────────────────────────── */
.door__list {
  margin-top: 2rem;
  border-top: 1px solid var(--color-graphite-700);
}

.door__row {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}

.door__row-key {
  grid-row: span 2;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--color-accent-400);
  font-variant-numeric: tabular-nums;
}
.door__row-key--topic {
  grid-row: auto;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.door__row-main {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-steel-200);
}
.door__row-main--note {
  font-weight: 400;
  font-size: var(--text-sm);
  color: var(--color-steel-400);
}

.door__row-note {
  font-size: var(--text-sm);
  color: var(--color-steel-500);
}

.door__row--more .door__row-main {
  font-weight: 400;
  font-style: italic;
  color: var(--color-steel-500);
}
.door__row--more .door__row-key {
  color: var(--color-steel-600);
}

/* ── CTA ────────────────────────────────────────────────────────────────── */
.door__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  border-bottom: 1px solid var(--color-accent-500);
  padding-bottom: 0.4rem;
}
.door__cta-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.door:hover .door__cta-icon {
  translate: 0.35rem 0;
}
</style>
