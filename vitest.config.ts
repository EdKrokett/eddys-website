import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['app/**/*.spec.ts'],
    // Noch keine Tests im frischen Scaffold — entfernen, sobald der erste *.spec.ts existiert.
    passWithNoTests: true,
  },
})
