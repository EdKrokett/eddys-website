<script setup lang="ts">
import type { Lauf } from '#shared/types/statistik'
import type { Kennzahlen } from '~/utils/statistik'

/**
 * Die Kernwerte als Prüfschein: so, wie ein Chronometer nach der Gangprüfung seine Messwerte
 * auf einem Zertifikat bekommt. Zahlen in Mono und groß, darunter in kleiner Schrift, woher
 * sie stammen. Reine Darstellung; gerechnet wird in app/utils/statistik.ts.
 */
const props = defineProps<{ kennzahlen: Kennzahlen }>()

interface Wert {
  label: string
  wert: string
  einheit?: string
  herkunft?: string
  /** Bestzeiten bekommen die Messing-Marke. */
  bestzeit?: boolean
}

const herkunft = (lauf: Lauf | null) => lauf ? `${lauf.titel}, ${lauf.jahr}` : undefined

const werte = computed<Wert[]>(() => {
  const k = props.kennzahlen
  return [
    { label: 'Marathons', wert: String(k.marathons), herkunft: 'im Ziel, ohne Staffel' },
    {
      label: 'Bestzeit Marathon',
      wert: formatDauer(k.bestzeitMarathon?.sekunden ?? null),
      herkunft: herkunft(k.bestzeitMarathon),
      bestzeit: true,
    },
    {
      label: 'Bestzeit Halbmarathon',
      wert: formatDauer(k.bestzeitHalbmarathon?.sekunden ?? null),
      herkunft: herkunft(k.bestzeitHalbmarathon),
      bestzeit: true,
    },
    {
      label: 'Längster Lauf',
      wert: formatDistanz(k.laengsterLauf?.distanzKm ?? null),
      einheit: k.laengsterLauf ? 'km' : undefined,
      herkunft: herkunft(k.laengsterLauf),
    },
    { label: 'Wettkämpfe im Ziel', wert: String(k.wettkaempfe), herkunft: k.seitJahr ? `seit ${k.seitJahr}` : undefined },
    {
      label: 'Wettkampf-Kilometer',
      wert: formatGanzzahl(k.wettkampfKm),
      einheit: 'km',
      herkunft: 'Summe aller Wettkämpfe im Ziel',
    },
  ]
})
</script>

<template>
  <section class="schein" aria-label="Kernwerte">
    <!-- Ecken wie an einem gedruckten Zertifikat, rein dekorativ -->
    <span class="schein__ecke schein__ecke--lo" aria-hidden="true" />
    <span class="schein__ecke schein__ecke--ro" aria-hidden="true" />
    <span class="schein__ecke schein__ecke--lu" aria-hidden="true" />
    <span class="schein__ecke schein__ecke--ru" aria-hidden="true" />

    <header class="schein__kopf">
      <span>Gangprüfung</span>
      <span class="schein__linie" aria-hidden="true" />
      <span>Eduard Andrae · Läufer</span>
    </header>

    <dl class="schein__werte">
      <div v-for="eintrag in werte" :key="eintrag.label" class="wert">
        <dt class="wert__label">
          <span v-if="eintrag.bestzeit" class="wert__marke" aria-hidden="true" />
          {{ eintrag.label }}
        </dt>
        <dd class="wert__zahl">
          {{ eintrag.wert }}<span v-if="eintrag.einheit" class="wert__einheit">{{ eintrag.einheit }}</span>
        </dd>
        <dd v-if="eintrag.herkunft" class="wert__herkunft">
          {{ eintrag.herkunft }}
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.schein {
  position: relative;
  margin-top: clamp(2.5rem, 6vw, 4rem);
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid var(--color-graphite-700);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent 40%),
    var(--color-graphite-900);
}

.schein__ecke {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--color-brass-400);
  border-style: solid;
  border-width: 0;
}
.schein__ecke--lo { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
.schein__ecke--ro { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
.schein__ecke--lu { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
.schein__ecke--ru { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }

.schein__kopf {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-steel-500);
}

.schein__linie {
  flex: 1;
  height: 7px;
  background-image: repeating-linear-gradient(to right, var(--color-graphite-600) 0 1px, transparent 1px 8px);
}

.schein__werte {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: clamp(1.25rem, 3vw, 2rem);
}

.wert {
  padding: 1.25rem clamp(0.75rem, 2vw, 1.5rem) 1.25rem 0;
  border-top: 1px solid var(--color-graphite-700);
}

/* Spaltentrenner nur zwischen den Spalten, nicht am Rand */
.wert:not(:nth-child(3n + 1)) {
  padding-left: clamp(0.75rem, 2vw, 1.5rem);
  border-left: 1px solid var(--color-graphite-700);
}

.wert__label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-steel-400);
}

/* Inline statt Flex: Bricht das Label auf dem Handy um, bleibt die Raute am ersten Wort */
.wert__marke {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 0.55rem;
  vertical-align: 0.1em;
  background: var(--color-brass-mark);
  transform: rotate(45deg);
}

.wert__zahl {
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: clamp(1.9rem, 4.6vw, 3.1rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-100);
}

.wert__einheit {
  margin-left: 0.35em;
  font-size: 0.38em;
  letter-spacing: 0.06em;
  color: var(--color-steel-400);
}

.wert__herkunft {
  margin-top: 0.6rem;
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--color-steel-400);
}

@media (max-width: 767px) {
  .schein__werte {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wert:not(:nth-child(3n + 1)) {
    padding-left: 0;
    border-left: 0;
  }

  .wert:nth-child(2n) {
    padding-left: 0.85rem;
    border-left: 1px solid var(--color-graphite-700);
  }
}
</style>
