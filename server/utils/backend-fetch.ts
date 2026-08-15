import type { FetchOptions } from 'ofetch'

/**
 * Schlicht typisierter Fetch für externe Ziele (WordPress-REST-API, Webhooks).
 * Umgeht die InternalApi-Routentabellen-Typisierung von nitropacks $fetch: deren
 * Matching nicht-literaler URLs (z. B. `${wordpressUrl}/...`) kann ab einer
 * dreistelligen Routenzahl TypeScripts Instanziierungslimit sprengen (TS2589,
 * siehe tb26-code docs/known-debt.md KD-004 für die volle Herleitung).
 *
 * Bewusst eine Funktion statt einer Top-Level-const-Referenz: globalThis.$fetch
 * wird erst in createNitroApp() gesetzt, NACH der Auswertung dieses Moduls im
 * selben Bundle-Chunk — eine const fröre `undefined` ein. Der Zugriff auf das
 * Global muss deshalb zur Aufrufzeit erfolgen.
 *
 * Für interne /api/-Aufrufe mit literaler URL weiterhin $fetch verwenden.
 */
export function backendFetch<T = unknown>(url: string, opts?: FetchOptions): Promise<T> {
  return (globalThis.$fetch as unknown as (u: string, o?: FetchOptions) => Promise<T>)(url, opts)
}
