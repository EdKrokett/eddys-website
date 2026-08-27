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

const links = [
  { to: '/ueber-mich', label: 'Über mich' },
  { to: '/blog', label: 'Blog' },
  { to: '/kontakt', label: 'Kontakt' },
]

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
  height: 1.25rem;
  background: var(--color-accent-500);
  transition: height 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.brand:hover .brand__mark {
  height: 1.5rem;
}

.brand__name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-steel-100);
}

/* ── Navigation ─────────────────────────────────────────────────────────── */
.navlink {
  position: relative;
  font-size: var(--text-sm);
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
  background: var(--color-accent-500);
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
  padding: 0.95rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
  font-size: var(--text-lg);
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-steel-200);
}
.mobile__link.router-link-active {
  color: var(--color-accent-400);
}
@media (min-width: 1024px) {
  .mobile {
    display: none;
  }
}
</style>
