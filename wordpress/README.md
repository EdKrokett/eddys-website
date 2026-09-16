# WordPress-Gegenstücke

Code, der **nicht** in dieser Nuxt-Anwendung läuft, sondern in WordPress auf
`blog.eduard-andrae.de`. Er liegt hier im Repo, damit er versioniert ist und neben dem
Endpunkt steht, den er aufruft — deployt wird er aber von Hand.

## `eddy-comment-revalidate/` — Inhalts-Webhook

Meldet Änderungen an Kommentaren und Beiträgen an `server/api/revalidate.post.ts`, damit
die betroffenen Seiten sofort neu gebaut werden statt auf den ISR-Ablauf zu warten. Warum
das nötig ist und was genau neu gebaut wird: `docs/revalidierung.md`.

Der Ordnername stammt noch aus Version 1.0, als das Plugin nur Kommentare kannte. Er
bleibt, weil er in WordPress den Installationspfad bestimmt — ein neuer Name legte beim
Hochladen ein zweites Plugin an, statt das vorhandene zu ersetzen.

### Paket bauen

```bash
cd wordpress && zip -r ~/Downloads/eddy-comment-revalidate.zip eddy-comment-revalidate
```

### Installieren

1. WP-Admin → Plugins → Installieren → Plugin hochladen → das ZIP wählen → aktivieren.
2. Einstellungen → Inhalts-Webhook öffnen.
3. **Endpoint:** `https://eduard-andrae.de/api/revalidate`
4. **Secret:** derselbe Wert wie `NUXT_REVALIDATE_SECRET` in Vercel.
5. Speichern, dann *Jetzt testen*. Erwartet wird `OK (200)`.

Bei einem Update dasselbe ZIP neu hochladen — WordPress fragt, ob die vorhandene Version
ersetzt werden soll. Endpoint und Secret bleiben dabei erhalten, sie liegen in der
Datenbank und nicht im Plugin.

### Update von Version 1.0 auf 1.1

Version 1.0 sprach noch `/api/revalidate-comments` an. Das Plugin stellt die gespeicherte
Adresse beim ersten Aufruf des WP-Backends selbst um, es ist also nichts einzutragen.
Prüfen lässt es sich im Endpoint-Feld: Dort muss `/api/revalidate` stehen.

### Fehlerbilder

| Antwort | Bedeutung |
|---|---|
| `OK (200)` | Alle betroffenen Pfade wurden neu gebaut. |
| `Fehler (401)` | Secret stimmt nicht mit `NUXT_REVALIDATE_SECRET` überein. |
| `Fehler (503)` | `VERCEL_BYPASS_TOKEN` fehlt zur Laufzeit. |
| `Fehler (502)` mit „x-vercel-cache: HIT" | Der Token wurde ignoriert — im Build stand ein anderer oder gar keiner. |
| `Fehler (502)` mit Pfadliste | Einzelne Pfade schlugen fehl; die Antwort nennt jeden mit Grund. |
| `Fehler (409)` | Kommentar an einem unveröffentlichten Beitrag — nichts zu tun, kein echter Fehler. |
| `Fehler (404)` | Kommentar zu einem Beitrag, den WordPress nicht mehr kennt. |
| `Fehler` ohne Code | Die Seite war nicht erreichbar (Timeout, DNS, Firewall). |

Das Plugin sendet nie synchron: Es plant den Aufruf über `wp_schedule_single_event`, damit
niemand beim Kommentieren oder Speichern auf einen fremden Server wartet. Ein Ergebnis
erscheint auf der Einstellungsseite deshalb erst, wenn WP-Cron gelaufen ist — bei einem
Klick auf *Jetzt testen* dagegen sofort, der sendet direkt und prüft dabei alle vier Pfade.
