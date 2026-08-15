// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@nuxtjs/sitemap', '@tresjs/nuxt'],

  devtools: {
    enabled: true,
  },

  // Fraunces/Manrope/JetBrains Mono (main.css, --font-*) werden automatisch von
  // @nuxt/fonts erkannt und selbst gehostet (kein Google-Fonts-Request zur Laufzeit,
  // via @nuxt/ui mitgeliefert) — kein manueller <link> nötig.
  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://eduard-andrae.de',
  },

  // Design ist bewusst dark-first gebaut (Grafit + Stahl + Rot) — kein Light-Mode-Pendant
  // entworfen. preference: 'dark' (statt 'system') reicht zum Fixieren, es gibt ohnehin
  // keinen Toggle auf der Seite.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  runtimeConfig: {
    public: {
      // Via NUXT_PUBLIC_WORDPRESS_URL überschreibbar (z.B. für einen Staging-WP-Klon).
      wordpressUrl: 'https://eduard-andrae.de',
    },
  },

  compatibilityDate: '2026-08-15',

  nitro: {
    compressPublicAssets: { brotli: true, gzip: true },
    // Der TS2589-Workaround aus tb26-code (nitro.hooks['types:extend'], siehe dortige
    // docs/known-debt.md KD-004) fehlt hier bewusst: er greift erst ab ~270 typisierten
    // Server-Routen. Für dieses Ein-Seiten-Projekt kommt es dahin nicht — bei Bedarf
    // das dortige Muster 1:1 übernehmen.
  },

  eslint: {
    config: {
      stylistic: {
        semi: false,
        quotes: 'single',
        commaDangle: 'always-multiline',
        braceStyle: '1tbs',
      },
    },
  },

  icon: {
    // Werden nur dynamisch per Variable referenziert (SkillKnife.vue) — Nuxt Icons
    // Static-Scan findet sie so nicht automatisch, deshalb explizit bündeln.
    clientBundle: {
      icons: [
        'lucide:compass',
        'lucide:terminal',
        'lucide:pen-tool',
        'lucide:feather',
        'lucide:workflow',
        'lucide:megaphone',
      ],
    },
  },

  sitemap: {},
})
