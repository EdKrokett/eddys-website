/**
 * Eine Seite, deren Daten beim Server-Rendering nicht geladen werden konnten, antwortet mit
 * 503 statt 200. Sie zeigt weiter ihren eigenen Fehlerhinweis, wird aber nicht gecacht.
 *
 * Warum zentral und nicht in jeder Seite: `useBlog()` und `useStatistik()` werden nicht
 * abgewartet, und Watcher laufen beim Server-Rendering nicht. Erst nach dem Rendern steht
 * fest, ob ein Abruf gescheitert ist. `app:rendered` kommt genau dann, bevor die Antwort
 * gebaut wird. Neue Seiten sind damit automatisch abgedeckt.
 *
 * Ohne diesen Schutz hielt Vercel die Fehlerfassung per ISR bis zum Ablauf fest, bei
 * `/statistik` einen ganzen Tag. Herleitung: shared/utils/wp-load-error.ts und
 * docs/error-catalog.md („Kurzer WordPress-Ausfall wird als 404 gecacht“).
 */
export default defineNuxtPlugin({
  name: 'data-error-status',
  setup(nuxtApp) {
    nuxtApp.hook('app:rendered', ({ ssrContext }) => {
      const event = ssrContext?.event
      if (!event) return

      // Eine Seite, die schon bewusst einen Fehlerstatus gesetzt hat (404 für einen
      // unbekannten Beitrag), behält ihn. Direkt am Event gelesen: h3s getResponseStatus
      // ist im App-Teil nicht automatisch importiert (die Typprüfung merkt das nicht).
      if (event.node.res.statusCode !== 200) return

      if (hasFailedData(nuxtApp.payload._errors)) {
        setResponseStatus(event, 503, 'Daten vorübergehend nicht verfügbar')
      }
    })
  },
})
