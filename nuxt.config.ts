// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@nuxtjs/sitemap'],

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
      wordpressUrl: 'https://blog.eduard-andrae.de',
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
    // Die Social-Icons werden nur dynamisch per Variable referenziert
    // (SiteFooter/kontakt.vue über SOCIAL_PROFILES) — der Static-Scan von Nuxt Icons
    // findet sie so nicht, deshalb explizit bündeln.
    clientBundle: {
      icons: [
        'lucide:linkedin',
        'lucide:facebook',
        'lucide:globe',
        'lucide:youtube',
        'lucide:instagram',
      ],
    },
  },

  // IPX blockt per Default jeden Remote-Host (IPX_FORBIDDEN_HOST) — ohne diese
  // Freigabe würde NuxtImg für die WordPress-Blogbilder (Hero-Kachelwand) einfach
  // fehlschlagen. WordPress ist auf blog.eduard-andrae.de umgezogen (Migrationsplan
  // Phase B), eduard-andrae.de/www.eduard-andrae.de übernimmt die neue Nuxt-Seite.
  image: {
    domains: ['blog.eduard-andrae.de'],
  },

  sitemap: {},
})
