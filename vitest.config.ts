import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Derselbe Alias wie in Nuxt. Ein relativer Import (`../../shared/…`) läuft zwar
      // in Vitest und im Dev-Server, bricht aber den Produktions-Build: Im SSR-Bundle
      // stimmt der Pfad nicht mehr (docs/error-catalog.md).
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    // Auch server/ und shared/, weil dort Logik mit Tests liegt (z. B. das Dekodieren
    // von HTML-Entities aus WordPress-Titeln in shared/utils/).
    include: ['app/**/*.spec.ts', 'server/**/*.spec.ts', 'shared/**/*.spec.ts'],
  },
})
