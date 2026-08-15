// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@nuxtjs/sitemap'],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://eduard-andrae.de',
  },

  colorMode: {
    preference: 'system',
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

  sitemap: {},
})
