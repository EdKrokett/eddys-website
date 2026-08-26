<script setup lang="ts">
/**
 * Angaben 1:1 von der bisherigen Seite übernommen (www.eduard-andrae.de/impressum/).
 * Dort war weder eine USt-ID noch ein gesonderter "Verantwortlich für den Inhalt"-
 * Absatz jenseits des Namens zu finden — vor Live-Schaltung von Eddy prüfen lassen,
 * nicht stillschweigend ergänzt.
 */
useSeoMeta({
  title: 'Impressum — Eduard Andrae',
  robots: 'noindex',
})
</script>

<template>
  <div class="legal">
    <UContainer>
      <p class="kicker">
        <span class="legal__mark" aria-hidden="true" />Impressum
      </p>

      <h1 class="legal__title">
        Angaben gemäß § 5 TMG
      </h1>

      <div class="legal__grid">
        <section class="block">
          <h2 class="block__title">
            Anschrift
          </h2>
          <p class="block__text">
            Eduard (Eddy) Andrae<br>
            Felix-von-Eckardt-Str. 22<br>
            D-28279 Bremen
          </p>
        </section>

        <section class="block">
          <h2 class="block__title">
            Kontakt
          </h2>
          <p class="block__text">
            Telefon: <a href="tel:+491712632015">+49 171 263 20 15</a><br>
            E-Mail: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
          </p>
        </section>

        <section class="block">
          <h2 class="block__title">
            Verantwortlich für den Inhalt
          </h2>
          <p class="block__text">
            Eduard Andrae<br>
            Anschrift wie oben
          </p>
        </section>

        <section class="block">
          <h2 class="block__title">
            Weiteres
          </h2>
          <p class="block__text">
            <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink><br>
            <a href="https://blog.eduard-andrae.de/disclaimer/">Haftung & Disclaimer (Blog)</a>
          </p>
        </section>
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
  font-size: clamp(2.25rem, 6vw, 3.5rem);
  line-height: 1.02;
  letter-spacing: -0.035em;
  color: var(--color-steel-100);
}

.legal__grid {
  display: grid;
  gap: 1px;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  max-width: 46rem;
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}
@media (min-width: 640px) {
  .legal__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.block {
  padding: 1.5rem 1.625rem 1.75rem;
  background: var(--color-graphite-950);
}

.block__title {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-600);
}

.block__text {
  margin-top: 0.875rem;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-steel-300);
}

.block__text :deep(a) {
  color: var(--color-accent-300);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.block__text :deep(a:hover) {
  color: var(--color-accent-200);
}
</style>
