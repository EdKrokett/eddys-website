/**
 * Baut das Open-Graph-Bild der Startseite (public/images/og-startseite.jpg).
 *
 * Warum ein Skript und kein handgemaltes Bild: Die Karte trägt denselben Text
 * wie der Hero. Ohne reproduzierbare Quelle wäre sie eine Binärdatei, die
 * niemand mehr nachziehen kann, wenn der Text sich ändert.
 *
 * Warum Text als Pfade statt als <text>: Das librsvg in sharp rendert auf macOS
 * über CoreText und sieht nur systemweit installierte Schriften — Fraunces,
 * Manrope und JetBrains Mono sind aber nur Web-Fonts des Projekts. Ein <text>
 * würde still auf Helvetica zurückfallen, also genau die Optik, die die Seite
 * vermeiden soll. Deshalb werden die Glyphen hier selbst zu SVG-Pfaden
 * ausgelegt: gleiche Schriften wie die Seite, unabhängig vom Rechner.
 *
 * Bekannte Grenze: fontkitten kennt kein OpenType-Shaping, also kein Kerning.
 * Bei den kurzen Zeilen hier fällt das nicht auf — bei längeren Fließtexten
 * würde es das.
 *
 * Die Schriften liegen NICHT im Repo, sondern werden einmalig von Google Fonts
 * (OFL) nach .data/og-fonts geladen.
 *
 *   npm run og:build
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { create } from 'fontkitten'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const FONT_DIR = resolve(ROOT, '.data/og-fonts')
const PORTRAIT = resolve(ROOT, 'public/images/eddy-portrait.png')
const OUT = resolve(ROOT, 'public/images/og-startseite.jpg')

const FONT_SOURCES = {
  Fraunces: 'https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf',
  Manrope: 'https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf',
  JetBrainsMono: 'https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf',
}

// Variationen wie auf der Seite: Überschriften sind Fraunces 600, und
// font-optical-sizing:auto bedeutet bei dieser Größe opsz ≈ Schriftgrad.
const VARIATIONS = {
  Fraunces: { wght: 600, opsz: 96, SOFT: 0, WONK: 1 },
  Manrope: { wght: 400 },
  JetBrainsMono: { wght: 400 },
}

// Palette 1:1 aus app/assets/css/main.css — bewusst dupliziert, weil hier keine
// CSS-Custom-Properties zur Verfügung stehen.
const C = {
  graphite950: '#0e0f12',
  graphite700: '#292b31',
  accent300: '#58c5bb',
  accent400: '#35b3ad',
  steel100: '#f4f3ef',
  steel300: '#c7cbd5',
  steel500: '#7a808b',
}

const W = 1200
const H = 630
const PAD = 72

async function loadFonts() {
  await mkdir(FONT_DIR, { recursive: true })
  const fonts = {}
  for (const [name, url] of Object.entries(FONT_SOURCES)) {
    const file = resolve(FONT_DIR, `${name}.ttf`)
    try {
      await access(file)
    } catch {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Schrift ${name} nicht ladbar: HTTP ${res.status}`)
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
      console.warn(`  geladen: ${name}.ttf`)
    }
    fonts[name] = create(await readFile(file)).getVariation(VARIATIONS[name])
  }
  return fonts
}

/**
 * Legt eine Textzeile als SVG-Pfadgruppe aus. `letterSpacing` ist — wie in CSS —
 * in em angegeben, damit die Werte direkt aus main.css übernommen werden können.
 */
function line(font, text, { x, y, size, fill, letterSpacing = 0 }) {
  const scale = size / font.unitsPerEm
  const tracking = letterSpacing * size
  let pen = x
  const paths = []
  for (const glyph of font.glyphsForString(text)) {
    const d = glyph.path.toSVG()
    // Leerzeichen haben keinen Umriss, schieben den Stift aber weiter.
    if (d) paths.push(`<path transform="translate(${pen.toFixed(2)} ${y}) scale(${scale.toFixed(5)} ${-scale.toFixed(5)})" d="${d}"/>`)
    pen += glyph.advanceWidth * scale + tracking
  }
  return `<g fill="${fill}">${paths.join('')}</g>`
}

function buildSvgs(fonts) {
  const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="0.76" cy="0.5" r="0.62">
      <stop offset="0" stop-color="${C.accent400}" stop-opacity="0.17"/>
      <stop offset="1" stop-color="${C.accent400}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.graphite950}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05"/>
</svg>`

  // Feste Grundlinien statt Textfluss: Der Text ist bekannt und ändert sich nur,
  // wenn der Hero sich ändert — dann wird hier mitgezogen.
  const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="${PAD}" y="112" width="40" height="2" fill="${C.accent400}"/>
  ${line(fonts.JetBrainsMono, 'BREMEN · SEIT 1966 UNTERWEGS', { x: PAD + 58, y: 120, size: 15, fill: C.steel500, letterSpacing: 0.16 })}

  ${line(fonts.Fraunces, 'Eduard', { x: PAD, y: 248, size: 96, fill: C.steel100, letterSpacing: -0.045 })}
  ${line(fonts.Fraunces, 'Andrae', { x: PAD, y: 336, size: 96, fill: C.steel100, letterSpacing: -0.045 })}

  ${line(fonts.Manrope, 'Uhrmachermeister, der Startup-Gründer wurde.', { x: PAD, y: 412, size: 25, fill: C.steel300 })}
  ${line(fonts.Manrope, 'Kettenraucher, der Marathonläufer wurde.', { x: PAD, y: 450, size: 25, fill: C.steel300 })}

  <rect x="${PAD}" y="524" width="560" height="1" fill="${C.graphite700}"/>
  ${line(fonts.JetBrainsMono, 'EDUARD-ANDRAE.DE', { x: PAD, y: 566, size: 16, fill: C.accent300, letterSpacing: 0.16 })}
</svg>`

  return { background, foreground }
}

async function buildPortrait() {
  const { width, height } = await sharp(PORTRAIT).metadata()
  const targetHeight = 520
  const targetWidth = Math.round(targetHeight * (width / height))

  // Weicher Abriss unten wie auf der Seite (mask-image in index.vue) — sonst
  // schneidet der Freisteller hart an der Bildkante ab.
  const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}">
    <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.88" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs>
    <rect width="${targetWidth}" height="${targetHeight}" fill="url(#f)"/>
  </svg>`)

  const buffer = await sharp(PORTRAIT)
    .resize(targetWidth, targetHeight, { fit: 'inside' })
    .composite([{ input: fade, blend: 'dest-in' }])
    .png()
    .toBuffer()

  return { buffer, left: W - 15 - targetWidth, top: H - targetHeight }
}

const fonts = await loadFonts()
const { background, foreground } = buildSvgs(fonts)
const portrait = await buildPortrait()

await sharp(Buffer.from(background))
  .composite([
    { input: portrait.buffer, left: portrait.left, top: portrait.top },
    { input: Buffer.from(foreground), left: 0, top: 0 },
  ])
  .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
  .toFile(OUT)

const { size } = await sharp(OUT).stats().then(() => sharp(OUT).metadata())
console.warn(`OG-Bild geschrieben: ${OUT}${size ? ` (${Math.round(size / 1024)} KB)` : ''}`)
