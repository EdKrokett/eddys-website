<script setup lang="ts">
/**
 * Alle Beiträge auf einer Seite, nach Jahr — damit jeder Beitrag einen echten internen
 * Link hat. Anlass und Konzept: docs/blog-archiv.md.
 */
const { years, skala, total, status } = await useBlogArchiv()

// Beim Rendern ohne Liste: 503 statt einer leeren Seite, die Vercel per ISR eine Stunde
// lang cachen würde (gleiche Überlegung wie bei der Beitragsseite).
if (status.value === 'error' || total.value === 0) {
  throw createError({
    statusCode: 503,
    statusMessage: 'Archiv vorübergehend nicht erreichbar',
  })
}

const firstYear = computed(() => years.value.at(-1)?.year)

useSeoMeta({
  title: () => `Archiv: alle Beiträge seit ${firstYear.value} — Eduard Andrae`,
  description: () =>
    `Alle ${total.value} Beiträge aus dem Blog von Eduard Andrae nach Jahr: Laufberichte, Marathons, Reisen und Gedanken übers Bloggen seit ${firstYear.value}.`,
})

function beitragLabel(count: number): string {
  return count === 1 ? '1 Beitrag' : `${count} Beiträge`
}

function kategorieLabel(ids: number[]): string | undefined {
  return hauptKategorie(ids)?.label
}
</script>

<template>
  <div>
    <!-- ═══════════════ KOPF ═══════════════ -->
    <section class="head">
      <UContainer>
        <NuxtLink to="/blog" class="head__back">
          <Icon name="lucide:arrow-left" class="size-3.5" />
          Zum Blog
        </NuxtLink>

        <p class="kicker head__kicker">
          <span class="head__mark" aria-hidden="true" />Archiv
        </p>

        <h1 class="head__title">
          Alle <span class="head__count">{{ total }}</span> Beiträge
        </h1>

        <p class="head__lead">
          Seit {{ firstYear }} geschrieben, hier vollständig verzeichnet. Jeder Strich auf der
          Skala ist ein Jahr, seine Höhe die Zahl der Beiträge.
        </p>
      </UContainer>
    </section>

    <!-- ═══════════════ SKALA ═══════════════ -->
    <nav class="skala" aria-label="Sprung zu einem Jahr">
      <UContainer>
        <ol class="skala__track">
          <li
            v-for="(strich, i) in skala"
            :key="strich.year"
            class="skala__item"
            :style="{ '--ratio': strich.ratio, '--i': i }"
          >
            <NuxtLink
              v-if="strich.count > 0"
              :to="{ hash: `#jahr-${strich.year}` }"
              class="skala__link"
              :aria-label="`${strich.year}: ${beitragLabel(strich.count)}`"
            >
              <span class="skala__count" aria-hidden="true">{{ strich.count }}</span>
              <span class="skala__bar" aria-hidden="true" />
              <span class="skala__year" aria-hidden="true">{{ String(strich.year).slice(2) }}</span>
            </NuxtLink>
            <span v-else class="skala__link skala__link--leer" :title="`${strich.year}: keine Beiträge`">
              <span class="skala__bar" aria-hidden="true" />
              <span class="skala__year" aria-hidden="true">{{ String(strich.year).slice(2) }}</span>
            </span>
          </li>
        </ol>
      </UContainer>
    </nav>

    <!-- ═══════════════ REGISTER ═══════════════ -->
    <section class="register">
      <UContainer>
        <section
          v-for="jahr in years"
          :id="`jahr-${jahr.year}`"
          :key="jahr.year"
          class="jahr"
          :aria-labelledby="`jahr-${jahr.year}-titel`"
        >
          <header class="jahr__kopf">
            <h2 :id="`jahr-${jahr.year}-titel`" class="jahr__zahl">
              {{ jahr.year }}
            </h2>
            <p class="jahr__anzahl">
              {{ beitragLabel(jahr.entries.length) }}
            </p>
          </header>

          <ol class="jahr__liste">
            <li v-for="entry in jahr.entries" :key="entry.slug">
              <NuxtLink :to="`/blog/${entry.slug}`" class="zeile">
                <NuxtTime
                  :datetime="entry.date"
                  day="2-digit"
                  month="2-digit"
                  locale="de-DE"
                  class="zeile__datum"
                />
                <span class="zeile__titel" v-text="entry.title" />
                <span v-if="kategorieLabel(entry.categoryIds)" class="zeile__kat">
                  {{ kategorieLabel(entry.categoryIds) }}
                </span>
              </NuxtLink>
            </li>
          </ol>
        </section>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* ── Kopf ───────────────────────────────────────────────────────────────── */
.head {
  padding: clamp(2.5rem, 6vw, 4rem) 0 clamp(2rem, 4vw, 3rem);
  background:
    radial-gradient(70% 80% at 12% 0%, rgba(33, 164, 163, 0.07) 0%, transparent 60%),
    var(--color-graphite-950);
}

.head__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-400);
  transition: color 200ms ease;
}
.head__back:hover {
  color: var(--color-accent-400);
}

.head__kicker {
  margin-top: 2.25rem;
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

/* Die Zahl als Gravur: dieselbe Schrift, nur Kontur — das Werk zählt mit. */
.head__count {
  color: transparent;
  -webkit-text-stroke: 1px var(--color-accent-400);
  font-variant-numeric: lining-nums tabular-nums;
}

.head__lead {
  margin-top: 1.25rem;
  max-width: 34rem;
  font-size: var(--text-lg);
  line-height: 1.65;
  color: var(--color-steel-300);
}

/* ── Skala ──────────────────────────────────────────────────────────────── */
/*
 * Ein Maßband über zwanzig Jahre: jeder Strich ein Jahr, die Höhe zählt die Beiträge.
 * Leere Jahre bleiben als Stummel stehen, damit Abstände ehrlich bleiben.
 */
.skala {
  border-block: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
  padding: 1.75rem 0 1.25rem;
}

.skala__track {
  --skala-h: 5.5rem;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(1.75rem, 1fr);
  align-items: end;
  overflow-x: auto;
  scrollbar-width: thin;
  /* Feine Grundlinie wie auf einem Lineal */
  background-image: linear-gradient(var(--color-graphite-600), var(--color-graphite-600));
  background-size: 100% 1px;
  background-position: 0 calc(100% - 1.6rem);
  background-repeat: no-repeat;
}

.skala__item {
  display: flex;
  justify-content: center;
}

.skala__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding-top: 1.25rem;
  outline-offset: 2px;
}

.skala__count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-accent-300);
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: translateY(0.25rem);
  transition: opacity 180ms ease, transform 180ms ease;
}

.skala__bar {
  width: 2px;
  height: calc(0.4rem + var(--ratio) * var(--skala-h));
  background: linear-gradient(to top, var(--color-accent-600), var(--color-accent-300));
  transform-origin: bottom;
  animation: skala-wachsen 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 28ms + 120ms);
  transition: width 180ms ease, background 180ms ease;
}

.skala__year {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.04em;
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
  transition: color 180ms ease;
}

.skala__link:hover .skala__count,
.skala__link:focus-visible .skala__count {
  opacity: 1;
  transform: translateY(0);
}
.skala__link:hover .skala__bar,
.skala__link:focus-visible .skala__bar {
  width: 4px;
  background: var(--color-brass-400);
}
.skala__link:hover .skala__year,
.skala__link:focus-visible .skala__year {
  color: var(--color-steel-100);
}

.skala__link--leer .skala__bar {
  height: 0.4rem;
  background: var(--color-graphite-500);
}
.skala__link--leer .skala__year {
  color: var(--color-steel-600);
}

@keyframes skala-wachsen {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .skala__bar { animation: none; }
}

/* ── Register ───────────────────────────────────────────────────────────── */
.register {
  padding: clamp(2.5rem, 6vw, 4.5rem) 0 clamp(4rem, 8vw, 6rem);
}

.jahr {
  display: grid;
  gap: 1rem 3rem;
  padding-block: 2.25rem;
  border-top: 1px solid var(--color-graphite-700);
  scroll-margin-top: 1.5rem;
}
.jahr:first-child {
  border-top: 0;
  padding-top: 0;
}

@media (min-width: 768px) {
  .jahr {
    grid-template-columns: 12rem 1fr;
  }
}

.jahr__kopf {
  align-self: start;
}
@media (min-width: 768px) {
  .jahr__kopf {
    position: sticky;
    top: 1.5rem;
  }
}

.jahr__zahl {
  font-size: clamp(2.75rem, 6vw, 4.25rem);
  font-weight: 300;
  line-height: 0.9;
  letter-spacing: -0.05em;
  color: var(--color-steel-100);
  font-variant-numeric: lining-nums;
}

/* Ziel eines Sprungs aus der Skala: die Jahreszahl leuchtet kurz in Messing. */
.jahr:target .jahr__zahl {
  animation: jahr-markiert 1.6s ease-out;
}
@keyframes jahr-markiert {
  0%, 35% { color: var(--color-brass-300); }
  100% { color: var(--color-steel-100); }
}

.jahr__anzahl {
  margin-top: 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-500);
}

.jahr__liste {
  display: flex;
  flex-direction: column;
}

.zeile {
  position: relative;
  display: grid;
  grid-template-columns: 3.75rem 1fr;
  gap: 0.25rem 1rem;
  align-items: baseline;
  padding: 0.8rem 0 0.8rem 0.9rem;
  border-bottom: 1px solid var(--color-graphite-800);
  transition: background 200ms ease;
}

@media (min-width: 640px) {
  .zeile {
    grid-template-columns: 3.75rem 1fr auto;
  }
}

/* Unruh-Zeiger: ein Teal-Strich, der beim Überfahren von links einschwingt. */
.zeile::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 2px;
  height: 1.1rem;
  background: var(--color-accent-400);
  transform: translateY(-50%) scaleY(0);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.zeile:hover,
.zeile:focus-visible {
  background: linear-gradient(to right, rgba(33, 164, 163, 0.06), transparent 70%);
}
.zeile:hover::before,
.zeile:focus-visible::before {
  transform: translateY(-50%) scaleY(1);
}

.zeile__datum {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
}

.zeile__titel {
  font-size: var(--text-base);
  line-height: 1.45;
  color: var(--color-steel-200);
  overflow-wrap: anywhere;
  transition: color 200ms ease;
}
.zeile:hover .zeile__titel,
.zeile:focus-visible .zeile__titel {
  color: var(--color-accent-300);
}

.zeile__kat {
  grid-column: 2;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-steel-600);
}
@media (min-width: 640px) {
  .zeile__kat {
    grid-column: 3;
  }
}
</style>
