/**
 * Schreibt Alt-Domain-URLs im WordPress-Inhalt auf blog.eduard-andrae.de um.
 *
 * WARUM das nötig ist: WordPress speichert die gerenderten Block-Inhalte mit
 * absoluten URLs in der Datenbank. Die Umstellung von WP_HOME/WP_SITEURL/
 * WP_CONTENT_URL (Phase B der Domain-Migration) wirkt nur auf NEU erzeugtes
 * Markup — in den Bestandsbeiträgen stehen weiterhin `www.eduard-andrae.de`-URLs.
 * Messung vom 26.08.2026: 41 der 50 zuletzt veröffentlichten Beiträge betroffen.
 *
 * Heute fällt das nicht auf, weil die alte Domain noch auf den Blog weiterleitet.
 * Nach Phase C (DNS-Umschaltung auf Vercel) zeigt sie aber auf die neue Nuxt-Seite
 * — dann wären sämtliche Beitragsbilder tot. Diese Funktion ist der defensive
 * Schutz davor; die saubere Lösung ist zusätzlich ein Search-Replace in der
 * WordPress-Datenbank (siehe docs/known-debt.md).
 *
 * PRE:  html ist string, undefined oder null
 * POST: keine URL zeigt mehr auf (www.)eduard-andrae.de
 * INV:  bereits korrekte blog.-URLs und fremde Domains bleiben unangetastet;
 *       es entsteht nie `blog.blog.`
 */

/**
 * `//` davor ist Pflicht, damit `blog.eduard-andrae.de` nicht getroffen wird:
 * dort steht vor `eduard-andrae.de` ein `blog.` statt eines Protokoll-Trenners.
 * Das abschließende `(?=[/"'\s)]|$)` verhindert Treffer auf Domains, die nur so
 * anfangen (z. B. `eduard-andrae.de.example.com`).
 */
const LEGACY_HOST = /(?:https?:)?\/\/(?:www\.)?eduard-andrae\.de(?=[/"'\s)]|$)/gi

const CURRENT_ORIGIN = 'https://blog.eduard-andrae.de'

export function rewriteLegacyWpUrls(html: string | undefined | null): string {
  if (!html) return ''
  return html.replace(LEGACY_HOST, CURRENT_ORIGIN)
}

/**
 * Wie `rewriteLegacyWpUrls`, gibt aber `undefined` statt `''` zurück — für optionale
 * Felder wie `featuredImage`, wo ein leerer String im Template als "Bild vorhanden"
 * durchgehen und ein kaputtes <img> erzeugen würde.
 */
export function normalizeImageUrl(url: string | undefined | null): string | undefined {
  const rewritten = rewriteLegacyWpUrls(url)
  return rewritten === '' ? undefined : rewritten
}
