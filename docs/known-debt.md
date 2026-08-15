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
