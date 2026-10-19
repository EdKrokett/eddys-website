# Reichweitenmessung: Vercel Web Analytics

Stand 19.10.2026. Aktiviert im Vercel-Dashboard (Projekt `eddys-website` → Analytics → Enable),
eingebunden in `nuxt.config.ts` (`$production.app.head.script`).

## Was eingebunden ist

Ein einziges Skript, ausgeliefert von der eigenen Domain:

- `/<VITE_VERCEL_OBSERVABILITY_BASEPATH>/insights/script.js`, wenn Vercel beim Build einen
  zufälligen Pfad vergibt ("Resilient Intake", Adblocker kennen ihn nicht),
- sonst `/_vercel/insights/script.js`.

Nur im Production-Build (`$production`), lokal im Dev-Server gibt es den Pfad nicht.
Preview-Deployments zählen mit, das Dashboard trennt sie über den Filter "Environment".

## Warum ohne das Paket `@vercel/analytics`

Vercels Anleitung für Nuxt sagt `npm i @vercel/analytics` plus `modules: ['@vercel/analytics']`.
Das scheiterte am 19.10.2026:

1. `@vercel/analytics@2.0.1` (latest) erklärt `vue-router@^4` als optionalen Peer. Nuxt 4.4
   bringt vue-router 5. Erst die Canary-Builds erlauben `^4 || ^5`.
2. npm 10.9 bricht beim Auflösen mit `Cannot read properties of null (reading 'edgesOut')` ab,
   auch mit einem gezielten `overrides`-Eintrag und auch mit dem Canary.
3. npm 11 installiert, schreibt aber eine Lockfile ohne mehrere verschachtelte Einträge
   (u.a. `@nuxt/cli/node_modules/cac`, die Linux-Bindings von `oxc-parser`). `npm ci` unter
   npm 10, also in CI mit Node 22, lehnt sie ab.

Das Nuxt-Modul des Pakets macht nichts weiter, als dieses Skript einzuhängen und die
Seitenaufrufe mit Routenmuster (`/blog/[slug]`) zu melden. Der erste Teil steht jetzt in
`nuxt.config.ts`. Der zweite fehlt: Seitenwechsel ohne Neuladen meldet das Skript selbst
(Auto-Track), nur eben mit der echten URL statt dem Muster. Für diese Seite ist das sogar die
nützlichere Ansicht, weil man sieht, welcher Beitrag gelesen wird.

**Wieder aufnehmen,** sobald eine stabile Paketversion `vue-router@^5` erlaubt und sich mit der
npm-Version aus CI installieren lässt: dann Paket + Modul, `$production`-Block entfernen.

## Datenschutz

Laut Vercel (docs/analytics/privacy-policy, geprüft 19.10.2026):

- keine Cookies, nichts wird auf dem Gerät gespeichert,
- Besucher werden über einen Hash aus der Anfrage unterschieden, der nach 24 Stunden verfällt,
- keine IP-Adresse gespeichert, keine seiten- oder tagesübergreifende Wiedererkennung,
- erfasst je Aufruf: Zeitpunkt, URL, Referrer, gefilterte Query-Parameter, Land/Region/Stadt,
  Betriebssystem, Browser, Gerätetyp, Skriptversion.

Rechtsgrundlage in der Datenschutzerklärung: Art. 6 Abs. 1 lit. f DSGVO, kein Consent-Banner.
**Entschieden von Eddy am 19.10.2026: ohne Banner.** Ob § 25 TDDDG trotz fehlender Cookies
eine Einwilligung verlangt, ist in der Literatur umstritten (das Skript läuft im Browser und
liest dort Gerätedaten aus). Die verbreitete Praxis bei cookielosen Diensten ist "ohne Banner".
Sollte sich das ändern, braucht es ein Consent-Banner, und das Skript dürfte erst nach
Zustimmung geladen werden (dann raus aus `app.head`, rein in ein Client-Plugin).

Bei jeder Änderung hier `app/pages/datenschutz.vue` mitziehen.
