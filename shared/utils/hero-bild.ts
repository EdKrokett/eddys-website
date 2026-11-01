/**
 * Wie das Beitragsbild oben auf /blog/<slug> erscheint.
 *
 * Bis 01.11.2026 wurde jedes Bild auf 30rem Höhe in voller Breite mittig zugeschnitten
 * (`object-fit: cover`). Bei einem Hochformat blieb davon ein Streifen aus der Bildmitte:
 * Beim Halloween-Beitrag (1693 × 2000 px) war ein Drittel des Fotos zu sehen, die Köpfe
 * fehlten. Seitdem entscheidet das Seitenverhältnis:
 *
 * - `banner`: breit genug für den Zuschnitt, der Ausschnitt sitzt etwas über der Mitte.
 * - `ganz`: Hochformat und fast quadratische Bilder werden nicht beschnitten, sondern ganz
 *   gezeigt; eine unscharfe Kopie füllt die Breite dahinter.
 */
export type HeroBildFormat = 'banner' | 'ganz'

/**
 * Unterhalb dieses Seitenverhältnisses (Breite / Höhe) wird nicht mehr beschnitten. Das
 * Banner ist am Desktop rund 2,5 : 1; ein Querformat 3 : 2 (1,5) verliert dabei schon die
 * Hälfte der Höhe, ist aber meist so komponiert, dass das trägt. Bei 4 : 3 (1,33) und
 * darunter fallen Köpfe heraus.
 */
const MIN_BANNER_VERHAELTNIS = 1.4

/**
 * EXTERN: `media_details` aus der WordPress-Antwort. Fehlt bei Bildern ohne Metadaten und
 * bei eingebetteten Medien, die WordPress nicht herausgibt (dann steht dort ein Fehlerobjekt).
 *
 * @returns die Abmessungen, oder `undefined`, wenn sie nicht als positive Ganzzahlen vorliegen.
 */
export function parseImageSize(raw: unknown): { width: number, height: number } | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const { width, height } = raw as Record<string, unknown>

  const gueltig = (wert: unknown): wert is number =>
    typeof wert === 'number' && Number.isSafeInteger(wert) && wert > 0

  return gueltig(width) && gueltig(height) ? { width, height } : undefined
}

/** Ohne bekannte Abmessungen bleibt es beim Banner, wie bisher. */
export function heroBildFormat(size: { width: number, height: number } | undefined): HeroBildFormat {
  if (!size) return 'banner'
  return size.width / size.height < MIN_BANNER_VERHAELTNIS ? 'ganz' : 'banner'
}
