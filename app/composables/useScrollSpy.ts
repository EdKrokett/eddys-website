/**
 * Verfolgt, welche der übergebenen Sektionen gerade oben im Sichtfenster steht.
 *
 * Dünner Wrapper um IntersectionObserver — die Entscheidung, WELCHE der sichtbaren
 * Sektionen die aktive ist, liegt bewusst daneben als pure Funktion in
 * `app/utils/scroll-spy.ts` und ist dort getestet.
 *
 * SSR-fest: Der Observer entsteht erst in `onMounted`, `activeId` ist bis dahin `null`.
 * Die Sticky-Leiste hängt genau daran und erscheint deshalb von selbst erst, wenn die
 * erste Sektion den oberen Rand erreicht — ein zusätzliches Beobachtungselement für
 * "Intro vorbei" wäre eine zweite Wahrheit über denselben Zustand.
 */
export function useScrollSpy(ids: MaybeRefOrGetter<readonly string[]>) {
  const activeId = ref<string | null>(null)

  onMounted(() => {
    // Ohne IntersectionObserver bleibt activeId null: die Leiste erscheint dann nicht,
    // die Seite funktioniert ansonsten unverändert (Anker-Links sind reines HTML).
    if (typeof IntersectionObserver === 'undefined') return

    let observer: IntersectionObserver | null = null
    const visible = new Set<string>()

    /**
     * Aktivierungsband: ein schmaler Streifen unter Header (4rem = 64px) und
     * Sticky-Leiste (3rem = 48px). Der untere Rand wird fast vollständig
     * weggeschnitten, damit nicht jede eben angeschnittene Sektion weiter unten schon
     * als "aktiv" zählt.
     *
     * ACHTUNG: `rootMargin` versteht NUR px und % — `rem` wird still als ungültig
     * verworfen und der Observer fällt auf 0 zurück. Deshalb hier ausgerechnete
     * Pixelwerte statt der CSS-Einheiten, die daneben in den Komponenten stehen.
     *
     * Die 112px spiegeln `Header.vue` (h-16) und `CvChapterBar.vue` (--bar-height);
     * ändert sich dort eine Höhe, gehört dieser Wert mit nachgezogen.
     */
    const HEADER_PX = 64
    const BAR_PX = 48
    const ROOT_MARGIN = `-${HEADER_PX + BAR_PX}px 0px -70% 0px`

    function connect() {
      observer?.disconnect()
      visible.clear()

      const elements = toValue(ids)
        .map(id => document.getElementById(id))
        // EXTERN-Check: getElementById liefert null, wenn eine Sektion (noch) fehlt.
        .filter((el): el is HTMLElement => el !== null)

      if (elements.length === 0) return

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id)
            else visible.delete(entry.target.id)
          }
          activeId.value = pickActiveChapter(toValue(ids), visible, activeId.value)
        },
        { rootMargin: ROOT_MARGIN, threshold: 0 },
      )

      for (const el of elements) observer.observe(el)
    }

    // Nach dem Rendern verbinden und bei geänderter ID-Liste neu aufsetzen.
    watch(() => [...toValue(ids)], connect, { immediate: true, flush: 'post' })

    onScopeDispose(() => {
      observer?.disconnect()
      observer = null
    })
  })

  return { activeId: readonly(activeId) }
}
