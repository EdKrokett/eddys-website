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

  /**
   * Edge-Cache für die WordPress-Proxy-Routen — der eigentliche Hebel gegen die
   * langsamen Kacheln.
   *
   * Warum der In-Memory-Cache in `wpCache.ts` allein nicht reicht: Auf Vercel Serverless
   * lebt er nur so lange wie die Function-Instanz. Nach jedem Cold Start (und pro neuer
   * paralleler Instanz) ist er leer, und dann kostet `/api/blog?limit=24` den vollen
   * WordPress-Roundtrip — gemessen 1,6–3,0 s, warm dagegen 0,17 s. Genau diese Spanne
   * ist das, was als "manchmal fünf Sekunden" auffällt. Auf trusted-blogs tritt das
   * nicht auf, weil dort ein langlebiger Node-Prozess im Container läuft (Dockerfile),
   * dessen Modul-Cache tagelang warm bleibt — das Muster ist nicht übertragbar,
   * die Edge-Schicht davor ersetzt es.
   *
   * Bewusst `s-maxage`-Header statt Nitros `swr`/`isr`: Vercels ISR-Prerender-Functions
   * müssten die Query-Parameter per `allowQuery` einzeln freigeben, sonst fallen
   * `?limit=`/`?page=` unter den Tisch und alle Varianten teilen einen Eintrag. Der
   * CDN-Cache über `s-maxage` schlüsselt dagegen von Haus aus auf die volle URL
   * inklusive Query — genau das, was diese Routen brauchen.
   *
   * `max-age=0` hält den Browser-Cache außen vor (sonst sieht ein Besucher seine eigene
   * Kopie noch, wenn längst neu veröffentlicht wurde), `s-maxage=1800` deckt sich mit
   * der TTL in `wpCache.ts`, und `stale-while-revalidate` liefert 24 h lang sofort eine
   * alte Antwort aus, während im Hintergrund neu geholt wird. Damit trifft praktisch
   * kein Besucher mehr den kalten Pfad.
   */
  routeRules: {
    /**
     * Die Seiten selbst — die Lücke, die die drei Cache-Schichten oben offen ließen.
     *
     * Beim SSR ruft `useFetch('/api/blog')` die Nitro-Route DIREKT auf, nicht über das
     * CDN: der `s-maxage`-Cache unten greift also nur für Client-Anfragen, nie für das
     * Rendern der Seite. Auf einer kalten Function-Instanz kostete jede Blogseite
     * deshalb den vollen WordPress-Roundtrip — gemessen 1,44 s für `/blog` und 0,69 s
     * für einen Beitrag, warm dagegen 0,13 s bzw. 0,10 s (30.08.2026).
     *
     * `isr` legt die fertige HTML-Seite an den Edge. Kein Besucher wartet mehr auf
     * WordPress; nur die Regeneration nach Ablauf tut es, im Hintergrund.
     *
     * VORAUSSETZUNG, die dafür geschaffen wurde: `/blog` las `?q=` im Setup und
     * renderte serverseitig gefiltert. Da alle Query-Varianten sich einen Cache-Eintrag
     * teilen (siehe `allowQuery`-Hinweis unten), hätte das fremde Suchergebnisse
     * ausgeliefert. `app/pages/blog/index.vue` liest den Parameter jetzt in `onMounted`.
     * Neue Seiten mit `isr`/`swr` dürfen im SSR-Pfad keine Query-Parameter lesen.
     */
    '/blog': { isr: 1800 },
    '/blog/**': { isr: 3600 },

    '/api/blog': {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
      },
    },
    '/api/blog/**': {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
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

    /**
     * `screens` ist auf Vercel nicht nur ein Breakpoint-Alias, sondern die Liste der
     * ERLAUBTEN Bildbreiten: @nuxt/image schreibt genau diese Werte als `images.sizes`
     * in die Vercel-Build-Config, und der Vercel-Provider rundet jede angeforderte
     * Breite auf den nächstgrößeren Eintrag AUF. Alles, was nicht in der Liste steht,
     * beantwortet Vercel mit 400 (`INVALID_IMAGE_OPTIMIZE_REQUEST`).
     *
     * Der Default beginnt bei 640. Die Hero-Kacheln sind aber nur 240 CSS-px breit —
     * `width="240"` (1x) UND 480 (2x) rundeten beide auf 640 auf, das Kachelbild kam
     * also 2,7-fach zu groß und in beiden Dichten identisch: 26 KB statt 4 KB pro
     * Kachel, bei 24 Kacheln rund 620 KB für eine dekorative Hintergrundwand.
     *
     * 240/320/480 ergänzen den Default nach unten: 320 ist die Desktop-Kachel (5 Spalten,
     * ~290px breit), 240 die Mobile-Kachel, 480 deckt deren 2x-Variante sowie BlogCard
     * und Porträt ab. Statt zweimal 640 lädt eine Desktop-Kachel jetzt 7 KB (1x) bzw.
     * 26 KB (2x), eine Mobile-Kachel 4 KB bzw. 15 KB.
     * Nebeneffekt, bewusst in Kauf genommen: BlogCard (420) und das Porträt (440)
     * rutschen bei 1x von 640 auf 480 — das ist die korrekte Größe für ihren
     * Anzeigeplatz, vorher wurde dort ebenfalls überliefert.
     *
     * Beim Ändern dieser Liste immer gegenprüfen, dass jede im Template genutzte
     * `width` einen sinnvollen Zielwert findet — sonst rundet der Provider still
     * weiter nach oben.
     */
    screens: {
      'tile': 240,
      'tileDesktop': 320,
      'tile2x': 480,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      '2xl': 1536,
    },
  },

  sitemap: {},
})
