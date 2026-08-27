# Known Debt — bewusst zurückgestellte technische Schuld

Dieses Dokument hält technische Schuld fest, die **bewusst und begründet** zurückgestellt
wurde — inklusive Auslöser, Abhängigkeiten und Ausstiegskriterium. Ziel: keine stillschweigend
mitgeschleppte Schuld. Jeder Eintrag muss beantworten: *Warum jetzt nicht? Was blockiert den Fix?
Wann/wodurch wird er fällig?*

---

## KD-001 — kein `nitro.hooks['types:extend']`-Workaround für die TS2589-Klippe

**Status:** offen, bewusst nicht präventiv umgesetzt · **Erfasst:** 2026-08-15 · **Schweregrad:** niedrig

In tb26-code führte Nitros typisiertes `$fetch` ab ~270 Server-Routen zu TypeScripts
Instanziierungslimit (TS2589), behoben durch `types.routes = {}` im `types:extend`-Hook
(siehe dortige `docs/known-debt.md` KD-004). Diese Seite startet mit einer Handvoll Routen —
das Problem tritt erwartbar nicht auf.

**Wann fällig:** Sobald `nuxt typecheck` mit TS2589 fehlschlägt. Fix: den Hook aus
`tb26-code/frontend/nuxt.config.ts` 1:1 übernehmen.

---

## KD-002 — `nuxt@4.3.0` bleibt trotz bekannter High-Severity-CVEs, weil der Fix eine Node-Version verlangt, die auf dieser Maschine nicht installiert ist

**Status:** offen · **Erfasst:** 2026-08-15 · **Schweregrad:** hoch (aber vor Deploy zu klären)

`npm audit` meldet für `nuxt@4.3.0` (Range 4.0.0–4.5.0 betroffen) mehrere High/Moderate-Findings,
u.a. Server-Side RCE über Runtime-Template-Injection in Server-Island-Props
(GHSA-9473-5f9j-94wq) und SSR-Payload-Leck zwischen Nutzern (GHSA-wm8w-6qjm-cv43). Der Fix
liegt in `nuxt@4.5.1+`, das aber `engines.node: ^22.19.0 || ^24.11.0 || >=26.0.0` verlangt —
diese Maschine hat `v22.17.0`. `npm audit fix` bricht deshalb mit `ERR_INVALID_ARG_TYPE` ab.

Bewusst NICHT über `--force`/`engine-strict=false` erzwungen: ungetesteter Node/Nuxt-Kombi auf
einem frischen Scaffold ohne Sicherheitsnetz ist das größere Risiko als die dokumentierte Lücke
vor dem ersten Deploy.

**Wann fällig:** Vor dem ersten Produktions-Deploy verbindlich klären — entweder lokales Node
auf ≥22.19 aktualisieren (`nvm install 22.19`, dann `npm install nuxt@latest`) oder prüfen, ob
Vercels Build-Environment (die tatsächliche Deploy-Umgebung) bereits eine passende Node-Version
mitbringt und der Fix dort unabhängig vom lokalen Node gezogen werden kann.

---

## KD-003 — Alt-Domain-URLs in der WordPress-Datenbank werden nur zur Laufzeit umgeschrieben

**Status:** offen, Symptom entschärft · **Erfasst:** 2026-08-26 · **Schweregrad:** mittel

Die Beitragsinhalte in der WordPress-Datenbank enthalten absolute URLs auf
`www.eduard-andrae.de` (Messung 26.08.2026: **41 von 50** zuletzt veröffentlichten Beiträgen).
Das Umstellen von `WP_HOME`/`WP_SITEURL`/`WP_CONTENT_URL` in Phase B wirkte nur auf neu
gerendertes Markup, nicht rückwirkend auf gespeicherte Block-Inhalte.

`shared/utils/rewrite-wp-urls.ts` schreibt diese URLs beim Ausliefern um, sodass die Seite
auch nach Phase C funktioniert. Das behebt aber nur das Symptom auf **dieser** Seite — im
WordPress-Backend, in RSS-Feeds, in der WP-eigenen Suche und für jeden anderen Konsumenten
der REST-API stehen die alten URLs weiterhin drin.

**Warum jetzt nicht gefixt:** Ein Search-Replace über die Produktivdatenbank ist ein Eingriff
mit Backup-Pflicht und gehört Eddy vorgelegt, nicht nebenbei erledigt. Serialisierte
PHP-Felder (Theme-Optionen, Custom Fields) dürfen dabei nicht per naivem SQL-`REPLACE`
angefasst werden — dafür braucht es `wp search-replace` (WP-CLI) oder das Better-Search-Replace-Plugin.

**Wann fällig:** Vor oder kurz nach Phase C. Danach kann der Laufzeit-Rewrite als
Sicherheitsnetz bestehen bleiben (er ist idempotent), oder mit einem Test auf 0 Vorkommen
entfernt werden.

---

## KD-004 — Blog-Suche und Kategoriefilter arbeiten nur auf den geladenen Beiträgen

**Status:** offen, bewusst akzeptiert · **Erfasst:** 2026-08-26 · **Schweregrad:** niedrig

`/blog` lädt 30 Beiträge pro Seite (von 242) und filtert clientseitig über
`app/utils/filter-posts.ts`. Wer nach einem Begriff sucht, der nur in einem alten Beitrag
vorkommt, findet ihn erst, nachdem er weit genug nachgeladen hat. Die Oberfläche macht das
transparent („3 Beiträge von 30 geladenen") und bietet im Leerzustand das Nachladen an.

**Warum jetzt nicht gefixt:** Serverseitige Suche über die WordPress-REST-API (`?search=`)
wäre korrekt, verlangt aber ein zweites Fetch-Regime mit eigenem Cache-Key, Debouncing und
Fehlerbehandlung — spürbar mehr Fläche als der aktuelle Nutzen rechtfertigt, solange
unklar ist, wie stark die Suche überhaupt genutzt wird.

**Wann fällig:** Sobald Suche/Filter tatsächlich genutzt werden (Rückmeldung von Eddy oder
Nutzern) oder die Beitragszahl deutlich über 242 wächst. Fix: `search`- und
`categories`-Parameter an `server/api/blog.get.ts` durchreichen und die clientseitige
Filterung auf reine Anzeige reduzieren.

## OG-Bild der Startseite wird lokal gebaut, nicht im Build

`public/images/og-startseite.jpg` entsteht über `npm run og:build`
(`scripts/build-og-image.mjs`) und liegt als fertige Datei im Repo. Es hängt
NICHT am Nuxt-Build — wer den Hero-Text in `HomeHero.vue` ändert, muss das Skript
von Hand nachziehen, sonst zeigt die Link-Vorschau den alten Satz.

Bewusst so: Der Build läuft auf Vercel ohne Netzzugang zu Google Fonts und ohne
Schreibrecht im Dateisystem — beides braucht das Skript. Ein CI-Check, der Bild
und Hero-Text vergleicht, wäre die saubere Lösung, wenn sich der Text öfter
ändert als bisher.
