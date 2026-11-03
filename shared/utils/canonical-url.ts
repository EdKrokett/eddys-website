/**
 * Kanonische Adresse einer Seite: Website plus Pfad, ohne Query, ohne abschließenden
 * Schrägstrich, Sonderzeichen in EINER Kodierung.
 *
 * Die Kodierung ist der heikle Teil: `/blog/a-%e2%88%92-b` und `/blog/a-%E2%88%92-b` sind
 * dieselbe Seite (WordPress liefert Slugs mit kleinen Hex-Ziffern, Links tippen sie mal so,
 * mal so). Dekodieren und mit `encodeURI` neu kodieren ergibt immer große Hex-Ziffern, genau
 * wie das Sitemap-Modul (ufo `encodePath`) die Beitrags-URLs schreibt. Canonical und Sitemap
 * nennen damit Zeichen für Zeichen dieselbe Adresse. Herleitung: docs/headless-wordpress.md.
 *
 * Ohne Query, weil ISR-Seiten query-unabhängig rendern (docs/performance.md): `/blog?q=…`
 * ist kein eigenes Original, und `?utm_…`/`?fbclid=…` schon gar nicht.
 *
 * @param siteUrl z. B. `https://eduard-andrae.de`, abschließender Schrägstrich egal
 * @param path Pfad mit führendem Schrägstrich, darf schon kodiert sein
 */
export function canonicalUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, '')
  const withoutQuery = path.split(/[?#]/)[0] ?? ''
  const trimmed = withoutQuery.replace(/\/+$/, '')

  if (trimmed === '') return `${base}/`

  return `${base}${normalizeEncoding(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)}`
}

function normalizeEncoding(path: string): string {
  try {
    return encodeURI(decodeURI(path))
  } catch {
    // EXTERN: kaputte Kodierung (`%E2%8`) lässt decodeURI werfen. Dann lieber den Pfad
    // unverändert nennen als die ganze Seite mit einem Fehler abbrechen.
    return path
  }
}
