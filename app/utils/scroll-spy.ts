/**
 * Entscheidungslogik des Scrollspys — bewusst ohne DOM, damit sie ohne happy-dom
 * testbar bleibt (vitest.config.ts läuft im Node-Environment). Der
 * IntersectionObserver-Teil steckt in app/composables/useScrollSpy.ts.
 */

/**
 * Bestimmt das aktive Kapitel aus der Menge der gerade sichtbaren Sektionen.
 *
 * Zwei Regeln, beide aus beobachtetem Fehlverhalten:
 *
 * 1. Es gewinnt die erste sichtbare ID in DOKUMENTREIHENFOLGE, nicht die zuletzt
 *    gemeldete. Die Reihenfolge der IntersectionObserver-Callbacks ist keine
 *    Dokumentreihenfolge — beim schnellen Scrollen markiert "zuletzt gemeldet" sonst
 *    das falsche Kapitel.
 *
 * 2. Ist nichts sichtbar, bleibt `previous` stehen. Zwischen zwei Sektionen und im
 *    Outro ist keine Kapitel-Sektion im Aktivierungsband; ohne diese Regel flackert
 *    die Markierung an jeder Grenze und verschwindet am Seitenende ganz.
 *
 * IDs in `visibleIds`, die nicht in `orderedIds` stehen, werden ignoriert — der
 * Observer kann Elemente melden, die inzwischen aus der Kapitelliste geflogen sind.
 */
export function pickActiveChapter(
  orderedIds: readonly string[],
  visibleIds: ReadonlySet<string> | readonly string[],
  previous: string | null,
): string | null {
  const visible = visibleIds instanceof Set ? visibleIds : new Set(visibleIds)

  const active = orderedIds.find(id => visible.has(id))
  if (active !== undefined) return active

  // Nichts sichtbar: den letzten bekannten Stand halten — aber nur, wenn er noch zur
  // Kapitelliste gehört. Sonst zeigte die Leiste auf ein Kapitel, das es nicht mehr gibt.
  return previous !== null && orderedIds.includes(previous) ? previous : null
}
