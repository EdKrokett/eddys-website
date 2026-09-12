<script setup lang="ts">
/**
 * Das Werkbank-Band der Startseite — liegt quer unter den beiden Türen (HomeDoors).
 *
 * ── Warum ein Band und keine dritte Tür ────────────────────────────────────────
 * „Über mich" und „Blog" sind zwei gleichwertige Eingänge nebeneinander (Eddys
 * Vorgabe). Die Werkbank ist etwas anderes: kein dritter Eingang, sondern der Beleg
 * unter beiden. Als dritte Rasterzelle müsste sie sich in die Zwei-Spalten-Logik
 * drängen und würde die Symmetrie der Türen zerlegen; quer darunter behält sie ihr
 * eigenes Gewicht, ohne mit ihnen zu konkurrieren.
 *
 * Vor dieser Sektion war die Werkbank im gesamten Startseiten-Body nicht verlinkt —
 * nur in Header, Footer und auf /ueber-mich. Wer den Header überlas, erfuhr beim
 * Scrollen nicht, dass es sie gibt.
 *
 * ── Design-Richtung ────────────────────────────────────────────────────────────
 * „Präzisionswerk", Modus offene Rückseite — dieselbe Sprache wie /werkbank:
 * - Zahlen statt Liste. Die Türen tragen Aufzählungen, das Band trägt Kennzahlen.
 * - Die `index-rail` (Zifferblatt-Indexe) läuft als Trenner durch, nicht eine volle
 *   Linie: Sie ist das Motiv, das Startseite und Werkbank-Seite verbindet.
 * - Teal führt. KEIN Messing — das ist auf /werkbank dem Buch-Faksimile vorbehalten
 *   und tritt dort genau einmal auf. Ein zweiter Auftritt hier nähme ihm die Wirkung.
 * - Der Teal-Schimmer liegt links unten, gegenläufig zum Kontaktband weiter oben,
 *   damit die beiden Flächen beim Scrollen nicht wie dieselbe Sektion wirken.
 */
</script>

<template>
  <section class="bench reveal">
    <UContainer>
      <div class="bench__inner">
        <div class="bench__body">
          <p class="kicker">
            <span class="bench__mark" aria-hidden="true" />Werkbank
          </p>

          <h2 class="bench__title">
            Eine Plattform, neu gebaut.<br>
            <span class="bench__title-quiet">Ohne eine Zeile Code selbst zu schreiben.</span>
          </h2>

          <p class="bench__text">
            Zwischen Februar und Mai 2026 habe ich trusted blogs von Grund auf neu
            gebaut, mit Claude Code als Werkzeug. Dazu neunzehn Make-Szenarien, die
            heute laufen, ohne dass jemand sie anstößt. Auf der Werkbank stehen die
            Zahlen dazu, und die Stellen, an denen es geklemmt hat.
          </p>

          <NuxtLink to="/werkbank" class="bench__cta">
            Werkbank ansehen
            <Icon name="lucide:arrow-right" class="bench__cta-icon size-4" />
          </NuxtLink>
        </div>

        <dl class="bench__metrics">
          <div
            v-for="metric in WERKBANK_STARTSEITE_METRIKEN"
            :key="metric.label"
            class="bench__metric"
          >
            <dt
              class="bench__metric-value"
              :class="{ 'bench__metric-value--accent': metric.accent }"
            >
              {{ metric.value }}
            </dt>
            <dd class="bench__metric-label">
              {{ metric.label }}
            </dd>
          </div>
        </dl>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.bench {
  border-bottom: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(68% 120% at 12% 88%, rgba(33, 164, 163, 0.09) 0%, transparent 60%),
    var(--color-graphite-900);
  padding: clamp(3.5rem, 8vw, 6rem) 0;
}

.bench__inner {
  display: grid;
  gap: clamp(2.5rem, 5vw, 4rem);
  align-items: start;
}
@media (min-width: 900px) {
  .bench__inner {
    /*
     * 0,44 statt 0,5 für die Zahlenspalte: Bei einer halb so breiten Zahlenspalte
     * blieben dem Titel 768px, und „Ohne eine Zeile Code selbst zu schreiben."
     * rutschte mit „schreiben." allein auf eine dritte Zeile. Die Zahlen brauchen
     * die Breite nicht — die längste Zeile dort ist „Make-Szenarien, alle aktiv".
     */
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.44fr);
  }
}

.bench__mark {
  width: 2rem;
  height: 2px;
  background: var(--color-accent-400);
}

.bench__title {
  margin-top: 1.25rem;
  /* Deckel bei 2,35rem statt 2,6rem — siehe Spaltenbreite oben: Der Titel ist
     hier ein Anreißer, auf /werkbank steht derselbe Satz groß als H1. */
  font-size: clamp(1.75rem, 3.4vw, 2.35rem);
  line-height: 1.14;
  color: var(--color-steel-100);
}

/* Zweite Zeile zurückgenommen: Sie ist die Pointe, nicht die Ansage — und sie
   steht auf /werkbank als H1 gleichwertig, hier soll sie nachklingen. */
.bench__title-quiet {
  color: var(--color-steel-400);
}

.bench__text {
  margin-top: 1.5rem;
  max-width: 34rem;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-steel-400);
}

.bench__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: clamp(1.75rem, 3.5vw, 2.5rem);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  border-bottom: 1px solid var(--color-accent-500);
  padding-bottom: 0.4rem;
  transition: color 250ms ease, border-color 250ms ease;
}
.bench__cta:hover {
  color: var(--color-accent-200);
  border-color: var(--color-accent-300);
}
.bench__cta-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bench__cta:hover .bench__cta-icon {
  translate: 0.35rem 0;
}

/* ── Kennzahlen ─────────────────────────────────────────────────────────── */
/*
 * Untereinander statt als Kachelraster wie auf /werkbank: Drei Werte in einer
 * schmalen Spalte lesen sich als Liste, und die Indexstriche zwischen ihnen
 * sind dasselbe Motiv wie die Zifferblatt-Rail dort.
 */
.bench__metrics {
  display: grid;
  gap: 1.5rem;
}
@media (min-width: 560px) and (max-width: 899px) {
  .bench__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }
}

.bench__metric {
  padding-top: 1.25rem;
  /*
   * Indexstrich-Reihe als Trenner — dasselbe Muster wie die `index-rail`-Utility
   * in main.css, hier aber ausgeschrieben: `@apply` mit einer eigenen `@utility`
   * bräuchte in Tailwind v4 ein `@reference` auf main.css in JEDEM SFC, das sie
   * benutzt. Für drei Zeilen Verlauf ist das die teurere Abhängigkeit.
   *
   * `background-size` begrenzt die Reihe auf die Oberkante; ohne sie füllte das
   * Muster die ganze Kachelfläche.
   */
  background-image: repeating-linear-gradient(
    to right,
    var(--color-graphite-600) 0 1px,
    transparent 1px 8px
  );
  background-repeat: no-repeat;
  background-size: 100% 1px;
}

.bench__metric-value {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-100);
}

.bench__metric-value--accent {
  color: var(--color-accent-400);
}

.bench__metric-label {
  margin-top: 0.55rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--color-steel-500);
}
</style>
