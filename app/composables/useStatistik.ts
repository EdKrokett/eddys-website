import type { StatistikResponse } from '#shared/types/statistik'

/**
 * Lädt Eddys Läufe (server/api/statistik.get.ts) und leitet daraus alles ab, was die Seite
 * zeigt. Gerechnet wird in app/utils/statistik.ts; hier wird nur verdrahtet.
 *
 * Alles ist `computed` über `data`: Nichts verändert die Antwort, also gibt es auch keine
 * verlorene Tiefen-Mutation am `shallowRef`.
 */
export function useStatistik() {
  const { data, status, error, refresh } = useFetch<StatistikResponse>('/api/statistik', {
    key: 'statistik',
    default: () => ({ laeufe: [], verworfen: 0, stand: '' }),
  })

  const laeufe = computed(() => data.value.laeufe)

  /**
   * „Heute“ für die Zeitachse. Kommt aus dem Payload (`stand`), damit SSR und Hydration
   * dasselbe Jahr sehen; ein frisches `new Date()` im Client könnte zum Jahreswechsel kippen.
   */
  const bisJahr = computed(() => {
    const stand = data.value.stand ? new Date(data.value.stand).getUTCFullYear() : Number.NaN
    if (Number.isFinite(stand)) return stand
    return laeufe.value.length ? Math.max(...laeufe.value.map(lauf => lauf.jahr)) : 0
  })

  const kennzahlen = computed(() => berechneKennzahlen(laeufe.value))
  const zeitstrahl = computed(() => baueZeitstrahl(laeufe.value, bisJahr.value))
  const marathons = computed(() => marathonReihe(laeufe.value))
  const halbmarathons = computed(() => halbmarathonReihe(laeufe.value))

  return { laeufe, kennzahlen, zeitstrahl, marathons, halbmarathons, status, error, refresh }
}
