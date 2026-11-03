<script setup lang="ts">
/**
 * Canonical für jede Seite an einer Stelle, damit keine neue Seite es vergisst.
 * Nur `route.path`: Die Query darf nicht einfließen, sonst rendert eine ISR-Seite je nach
 * Aufruf anders (docs/performance.md). Fehlerseiten rendert app/error.vue ohne diese Datei.
 * Hintergrund: docs/headless-wordpress.md, Schritt 1.
 */
const route = useRoute()
const { url: siteUrl } = useSiteConfig()

useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl(siteUrl, route.path) }],
})
</script>

<template>
  <UApp>
    <div class="shell">
      <Header />
      <main class="shell__main">
        <NuxtPage />
      </main>
      <SiteFooter />
    </div>
  </UApp>
</template>

<style scoped>
/* Footer bleibt auch auf kurzen Seiten unten. */
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.shell__main {
  flex: 1;
}
</style>
