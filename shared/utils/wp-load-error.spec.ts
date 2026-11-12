import { describe, expect, it } from 'vitest'
import { hasFailedData, wpLoadErrorStatus } from './wp-load-error'

describe('wpLoadErrorStatus', () => {
  it('meldet 404 nur, wenn die API ausdrücklich 404 gesagt hat', () => {
    expect(wpLoadErrorStatus({ statusCode: 404, message: 'Blogbeitrag nicht gefunden' })).toBe(404)
  })

  it('macht aus einem Server- oder Upstream-Fehler eine 503, nie eine 404', () => {
    expect(wpLoadErrorStatus({ statusCode: 500 })).toBe(503)
    expect(wpLoadErrorStatus({ statusCode: 502 })).toBe(503)
    expect(wpLoadErrorStatus({ statusCode: 503 })).toBe(503)
  })

  it('behandelt Fehler ohne verwertbaren Status als vorübergehend', () => {
    expect(wpLoadErrorStatus(undefined)).toBe(503)
    expect(wpLoadErrorStatus(null)).toBe(503)
    expect(wpLoadErrorStatus(new TypeError('fetch failed'))).toBe(503)
    expect(wpLoadErrorStatus({ statusCode: '404' })).toBe(503)
  })
})

describe('hasFailedData', () => {
  it('erkennt einen gescheiterten Abruf neben erfolgreichen', () => {
    expect(hasFailedData({ 'blog-list': undefined, 'statistik': { statusCode: 500 } })).toBe(true)
  })

  it('meldet nichts, wenn alle Abrufe geklappt haben', () => {
    expect(hasFailedData({ 'blog-list': undefined, 'statistik': null })).toBe(false)
    expect(hasFailedData({})).toBe(false)
  })

  it('verträgt fehlende oder kaputte Payload-Daten', () => {
    expect(hasFailedData(undefined)).toBe(false)
    expect(hasFailedData(null)).toBe(false)
    expect(hasFailedData('kaputt')).toBe(false)
  })
})
