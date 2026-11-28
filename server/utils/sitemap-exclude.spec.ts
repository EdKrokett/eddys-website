import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Wächter für zwei Fehler, die Google Search Console am 28.11.2026 meldete
 * (docs/error-catalog.md):
 *
 * 1. Seiten mit `noindex` standen in der Sitemap. Die Sitemap sagt „bitte indexieren“,
 *    die Seite „bitte nicht“ — Google meldet das als Fehler.
 * 2. /robots.txt fehlte in public/ und landete über die Catch-all-Route bei WordPress.
 */
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PAGES = join(ROOT, 'app/pages')

let exclude: string[]

beforeAll(async () => {
  ;(globalThis as Record<string, unknown>).defineNuxtConfig = (config: unknown) => config
  // Pfad als Variable, Begründung in isr-route-rules.spec.ts.
  const configPath = '../../nuxt.config'
  const config = (await import(/* @vite-ignore */ configPath)).default as { sitemap: { exclude?: string[] } }
  exclude = config.sitemap.exclude ?? []
})

function vueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? vueFiles(join(dir, entry.name)) : entry.name.endsWith('.vue') ? [join(dir, entry.name)] : [],
  )
}

/** `app/pages/impressum.vue` → `/impressum`, `app/pages/blog/index.vue` → `/blog`. */
function routeOf(file: string): string {
  const path = relative(PAGES, file).replace(/\.vue$/, '').replace(/(^|\/)index$/, '')
  return `/${path}`
}

describe('Sitemap und noindex', () => {
  it('nimmt jede Seite mit noindex aus der Sitemap', () => {
    const noindex = vueFiles(PAGES)
      .filter(file => /robots:\s*['"][^'"]*noindex/.test(readFileSync(file, 'utf8')))
      .map(routeOf)
      .sort()

    // Die Erkennung selbst prüfen: Findet sie nichts mehr, wäre der Test still wertlos.
    expect(noindex).toEqual(['/datenschutz', '/impressum'])
    for (const route of noindex) expect(exclude, route).toContain(route)
  })

  it('schließt keine Seite aus, die gar kein noindex trägt', () => {
    expect([...exclude].sort()).toEqual(['/datenschutz', '/impressum'])
  })
})

describe('robots.txt', () => {
  it('liegt als Datei vor und nennt die Sitemap', () => {
    const file = join(ROOT, 'public/robots.txt')
    expect(existsSync(file)).toBe(true)
    const robots = readFileSync(file, 'utf8')
    expect(robots).toContain('Sitemap: https://eduard-andrae.de/sitemap.xml')
    expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m)
  })
})
