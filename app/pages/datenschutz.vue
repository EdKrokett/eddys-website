<script setup lang="ts">
/**
 * Von Eddy freigegeben am 30.08.2026 — der frühere sichtbare Entwurfs-Hinweis ist
 * damit entfernt. Bei technischen Änderungen an der Seite (Tracking, eingebettete
 * Drittanbieter-Widgets, anderer Hoster) muss dieser Text mitgezogen werden.
 *
 * Die alte Erklärung (blog.eduard-andrae.de/disclaimer/) ist hier NICHT übernommen:
 * Sie nennt Google Analytics, Matomo, Facebook-, Instagram- und Twitter-Einbindungen,
 * die auf dieser Nuxt-Seite nachweislich nicht laufen — eine Datenschutzerklärung,
 * die nicht existierende Verarbeitungen beschreibt, ist schlechter als keine.
 *
 * Der Text unten beschreibt stattdessen, was diese Seite technisch tatsächlich tut
 * (Stand 26.08.2026, geprüft an nuxt.config.ts und den Server-Routen):
 * - kein Tracking, keine Analytics (Vercel Web Analytics ist im Projekt deaktiviert)
 * - keine Cookies, die Einwilligung bräuchten
 * - Schriften selbst gehostet über @nuxt/fonts (kein Google-Fonts-Request)
 * - Hosting bei Vercel, Serverless-Region iad1 (USA) — deshalb der Drittland-Absatz
 * - Bilder und Blogtexte werden von blog.eduard-andrae.de nachgeladen (IONOS)
 */
useSeoMeta({
  title: 'Datenschutz — Eduard Andrae',
  robots: 'noindex',
})
</script>

<template>
  <div class="legal">
    <UContainer>
      <p class="kicker">
        <span class="legal__mark" aria-hidden="true" />Datenschutz
      </p>

      <h1 class="legal__title">
        Datenschutz&shy;erklärung
      </h1>

      <div class="legal__body">
        <h2>Verantwortlicher</h2>
        <p>
          Eduard (Eddy) Andrae<br>
          Felix-von-Eckardt-Str. 22<br>
          D-28279 Bremen<br>
          E-Mail: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
        </p>

        <h2>Kein Tracking, keine Einwilligungs-Cookies</h2>
        <p>
          Diese Seite setzt keine Analyse- oder Marketing-Werkzeuge ein. Es gibt keine
          Reichweitenmessung, kein Profiling und keine Cookies, die eine Einwilligung
          erfordern würden. Deshalb finden Sie hier auch kein Cookie-Banner — es gäbe
          nichts, worin einzuwilligen wäre.
        </p>

        <h2>Schriftarten</h2>
        <p>
          Alle verwendeten Schriften werden von diesem Server ausgeliefert. Es findet
          keine Verbindung zu Google Fonts oder einem anderen externen Schrift-Dienst
          statt.
        </p>

        <h2>Hosting und Server-Logs</h2>
        <p>
          Die Seite wird bei der Vercel Inc. gehostet. Beim Abruf verarbeitet der
          Anbieter technisch notwendige Verbindungsdaten (unter anderem IP-Adresse,
          Zeitpunkt, aufgerufene Adresse, übermittelte Datenmenge, Browsertyp).
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO — das berechtigte Interesse
          am sicheren und störungsfreien Betrieb.
        </p>
        <p>
          Die Verarbeitung findet teilweise auf Servern in den USA statt. Grundlage
          der Übermittlung sind die Standardvertragsklauseln der EU-Kommission.
        </p>

        <h2>Blog-Inhalte</h2>
        <p>
          Die Beiträge und Bilder im Blog-Bereich werden von
          <a href="https://blog.eduard-andrae.de">blog.eduard-andrae.de</a> geladen.
          Diese Installation wird bei der IONOS SE in Deutschland betrieben. Beim
          Laden der Bilder wird Ihre IP-Adresse an diesen Server übermittelt, weil
          das technisch für jede Verbindung nötig ist.
        </p>

        <h2>Externe Links</h2>
        <p>
          Diese Seite verlinkt auf externe Angebote, etwa LinkedIn oder
          trusted-blogs.com. Für deren Datenverarbeitung ist der jeweilige Anbieter
          verantwortlich. Es werden keine Inhalte dieser Dienste automatisch
          eingebettet — eine Verbindung entsteht erst, wenn Sie einen Link anklicken.
        </p>

        <h2>Kontaktaufnahme</h2>
        <p>
          Wenn Sie mir schreiben, verarbeite ich Ihre Angaben zur Bearbeitung der
          Anfrage (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Ich gebe diese Daten nicht
          weiter und lösche sie, sobald sie nicht mehr benötigt werden. Ein
          Kontaktformular gibt es bewusst nicht — die Anfrage läuft direkt über
          Ihr E-Mail-Programm.
        </p>

        <h2>Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch. Wenden Sie sich dafür
          an die oben genannte Adresse. Außerdem können Sie sich bei einer
          Datenschutz-Aufsichtsbehörde beschweren, etwa der Landesbeauftragten für
          Datenschutz und Informationsfreiheit der Freien Hansestadt Bremen.
        </p>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.legal {
  padding: clamp(3.5rem, 8vw, 5.5rem) 0 clamp(4rem, 9vw, 7rem);
}

.legal__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

.legal__title {
  margin-top: 1.25rem;
  max-width: 20ch;
  font-size: clamp(2rem, 4.8vw, 2.85rem);
  line-height: 1.02;
  letter-spacing: -0.035em;
  color: var(--color-steel-100);
  hyphens: auto;
}

.legal__body {
  max-width: 42rem;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
}

.legal__body :deep(h2) {
  margin-top: 2.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-graphite-700);
  font-size: 1.15rem;
  color: var(--color-steel-100);
}
.legal__body :deep(h2:first-child) {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.legal__body :deep(p) {
  margin-top: 1rem;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-400);
}

.legal__body :deep(a) {
  color: var(--color-accent-300);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.legal__body :deep(a:hover) {
  color: var(--color-accent-200);
}
</style>
