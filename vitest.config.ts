import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Auch server/ und shared/, weil dort Logik mit Tests liegt (z. B. das Dekodieren
    // von HTML-Entities aus WordPress-Titeln in shared/utils/).
    include: ['app/**/*.spec.ts', 'server/**/*.spec.ts', 'shared/**/*.spec.ts'],
  },
})
