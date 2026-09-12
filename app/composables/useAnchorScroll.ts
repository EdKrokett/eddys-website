/**
 * Hält einen Ankersprung auf seinem Ziel, während die Seite fertig lädt.
 *
 * ── Das Problem ────────────────────────────────────────────────────────────────
 * Wird eine Seite direkt mit `#anker` geöffnet, springt der Browser sofort. Zu dem
 * Zeitpunkt sind die selbst gehosteten Schriften noch nicht da, der Text läuft in der
 * Ersatzschrift. Sobald Fraunces und Manrope übernehmen, ändern alle Textblöcke ihre
 * Höhe — auch die oberhalb des Ziels. Das Ziel wandert dadurch weg, und zwar in beide
 * Richtungen, je nachdem welche Blöcke wachsen und welche schrumpfen.
 *
 * Gemessen auf /werkbank#handwerk (12.09.2026, je vier Aufrufe): ohne Korrektur lag das
 * Ziel zwischen 54 und 140px unter dem Seitenrand, mit einmaliger Korrektur nach
 * `document.fonts.ready` zwischen 58 und 250px. Der Header ist 64px hoch, alles darunter
 * verschwindet also hinter ihm.
 *
 * Über einen normalen Klick innerhalb der Seite tritt das nie auf: Dort sind die
 * Schriften längst geladen. Nur der Direktaufruf ist betroffen, und genau der ist bei
 * einem extern geteilten Link der Normalfall.
 *
 * ── Die Lösung ─────────────────────────────────────────────────────────────────
 * Mehrfach nachscrollen statt einmal. `document.fonts.ready` allein reicht nicht, weil
 * es aufgelöst wird, bevor der Browser das Layout damit neu gerechnet hat, und weil
 * einzelne Blöcke erst danach ihre endgültige Höhe bekommen.
 *
 * Die Korrektur bricht ab, sobald die Person selbst scrollt. Ein Sprung unter den
 * Fingern wäre schlimmer als ein ungenauer Anker.
 */
export function useAnchorScroll() {
  const route = useRoute()

  onMounted(() => {
    const id = route.hash.slice(1)
    if (!id) return

    const ziel = document.getElementById(id)
    if (!ziel) return

    let abgebrochen = false

    function abbrechen() {
      abgebrochen = true
    }

    /**
     * Eigene Scroll-Eingaben beenden die Korrektur. `scroll` taugt dafür NICHT: Das
     * Ereignis feuert auch bei jedem eigenen `scrollIntoView` und würde die Korrektur
     * sofort selbst abschalten.
     */
    const events = ['wheel', 'touchstart', 'keydown'] as const
    events.forEach(name =>
      window.addEventListener(name, abbrechen, { once: true, passive: true }),
    )

    /**
     * Drei Anläufe: direkt nach dem Font-Wechsel, nach einem Frame (dann steht das neu
     * gerechnete Layout) und noch einmal kurz darauf für Blöcke, die später fertig
     * werden. Danach ist die Seite stabil; weitere Versuche würden nur noch Sprünge
     * erzeugen, wenn jemand schon liest.
     *
     * Das Element kommt als Parameter herein, nicht aus der Closure: Über die Grenze
     * einer hochgezogenen Funktionsdeklaration hinweg hält TypeScript die
     * Null-Prüfung von oben nicht.
     */
    async function nachfuehren(element: HTMLElement) {
      await document.fonts?.ready

      for (const verzoegerung of [0, 16, 350]) {
        await new Promise(aufloesen => setTimeout(aufloesen, verzoegerung))
        if (abgebrochen) return

        // Ohne `behavior` gilt `scroll-behavior` aus main.css, und der dortige Block für
        // `prefers-reduced-motion` schaltet den weichen Sprung zentral ab.
        element.scrollIntoView()
      }
    }

    void nachfuehren(ziel)

    onUnmounted(() => {
      abgebrochen = true
      events.forEach(name => window.removeEventListener(name, abbrechen))
    })
  })
}
