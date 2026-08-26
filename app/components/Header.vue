<script setup lang="ts">
/**
 * Navigation nach Eddys Seitenstruktur (26.08.2026): zwei gleichwertige Bereiche
 * (Über mich, Blog) plus Kontakt. Impressum und Datenschutz stehen im Footer —
 * Pflichtangaben, aber keine Hauptnavigation.
 *
 * Kein "Cookie-Richtlinie"-Punkt: ohne Tracking/Cookies, die Einwilligung brauchen,
 * gibt es nichts zu regeln — kommt Tracking dazu, dann ein Consent-Banner statt
 * einer statischen Cookie-Seite.
 */
const mobileOpen = ref(false)
const searchQuery = ref('')

const links = [
  { to: '/ueber-mich', label: 'Über mich' },
  { to: '/blog', label: 'Blog' },
  { to: '/kontakt', label: 'Kontakt' },
]

function onSearch() {
  const q = searchQuery.value.trim()
  navigateTo({ path: '/blog', query: q ? { q } : {} })
  mobileOpen.value = false
}

// Menü schließen, wenn die Route wechselt (sonst bleibt es nach Klick offen stehen).
watch(() => useRoute().fullPath, () => {
  mobileOpen.value = false
})
</script>

<template>
  <header class="header">
    <UContainer class="flex h-16 items-center justify-between gap-4">
      <NuxtLink to="/" class="brand" aria-label="Zur Startseite">
        <span class="brand__mark" aria-hidden="true" />
        <span class="brand__name">Eduard Andrae</span>
      </NuxtLink>

      <nav class="hidden items-center gap-8 lg:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="navlink"
        >
          {{ link.label }}
        </NuxtLink>

        <form class="search" @submit.prevent="onSearch">
          <Icon name="lucide:search" class="size-3.5 shrink-0 text-steel-500" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Suchen"
            aria-label="Beiträge durchsuchen"
            class="search__input"
          >
        </form>
      </nav>

      <button
        type="button"
        class="burger"
        :aria-expanded="mobileOpen"
        aria-label="Menü öffnen"
        @click="mobileOpen = !mobileOpen"
      >
        <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-5" />
      </button>
    </UContainer>

    <div v-if="mobileOpen" class="mobile">
      <form class="search search--mobile" @submit.prevent="onSearch">
        <Icon name="lucide:search" class="size-4 shrink-0 text-steel-500" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Beiträge durchsuchen"
          aria-label="Beiträge durchsuchen"
          class="search__input"
        >
      </form>

      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="mobile__link"
      >
        {{ link.label }}
      </NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in oklab, var(--color-graphite-950) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-graphite-700);
}

/* ── Wortmarke ──────────────────────────────────────────────────────────── */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  shrink: 0;
}

/* Roter Indexstrich als Signet — greift den Sekundenzeiger aus dem Hero auf. */
.brand__mark {
  width: 2px;
  height: 1.125rem;
  background: var(--color-swiss-500);
  transition: height 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.brand:hover .brand__mark {
  height: 1.5rem;
}

.brand__name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-steel-100);
}

/* ── Navigation ─────────────────────────────────────────────────────────── */
.navlink {
  position: relative;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-steel-300);
  transition: color 180ms ease;
}
.navlink::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.4rem;
  width: 100%;
  height: 1px;
  background: var(--color-swiss-500);
  scale: 0 1;
  transform-origin: left;
  transition: scale 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.navlink:hover {
  color: var(--color-steel-100);
}
.navlink:hover::after,
.navlink.router-link-active::after {
  scale: 1 1;
}
.navlink.router-link-active {
  color: var(--color-steel-100);
}

/* ── Suche ──────────────────────────────────────────────────────────────── */
.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-graphite-700);
  padding: 0.4rem 0.75rem;
  transition: border-color 200ms ease;
}
.search:focus-within {
  border-color: var(--color-graphite-500);
}

.search__input {
  width: 6rem;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-steel-100);
  transition: width 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.search__input::placeholder {
  color: var(--color-steel-600);
}
.search__input:focus {
  outline: none;
  width: 10rem;
}

.search--mobile {
  margin-bottom: 0.5rem;
}
.search--mobile .search__input {
  width: 100%;
}
.search--mobile .search__input:focus {
  width: 100%;
}

/* ── Mobile ─────────────────────────────────────────────────────────────── */
/* Ein-/Ausblenden hier per Media Query statt per `lg:hidden`: Scoped-Styles werden
   nach den Tailwind-Utilities eingebunden, `display: grid` gewinnt dann bei
   gleicher Spezifität — der Burger blieb dadurch auch auf dem Desktop sichtbar. */
.burger {
  display: grid;
  place-items: center;
  padding: 0.5rem;
  color: var(--color-steel-200);
}
@media (min-width: 1024px) {
  .burger {
    display: none;
  }
}

.mobile {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-graphite-700);
  padding: 1rem 1.5rem 1.5rem;
  background: var(--color-graphite-950);
}

.mobile__link {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-steel-200);
}
.mobile__link.router-link-active {
  color: var(--color-swiss-400);
}
@media (min-width: 1024px) {
  .mobile {
    display: none;
  }
}
</style>
