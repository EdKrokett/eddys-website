# WordPress-Gegenstücke

Code, der **nicht** in dieser Nuxt-Anwendung läuft, sondern in WordPress auf
`blog.eduard-andrae.de`. Er liegt hier im Repo, damit er versioniert ist und neben dem
Endpunkt steht, den er aufruft — deployt wird er aber von Hand.

## `eddy-comment-revalidate/` — Kommentar-Webhook

Meldet jede Änderung an der Kommentarlage eines Beitrags an
`server/api/revalidate-comments.post.ts`, damit die Beitragsseite sofort neu gebaut wird
statt auf den ISR-Ablauf zu warten. Warum das nötig ist: `docs/blog-kommentare.md`.

### Paket bauen

```bash
cd wordpress && zip -r ~/Downloads/eddy-comment-revalidate.zip eddy-comment-revalidate
```

### Installieren

1. WP-Admin → Plugins → Installieren → Plugin hochladen → das ZIP wählen → aktivieren.
2. Einstellungen → Kommentar-Webhook öffnen.
3. **Endpoint:** `https://eduard-andrae.de/api/revalidate-comments`
4. **Secret:** derselbe Wert wie `NUXT_REVALIDATE_SECRET` in Vercel.
5. Speichern, dann *Jetzt testen*. Erwartet wird `OK (200)`.

Bei einem Update dieselben Schritte — WordPress fragt beim erneuten Hochladen, ob die
vorhandene Version ersetzt werden soll. Endpoint und Secret bleiben dabei erhalten, sie
liegen in der Datenbank und nicht im Plugin.

### Fehlerbilder

| Antwort | Bedeutung |
|---|---|
| `OK (200)` | Seite wurde neu gebaut. |
| `Fehler (401)` | Secret stimmt nicht mit `NUXT_REVALIDATE_SECRET` überein. |
| `Fehler (503)` | `VERCEL_BYPASS_TOKEN` fehlt zur Laufzeit. |
| `Fehler (502)` mit „x-vercel-cache: HIT" | Der Token wurde ignoriert — im Build stand ein anderer oder gar keiner. |
| `Fehler (409)` | Beitrag ist nicht veröffentlicht — bei einem Testlauf auf einen Entwurf normal. |
| `Fehler` ohne Code | Die Seite war nicht erreichbar (Timeout, DNS, Firewall). |

Das Plugin sendet nie synchron: Es plant den Aufruf über `wp_schedule_single_event`, damit
niemand beim Absenden eines Kommentars auf einen fremden Server wartet. Ein Ergebnis
erscheint auf der Einstellungsseite deshalb erst, wenn WP-Cron gelaufen ist — bei einem
Klick auf *Jetzt testen* dagegen sofort, der sendet direkt.
