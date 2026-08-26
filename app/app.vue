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
