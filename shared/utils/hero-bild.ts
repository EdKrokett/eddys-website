/**
 * Wie das Beitragsbild oben auf /blog/<slug> erscheint.
 *
 * Bis 01.11.2026 wurde jedes Bild auf 30rem Höhe in voller Breite mittig zugeschnitten
 * (`object-fit: cover`). Bei einem Hochformat blieb davon ein Streifen aus der Bildmitte:
 * Beim Halloween-Beitrag (1693 × 2000 px) war ein Drittel des Fotos zu sehen, die Köpfe
 * fehlten. Seitdem wird gar nicht mehr beschnitten, das Seitenverhältnis entscheidet nur
 * noch über die Darstellung:
 *
 * - `banner`: breite Bilder ab etwa 16 : 9 in voller Breite und ganzer Höhe.
 * - `ganz`: alles Schmalere wird mittig gezeigt, begrenzt auf 34rem Höhe; eine unscharfe
 *   Kopie füllt die Breite dahinter.
 *
 * Die erste Fassung (Schwelle 1,4) schnitt Querformate noch auf 30rem zu. Das traf am selben
 * Tag ein gestaltetes 16 : 9-Titelbild mit Schrift am oberen und unteren Rand.
 */
export type HeroBildFormat = 'banner' | 'ganz'

/**
 * Ab diesem Seitenverhältnis (Breite / Höhe) volle Breite. Ein 16 : 9-Bild (1,78) ist bei
 * 1200px Textbreite knapp 680px hoch, das trägt als Aufmacher. Ein 3 : 2-Bild (1,5) wäre
 * schon 800px hoch und schöbe den Text aus dem ersten Bildschirm, deshalb `ganz`.
 */
const MIN_BANNER_VERHAELTNIS = 1.7

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
