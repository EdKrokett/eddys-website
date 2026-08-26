<script setup lang="ts">
/**
 * Angaben 1:1 von der bisherigen Seite übernommen (www.eduard-andrae.de/impressum/).
 * Dort war weder eine USt-ID noch ein gesonderter "Verantwortlich für den Inhalt"-
 * Absatz jenseits des Namens zu finden — vor Live-Schaltung von Eddy prüfen lassen,
 * nicht stillschweigend ergänzt.
 */
useSeoMeta({
  title: 'Impressum – Eduard Andrae',
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-6 py-24">
    <p class="font-mono text-xs tracking-[0.3em] text-steel-400 uppercase">
      Impressum
    </p>
    <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">
      Angaben gemäß § 5 TMG
    </h1>

    <div class="mt-8 space-y-1 text-steel-300">
      <p>Eduard (Eddy) Andrae</p>
      <p>Felix-von-Eckardt-Str. 22</p>
      <p>D-28279 Bremen</p>
    </div>

    <div class="mt-8 space-y-1 text-steel-300">
      <p>Telefon: +49 171 263 20 15</p>
      <p>
        E-Mail:
        <a href="mailto:info@eduard-andrae.de" class="text-swiss-400 hover:text-swiss-300">
          info@eduard-andrae.de
        </a>
      </p>
    </div>
  </section>
</template>
