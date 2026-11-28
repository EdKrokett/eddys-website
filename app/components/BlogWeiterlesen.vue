<script setup lang="ts">
import type { BlogNachbarn } from '#shared/types/wordpress'

/**
 * Am Ende jeder Beitragsseite: älterer und neuerer Beitrag, Verwandtes aus derselben
 * Kategorie, Link ins Archiv. Für Leser der natürliche nächste Schritt, für Google der
 * Weg zu jedem Beitrag (docs/blog-archiv.md).
 */
defineProps<{
  nachbarn: BlogNachbarn
}>()
</script>

<template>
  <nav class="weiter" aria-label="Weiterlesen">
    <!-- Älter / Neuer: zwei Hälften eines Zifferblatts, links zurück, rechts vor -->
    <div v-if="nachbarn.older || nachbarn.newer" class="weiter__paar">
      <NuxtLink
        v-if="nachbarn.older"
        :to="`/blog/${nachbarn.older.slug}`"
        class="nachbar nachbar--alt"
        rel="prev"
      >
        <span class="nachbar__label">
          <Icon name="lucide:arrow-left" class="size-3.5" />
          Älter
          <NuxtTime :datetime="nachbarn.older.date" day="2-digit" month="2-digit" year="numeric" locale="de-DE" class="nachbar__datum" />
        </span>
        <span class="nachbar__titel" v-text="nachbarn.older.title" />
      </NuxtLink>
      <span v-else class="nachbar nachbar--leer" aria-hidden="true" />

      <NuxtLink
        v-if="nachbarn.newer"
        :to="`/blog/${nachbarn.newer.slug}`"
        class="nachbar nachbar--neu"
        rel="next"
      >
        <span class="nachbar__label">
          <NuxtTime :datetime="nachbarn.newer.date" day="2-digit" month="2-digit" year="numeric" locale="de-DE" class="nachbar__datum" />
          Neuer
          <Icon name="lucide:arrow-right" class="size-3.5" />
        </span>
        <span class="nachbar__titel" v-text="nachbarn.newer.title" />
      </NuxtLink>
      <span v-else class="nachbar nachbar--leer" aria-hidden="true" />
    </div>

    <div v-if="nachbarn.related.length && nachbarn.category" class="verwandt">
      <p class="kicker verwandt__kicker">
        <span class="verwandt__mark" aria-hidden="true" />Mehr aus {{ nachbarn.category.label }}
      </p>
      <ol class="verwandt__liste">
        <li v-for="entry in nachbarn.related" :key="entry.slug">
          <NuxtLink :to="`/blog/${entry.slug}`" class="verwandt__zeile">
            <NuxtTime :datetime="entry.date" day="2-digit" month="2-digit" year="numeric" locale="de-DE" class="verwandt__datum" />
            <span class="verwandt__titel" v-text="entry.title" />
          </NuxtLink>
        </li>
      </ol>
    </div>

    <div class="weiter__fuss">
      <NuxtLink to="/blog/archiv" class="weiter__archiv">
        Alle {{ nachbarn.total }} Beiträge im Archiv
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
      <NuxtLink to="/blog" class="weiter__blog">
        Zur Blogübersicht
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.weiter {
  display: flex;
  flex-direction: column;
  gap: clamp(2.25rem, 5vw, 3rem);
}

/* ── Älter / Neuer ──────────────────────────────────────────────────────── */
.weiter__paar {
  display: grid;
  border: 1px solid var(--color-graphite-700);
}
@media (min-width: 768px) {
  .weiter__paar {
    grid-template-columns: 1fr 1fr;
  }
}

.nachbar {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: clamp(1.5rem, 3vw, 2rem);
  min-height: 8rem;
  transition: background 220ms ease;
}

.nachbar--neu {
  text-align: right;
  align-items: flex-end;
}

/* Trenner zwischen beiden Hälften: auf Mobil oben, ab Tablet in der Mitte */
.nachbar + .nachbar {
  border-top: 1px solid var(--color-graphite-700);
}
@media (min-width: 768px) {
  .nachbar + .nachbar {
    border-top: 0;
    border-left: 1px solid var(--color-graphite-700);
  }
}

.nachbar--leer {
  display: none;
}
@media (min-width: 768px) {
  .nachbar--leer {
    display: block;
    background: repeating-linear-gradient(
      135deg,
      transparent 0 9px,
      rgba(56, 58, 66, 0.35) 9px 10px
    );
  }
}

.nachbar:not(.nachbar--leer):hover,
.nachbar:not(.nachbar--leer):focus-visible {
  background: radial-gradient(90% 120% at var(--glow-x, 0%) 50%, rgba(33, 164, 163, 0.09), transparent 70%);
}
.nachbar--neu {
  --glow-x: 100%;
}

.nachbar__label {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-400);
}

.nachbar__datum {
  letter-spacing: 0.06em;
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
}

.nachbar__titel {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2.2vw, 1.45rem);
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--color-steel-100);
  overflow-wrap: anywhere;
  transition: color 200ms ease;
}
.nachbar:hover .nachbar__titel,
.nachbar:focus-visible .nachbar__titel {
  color: var(--color-accent-300);
}

/* ── Verwandt ───────────────────────────────────────────────────────────── */
.verwandt__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

.verwandt__liste {
  margin-top: 1rem;
}

.verwandt__zeile {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  gap: 1rem;
  align-items: baseline;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}

.verwandt__datum {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
}

.verwandt__titel {
  color: var(--color-steel-200);
  line-height: 1.45;
  overflow-wrap: anywhere;
  transition: color 200ms ease;
}
.verwandt__zeile:hover .verwandt__titel,
.verwandt__zeile:focus-visible .verwandt__titel {
  color: var(--color-accent-300);
}

/* ── Fuß ────────────────────────────────────────────────────────────────── */
.weiter__fuss {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem 2rem;
}

.weiter__archiv {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  border-bottom: 1px solid var(--color-accent-500);
  padding-bottom: 0.35rem;
  transition: color 200ms ease;
}
.weiter__archiv:hover {
  color: var(--color-accent-400);
}

.weiter__blog {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-500);
  transition: color 200ms ease;
}
.weiter__blog:hover {
  color: var(--color-steel-200);
}
</style>
