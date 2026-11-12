/* eslint-disable no-console -- Kommandozeilen-Skript, die Ausgabe ist das Ergebnis. */
/**
 * Prüft die Headless-Weiterleitung von blog.eduard-andrae.de auf eduard-andrae.de.
 *
 * Gegenstück zum Plugin wordpress/eddy-headless-redirect/, Konzept und Zuordnungstabelle:
 * docs/headless-wordpress.md.
 *
 * Funktioniert in beiden Stellungen des Plugins:
 *   - Testmodus: wertet den Header X-Eddy-Redirect aus (Ziel) bzw. X-Eddy-Redirect-Skip
 *     (Grund, warum nicht umgeleitet würde).
 *   - Aktiv: wertet die echte 301 und ihren Location-Header aus.
 * Eine 301 von Redirection (läuft vor dem Plugin) zählt genauso.
 *
 * Danach wird jedes Ziel einmal auf eduard-andrae.de aufgerufen: Es muss 200 liefern
 * (keine 404, keine Weiterleitung) und als Canonical genau sich selbst nennen.
 *
 * Optional mit WP_USER und WP_APP_PASSWORD (aus .env): prüft zusätzlich, dass die
 * Vorschau eines Entwurfs für Anonyme eine 404 bleibt und NICHT umgeleitet wird.
 *
 *   npm run check:headless
 */

const WP = 'https://blog.eduard-andrae.de'
const SITE = 'https://eduard-andrae.de'
/**
 * Bewusst gedrosselt. Der erste Lauf am 12.11.2026 schickte je sechs Anfragen parallel an
 * WordPress und an die Nuxt-Seite. WordPress kam ins Straucheln, 171 Beitragsseiten
 * renderten als 404, und Vercel hielt diese 404 per ISR fest (docs/error-catalog.md,
 * „Kurzer WordPress-Ausfall wird als 404 gecacht“).
 */
const CONCURRENCY = 2
const PAUSE_MS = 150

/** Notaus: Ab so vielen 5xx-Antworten bricht das Skript ab, statt weiter Last zu machen. */
const MAX_SERVER_ERRORS = 3
let serverErrors = 0

function noteStatus(status, url) {
  if (status < 500) return
  serverErrors++
  console.log(`  ! ${status} von ${url}`)
  if (serverErrors >= MAX_SERVER_ERRORS) {
    console.log(`\nAbbruch: ${serverErrors} Serverfehler. WordPress oder die Nuxt-Seite ist überlastet oder gestört.`)
    console.log('Erst prüfen, ob die Seiten normal antworten, dann erneut starten.')
    process.exit(2)
  }
}

/** Seiten mit eigenem Ziel, wie EDDY_HR_PAGE_TARGETS im Plugin. Sonst gilt /blog. */
const PAGE_TARGETS = {
  impressum: '/impressum',
  disclaimer: '/datenschutz',
  statistik: '/statistik',
  gewichtiges: '/statistik',
}

const SPECIAL_SLUG = 'zwischenbericht-1-madeira-beine-%e2%88%925-kg-und-die-geloeste-handbremse'

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function authHeader() {
  const user = process.env.WP_USER
  const pass = process.env.WP_APP_PASSWORD
  if (!user || !pass) return null
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

async function wpJson(path, { auth = false } = {}) {
  const headers = {}
  if (auth) {
    const value = authHeader()
    if (!value) return null
    headers.Authorization = value
  }
  const res = await fetch(`${WP}/wp-json${path}`, { headers })
  if (!res.ok) return null
  return {
    data: await res.json(),
    totalPages: Number(res.headers.get('x-wp-totalpages') ?? '1'),
  }
}

async function allOf(type, fields) {
  const items = []
  for (let page = 1; ; page++) {
    const res = await wpJson(`/wp/v2/${type}?per_page=100&page=${page}&_fields=${fields}`)
    if (!res) throw new Error(`REST-Abruf /wp/v2/${type} Seite ${page} fehlgeschlagen`)
    items.push(...res.data)
    if (page >= res.totalPages) return items
  }
}

/** Letztes Pfadsegment eines WordPress-Links, z. B. `mein-beitrag`. */
function slugOf(link) {
  return new URL(link).pathname.split('/').filter(Boolean).pop() ?? ''
}

/** Wie eddy_hr_post_path() im Plugin: einheitlich kodiert, große Hex-Ziffern. */
function postTarget(slug) {
  if (!slug) return `${SITE}/blog`
  return `${SITE}/blog/${encodeURIComponent(decodeURIComponent(slug))}`
}

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: 'manual' })
    await res.body?.cancel()
    noteStatus(res.status, url)
    const location = res.headers.get('location')
    const header = res.headers.get('x-eddy-redirect')
    const isRedirect = res.status >= 300 && res.status < 400
    return {
      status: res.status,
      header,
      skip: res.headers.get('x-eddy-redirect-skip'),
      redirectBy: res.headers.get('x-redirect-by'),
      target: header ?? (isRedirect ? new URL(location ?? '', url).href : null),
    }
  } catch (error) {
    return { status: 0, error: String(error?.cause ?? error) }
  }
}

async function pool(items, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i])
      await new Promise(resolve => setTimeout(resolve, PAUSE_MS))
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run))
  return results
}

function canonicalOf(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel=["']?canonical["']?/i.test(tag)) continue
    const href = tag.match(/\bhref=["']([^"']+)["']/i)
    if (href) return href[1].replaceAll('&amp;', '&')
  }
  return null
}

// ---------------------------------------------------------------------------
// Fälle zusammenstellen
// ---------------------------------------------------------------------------

/**
 * @typedef {{ label: string, url: string, target?: string, none?: { status?: number, skip?: string } }} Case
 * `target`: muss genau dorthin zeigen. `none`: darf NICHT umleiten.
 */

async function buildCases() {
  /** @type {Case[]} */
  const cases = []
  const notes = []

  const posts = await allOf('posts', 'id,link,date')
  for (const post of posts) {
    cases.push({ label: 'Beitrag', url: post.link, target: postTarget(slugOf(post.link)) })
  }

  const special = posts.find(p => slugOf(p.link) === SPECIAL_SLUG)
  if (special) {
    cases.push({
      label: 'Sonderzeichen-Slug, Großschreibung der Kodierung',
      // Links tippen die Hex-Ziffern mal groß, mal klein; das Ziel muss trotzdem dasselbe sein.
      url: `${WP}/${SPECIAL_SLUG.replace(/%[0-9a-f]{2}/g, m => m.toUpperCase())}/`,
      target: postTarget(SPECIAL_SLUG),
    })
  } else {
    notes.push(`Sonderzeichen-Beitrag ${SPECIAL_SLUG} nicht in der REST-Liste gefunden`)
  }

  const pages = await allOf('pages', 'link,slug')
  for (const page of pages) {
    cases.push({ label: `Seite ${page.slug}`, url: page.link, target: `${SITE}${PAGE_TARGETS[page.slug] ?? '/blog'}` })
  }

  const first = posts[0]
  if (first) {
    cases.push({ label: 'Kurzlink ?p=', url: `${WP}/?p=${first.id}`, target: postTarget(slugOf(first.link)) })
    cases.push({ label: 'Embed', url: `${first.link}embed/`, none: { status: 200, skip: 'embed' } })
    cases.push({ label: 'Kommentar-Feed eines Beitrags', url: `${first.link}feed/`, none: { status: 200, skip: 'feed' } })
  }

  const oldest = posts.at(-1)
  if (oldest) {
    const year = new Date(oldest.date).getFullYear()
    cases.push({ label: 'Datumsarchiv', url: `${WP}/${year}/`, target: `${SITE}/blog` })
  }

  for (const [type, label] of [['categories', 'Kategorie'], ['tags', 'Schlagwort'], ['users', 'Autor']]) {
    const res = await wpJson(`/wp/v2/${type}?per_page=1&_fields=link`)
    const link = res?.data?.[0]?.link
    if (link) cases.push({ label, url: link, target: `${SITE}/blog` })
    else notes.push(`${label}: kein Link über die REST-API, Fall übersprungen`)
  }

  const media = await wpJson('/wp/v2/media?per_page=1&_fields=link,source_url,post')
  const item = media?.data?.[0]
  if (item) {
    cases.push({ label: 'Bild unter wp-content/uploads', url: item.source_url, none: { status: 200 } })
    let target = `${SITE}/blog`
    if (item.post) {
      const parent = await wpJson(`/wp/v2/posts/${item.post}?_fields=link`)
      if (parent?.data?.link) target = postTarget(slugOf(parent.data.link))
    }
    cases.push({ label: 'Anhangseite', url: item.link, target })
  }

  cases.push(
    { label: 'Startseite', url: `${WP}/`, target: `${SITE}/blog` },
    { label: 'Paginierung', url: `${WP}/page/2/`, target: `${SITE}/blog` },
    { label: 'Suche', url: `${WP}/?s=madeira`, target: `${SITE}/blog?q=madeira` },
    { label: 'Suche mit Umlaut und Leerzeichen', url: `${WP}/?s=${encodeURIComponent('über berlin')}`, target: `${SITE}/blog?q=${encodeURIComponent('über berlin')}` },
    { label: 'Leere Suche', url: `${WP}/?s=`, target: `${SITE}/blog` },
    { label: 'Unbekannter Pfad', url: `${WP}/gibt-es-nicht-${Date.now()}/`, none: { status: 404, skip: '404' } },
    { label: 'Feed', url: `${WP}/feed/`, none: { status: 200, skip: 'feed' } },
    { label: 'REST-API', url: `${WP}/wp-json/`, none: { status: 200 } },
    { label: 'Login', url: `${WP}/wp-login.php`, none: { status: 200 } },
    { label: 'robots.txt', url: `${WP}/robots.txt`, none: { status: 200 } },
    { label: 'Sitemap (The SEO Framework)', url: `${WP}/sitemap.xml`, none: {} },
  )

  if (authHeader()) {
    const drafts = await wpJson('/wp/v2/posts?status=draft&per_page=1&_fields=id', { auth: true })
    const draft = drafts?.data?.[0]
    if (draft) {
      cases.push({ label: 'Vorschau eines Entwurfs (anonym)', url: `${WP}/?p=${draft.id}&preview=true`, none: { status: 404, skip: '404' } })
    } else {
      notes.push('Kein Entwurf vorhanden, Vorschau-Fall übersprungen')
    }
  } else {
    notes.push('WP_USER/WP_APP_PASSWORD fehlen, Vorschau-Fall übersprungen')
  }

  return { cases, notes }
}

// ---------------------------------------------------------------------------
// Auswertung
// ---------------------------------------------------------------------------

function judge(c, r) {
  if (r.error) return `nicht erreichbar: ${r.error}`

  if (c.target !== undefined) {
    if (r.target === null) return `keine Umleitung (Status ${r.status}${r.skip ? `, Skip: ${r.skip}` : ''}), erwartet ${c.target}`
    if (r.target !== c.target) return `Ziel ${r.target}${r.redirectBy ? ` (von ${r.redirectBy})` : ''}, erwartet ${c.target}`
    return null
  }

  if (r.target !== null) return `leitet um nach ${r.target}, darf es aber nicht`
  if (c.none.status !== undefined && r.status !== c.none.status) return `Status ${r.status}, erwartet ${c.none.status}`
  if (c.none.skip && r.skip !== null && r.skip !== c.none.skip) return `Skip-Grund ${r.skip}, erwartet ${c.none.skip}`
  return null
}

async function checkTarget(target) {
  try {
    const res = await fetch(target, { redirect: 'manual' })
    noteStatus(res.status, target)
    if (res.status !== 200) {
      const location = res.headers.get('location')
      await res.body?.cancel()
      return `Status ${res.status}${location ? ` → ${location}` : ''}`
    }
    const canonical = canonicalOf(await res.text())
    const expected = target.split('?')[0]
    if (canonical !== expected) return `Canonical ${canonical ?? '(fehlt)'}, erwartet ${expected}`
    return null
  } catch (error) {
    return `nicht erreichbar: ${String(error?.cause ?? error)}`
  }
}

const { cases, notes } = await buildCases()
console.log(`Prüfe ${cases.length} Adressen auf ${WP} …`)

const results = await pool(cases, c => probe(c.url))
const failures = []
let viaHeader = 0
let via301 = 0

cases.forEach((c, i) => {
  const r = results[i]
  if (r.header) viaHeader++
  else if (r.target) via301++
  const problem = judge(c, r)
  if (problem) failures.push(`  ✗ ${c.label}: ${c.url}\n      ${problem}`)
})

const targets = [...new Set(cases.map(c => c.target).filter(Boolean))]
console.log(`Prüfe ${targets.length} Ziele auf ${SITE} …`)
const targetProblems = await pool(targets, checkTarget)
targets.forEach((t, i) => {
  if (targetProblems[i]) failures.push(`  ✗ Ziel ${t}\n      ${targetProblems[i]}`)
})

console.log('')
console.log(`Test-Header: ${viaHeader}, echte Weiterleitungen: ${via301}`)
if (viaHeader === 0 && via301 <= 1) {
  console.log('Hinweis: Fast keine Umleitung erkannt. Plugin nicht aktiv oder auf „Aus“?')
}
for (const note of notes) console.log(`Hinweis: ${note}`)

if (failures.length > 0) {
  console.log(`\n${failures.length} Fehler:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log(`\nAlles in Ordnung: ${cases.length} Adressen, ${targets.length} Ziele.`)
