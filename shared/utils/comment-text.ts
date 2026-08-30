import { decodeHtmlEntities } from './html-entities'

/**
 * Wandelt WordPress' `comment.content.rendered` in reine Text-Absätze um.
 *
 * Warum kein `v-html` wie beim Beitragsinhalt: Beiträge stammen aus Eddys eigener,
 * vertrauter WP-Instanz — Kommentare von beliebigen Besuchern. WordPress filtert beim
 * Speichern zwar per `wp_filter_kses`, aber darauf baut diese Seite keine
 * XSS-Sicherheit auf (fremde Plugins, ältere WP-Versionen, geänderte Filter).
 *
 * Messung 30.08.2026 über 100 Kommentare: nur <p> (216x), <br> (51x), <a> (4x),
 * <strong> (1x). Der Verzicht auf Markup kostet also fast nichts — Details in
 * docs/blog-kommentare.md.
 *
 * PRE:  input ist string, undefined oder null (WP-`content.rendered`)
 * POST: Array reiner Text-Absätze, jeder nicht leer und getrimmt; kein `<` aus der
 *       Eingabe überlebt als Markup; Entities sind aufgelöst
 * INV:  Tags werden VOR dem Dekodieren entfernt — sonst würde ein dekodiertes
 *       "&lt;b&gt;" nachträglich wieder als Tag gelesen
 */

/** Ganze Blöcke inkl. Inhalt entfernen — bei <script> reicht das Strippen des Tags nicht. */
const VOID_BLOCKS = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi
/** Nachfolgender Whitespace wird mitgenommen: WordPress schreibt "<br />\n", und der
 *  echte Newline dahinter hätte sonst zusammen mit dem eingefügten eine Absatzgrenze ergeben. */
const BREAK_TAGS = /<br\s*\/?>\s*/gi
const PARAGRAPH_ENDS = /<\/(p|div|blockquote|li|h[1-6])\s*>\s*/gi
const ANY_TAG = /<[^>]*>/g

export function commentHtmlToParagraphs(input: string | undefined | null): string[] {
  if (!input) return []

  const withBreaks = input
    .replace(VOID_BLOCKS, '')
    .replace(BREAK_TAGS, '\n')
    .replace(PARAGRAPH_ENDS, '\n\n')
    .replace(ANY_TAG, '')

  // Erst jetzt dekodieren (siehe INV). Das Ergebnis wird ausschliesslich per
  // `v-text` gerendert, ein wörtliches "<script>" ist damit harmloser Text.
  return decodeHtmlEntities(withBreaks)
    .split(/\n{2,}/)
    .map(block => block.replace(/[ \t]+/g, ' ').split('\n').map(line => line.trim()).join('\n').trim())
    .filter(block => block.length > 0)
}
