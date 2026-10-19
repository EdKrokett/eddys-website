import { decodeHtmlEntities } from '#shared/utils/html-entities'
import { IMAGE_PROXY_HOSTS } from '#shared/utils/image-proxy-hosts'
import { escapeAttribute, isOwnHost, normalizedHost, parseAttributes, parseUrl, TAG_BODY } from './html/wp-html'

/**
 * Leitet Bilder von fremden Servern im Beitrags-HTML über den eigenen Bild-Proxy.
 *
 * Alte Beiträge binden Bilder direkt von Blogspot, Picasa oder Facebook ein. Der Browser
 * fragte dafür beim Öffnen des Beitrags diese Server an, obwohl die Datenschutzerklärung
 * zusagt, dass ohne Klick keine Verbindung zu Drittanbietern entsteht. Über den Proxy holt
 * der Server das Bild, der Browser spricht nur mit dieser Seite.
 * Hintergrund und Bestand: `docs/blog-einbettungen.md`.
 *
 * Bilder von Servern außerhalb von `IMAGE_PROXY_HOSTS` werden entfernt, nicht dem Proxy
 * übergeben: Für einen nicht freigegebenen Host gibt `useImage()` still die Original-URL
 * zurück, und der Browser lüde wieder direkt. Betroffen sind heute nur tote Server und
 * ein Partner-Zählpixel.
 *
 * Gezielte Ersetzung im Tag statt Neuaufbau: Attribute ohne Wert, Reihenfolge und
 * Schreibweise des Originals bleiben so erhalten.
 *
 * PRE:  html ist string, undefined oder null; `proxy` liefert für eine absolute URL eines
 *       Hosts aus `IMAGE_PROXY_HOSTS` die Proxy-URL
 * POST: kein <img> mit fremder http(s)-Quelle und kein fremdes `srcset` im Ergebnis;
 *       `proxy` wurde nur mit Hosts aus `IMAGE_PROXY_HOSTS` aufgerufen
 * INV:  Bilder der eigenen Domain, relative Pfade, `data:` und `file:` bleiben unverändert
 */
export function proxyForeignImages(
  html: string | undefined | null,
  proxy: (url: string) => string,
): string {
  if (!html) return ''

  return html.replace(IMG, (tag, rawAttributes: string) => {
    const src = parseAttributes(rawAttributes).src
    if (!src) return tag

    const url = parseUrl(decodeHtmlEntities(src))
    if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) return tag
    if (isOwnHost(normalizedHost(url))) return tag
    if (!IMAGE_PROXY_HOSTS.includes(url.hostname.toLowerCase())) return ''

    // Der Proxy holt serverseitig; https, damit kein Server unterwegs mitlesen kann.
    url.protocol = 'https:'
    url.port = ''

    return tag
      .replace(SRC_ATTRIBUTE, ` src="${escapeAttribute(proxy(url.toString()))}"`)
      .replace(SRCSET_ATTRIBUTES, '')
  })
}

const IMG = new RegExp(String.raw`<img\b${TAG_BODY}>`, 'gi')

/**
 * Das Leerzeichen davor ist Absicht: `data-src` oder `data-lazy-src` haben dort einen
 * Bindestrich und werden so nicht getroffen.
 */
const SRC_ATTRIBUTE = /\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+)/i
const SRCSET_ATTRIBUTES = /\s(?:srcset|sizes)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+)/gi
