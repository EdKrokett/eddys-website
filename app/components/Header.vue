<script setup lang="ts">
/**
 * Struktur 1:1 von der bisherigen Startseite (www.eduard-andrae.de, WordPress:
 * Das bin ich / Mein Statistik-Kram / Kooperationen / Impressum-Untermenü + Suche)
 * übernommen, Inhalt an das neue Portfolio-Konzept angepasst: "Das bin ich" →
 * "Über mich" (Anker auf der Startseite), "Mein Statistik-Kram" → "Blog".
 * Kein "Cookie-Richtlinie"-Punkt (wie bei trusted-blogs): ohne Tracking/Cookies,
 * die Einwilligung brauchen, gibt es nichts zu regeln — kommt Tracking dazu, dann
 * dafür ein Consent-Banner statt einer statischen Cookie-Seite (Muster von
 * tb26-code/frontend/app/components/CookieBanner.vue).
 */
const mobileOpen = ref(false)
const searchQuery = ref('')

function onSearch() {
  const q = searchQuery.value.trim()
  navigateTo({ path: '/blog', query: q ? { q } : {} })
  mobileOpen.value = false
}
</script>

<template>
  <header class="header">
    <UContainer class="flex h-16 items-center justify-between gap-4">
      <NuxtLink to="/" class="shrink-0 text-lg font-bold text-white">
        Eduard Andrae
      </NuxtLink>

      <!-- Desktop-Navigation -->
      <nav class="hidden items-center gap-6 lg:flex">
        <NuxtLink to="/#ueber-mich" class="header__link">
          Über mich
        </NuxtLink>
        <NuxtLink to="/blog" class="header__link">
          Blog
        </NuxtLink>
        <NuxtLink to="/kooperationen" class="header__link">
          Kooperationen
        </NuxtLink>

        <div class="group relative">
          <button type="button" class="header__link flex items-center gap-1">
            Impressum
            <Icon name="lucide:chevron-down" class="size-3.5" />
          </button>
          <div class="header__dropdown">
            <NuxtLink to="/impressum" class="header__dropdown-item">
              Impressum
            </NuxtLink>
            <a
              href="https://blog.eduard-andrae.de/disclaimer/"
              class="header__dropdown-item"
            >
              Haftung und Datenschutz
            </a>
          </div>
        </div>

        <form class="header__search" @submit.prevent="onSearch">
          <Icon name="lucide:search" class="size-4 shrink-0 text-white/50" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Suchen …"
            class="w-32 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none focus:w-44 transition-all"
          >
        </form>
      </nav>

      <!-- Mobile Toggle -->
      <button
        type="button"
        class="flex items-center justify-center rounded-lg p-2 text-white lg:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Menü öffnen"
        @click="mobileOpen = !mobileOpen"
      >
        <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-6" />
      </button>
    </UContainer>

    <!-- Mobile-Menü -->
    <div v-if="mobileOpen" class="header__mobile lg:hidden">
      <form class="header__mobile-search" @submit.prevent="onSearch">
        <Icon name="lucide:search" class="size-4 shrink-0 text-white/50" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Suchen …"
          class="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        >
      </form>

      <NuxtLink to="/#ueber-mich" class="header__mobile-link" @click="mobileOpen = false">
        Über mich
      </NuxtLink>
      <NuxtLink to="/blog" class="header__mobile-link" @click="mobileOpen = false">
        Blog
      </NuxtLink>
      <NuxtLink to="/kooperationen" class="header__mobile-link" @click="mobileOpen = false">
        Kooperationen
      </NuxtLink>
      <NuxtLink to="/impressum" class="header__mobile-link" @click="mobileOpen = false">
        Impressum
      </NuxtLink>
      <a href="https://blog.eduard-andrae.de/disclaimer/" class="header__mobile-link header__mobile-link--sub">
        Haftung und Datenschutz
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #0f1a21;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header__link {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  transition: color 150ms ease;
}
.header__link:hover {
  color: #58c5bb;
}

.header__dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  min-width: 220px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #17222b;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: opacity 150ms ease;
}
.group:hover .header__dropdown,
.group:focus-within .header__dropdown {
  opacity: 1;
  visibility: visible;
}

.header__dropdown-item {
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  transition: background 150ms ease;
}
.header__dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.header__search {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 6px 12px;
}

.header__mobile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 24px 20px;
}

.header__mobile-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 10px 14px;
}

.header__mobile-link {
  border-radius: 8px;
  padding: 10px 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}
.header__mobile-link--sub {
  padding-left: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}
</style>
