import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Wächter für eine Fehlerklasse, die sich beim Nachprüfen per Direktaufruf versteckt
 * (docs/error-catalog.md, „Neues Beitragsbild blitzt auf und verschwindet wieder“).
 *
 * Ohne `allowQuery` cacht Vercel jede Query-Variante einer ISR-Seite einzeln. Der
 * Browser lädt die Payload als `_payload.json?<buildId>`, der Webhook erneuert
 * `_payload.json` — die Fassung, die Besucher bekommen, bliebe dann veraltet.
 */
interface IsrRule {
  isr?: number | boolean | { expiration?: number | false, allowQuery?: string[] }
}

let routeRules: Record<string, IsrRule>
let nitroStorage: Record<string, { driver?: string }> | undefined
let nitroDevStorage: Record<string, { driver?: string }> | undefined

beforeAll(async () => {
  // `defineNuxtConfig` ist außerhalb von Nuxt nicht definiert; die Konfiguration ist
  // ein reines Objekt, also reicht ein Durchreicher.
  ;(globalThis as Record<string, unknown>).defineNuxtConfig = (config: unknown) => config
  // Pfad bewusst als Variable: Ein fester Import zöge nuxt.config.ts in den Typecheck des
  // Server-Kontexts, und dort kennt TypeScript `defineNuxtConfig` nicht.
  const configPath = '../../nuxt.config'
  const config = (await import(/* @vite-ignore */ configPath)).default as {
    routeRules: Record<string, IsrRule>
    nitro?: {
      storage?: Record<string, { driver?: string }>
      devStorage?: Record<string, { driver?: string }>
    }
  }
  routeRules = config.routeRules
  nitroStorage = config.nitro?.storage
  nitroDevStorage = config.nitro?.devStorage
})

describe('ISR-Regeln in nuxt.config.ts', () => {
  it('cachen genau die erwarteten Seiten', () => {
    // Fällt hier eine Seite weg oder kommt eine dazu, gehört auch der Webhook
    // (server/utils/revalidate-paths.ts) auf den Prüfstand.
    const isrRoutes = Object.keys(routeRules).filter(route => routeRules[route]!.isr !== undefined)
    expect(isrRoutes.sort()).toEqual(['/blog', '/blog/**', '/statistik'])
  })

  it('ignorieren bei jeder Seite die Query-Werte', () => {
    for (const [route, rule] of Object.entries(routeRules)) {
      if (rule.isr === undefined) continue
      // Eine Zahl oder `true` heißt: kein allowQuery, also ein Eintrag pro Query-Variante.
      expect(typeof rule.isr, route).toBe('object')
      expect((rule.isr as { allowQuery?: string[] }).allowQuery, route).toEqual([])
    }
  })

  it('behalten ihre Ablauffristen', () => {
    expect(routeRules['/blog']!.isr).toMatchObject({ expiration: 1800 })
    expect(routeRules['/blog/**']!.isr).toMatchObject({ expiration: 3600 })
    expect(routeRules['/statistik']!.isr).toMatchObject({ expiration: 86400 })
  })
})

/**
 * Wächter für „Neuer Kommentar blitzt auf und verschwindet“ (28.11.2026,
 * docs/error-catalog.md). Solange es ISR-Seiten gibt, darf Nuxts Payload-Zwischenspeicher
 * nichts behalten: Sonst beantwortet er die Payload-Anfrage des Webhooks mit einer alten
 * Fassung, und die landet als frisch am Edge.
 */
describe('Nuxts Payload-Zwischenspeicher', () => {
  it('ist in Produktion auf den Null-Treiber gelegt', () => {
    expect(nitroStorage?.['cache:nuxt:payload']).toEqual({ driver: 'null' })
  })

  it('ist auch im Dev-Server abgeschaltet, damit sich beide gleich verhalten', () => {
    expect(nitroDevStorage?.['cache:nuxt:payload']).toEqual({ driver: 'null' })
  })
})
