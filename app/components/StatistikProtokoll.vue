<script setup lang="ts">
import type { Lauf } from '#shared/types/statistik'
import type { ProtokollFilter } from '~/utils/statistik'

/**
 * Die vollständige Liste, nach Jahr gruppiert, mit Filter und Freitextsuche. Das ist auch die
 * zugängliche Fassung der Diagramme darüber: Hier steht jeder Wert als Text.
 *
 * Filter und Suche liegen als v-model bei der Seite, weil ein Klick im Zeitstrahl beides
 * zurücksetzen muss, bevor er zu einem Eintrag springt.
 */
const props = defineProps<{
  laeufe: Lauf[]
  /** ID des Eintrags, zu dem zuletzt gesprungen wurde; wird hervorgehoben. */
  markiert?: number | null
}>()

const filter = defineModel<ProtokollFilter>('filter', { required: true })
const suche = defineModel<string>('suche', { required: true })

const treffer = computed(() => filterLaeufe(props.laeufe, filter.value, suche.value))
const gruppen = computed(() => gruppiereNachJahr(treffer.value))

function kennzeichen(lauf: Lauf): string[] {
  const liste: string[] = []
  if (lauf.art === 'meilenstein') liste.push('Meilenstein')
  if (lauf.art === 'training') liste.push('Training')
  if (lauf.ergebnis === 'dns') liste.push('DNS')
  if (lauf.ergebnis === 'dnf') liste.push('DNF')
  if (lauf.wertung === 'staffel') liste.push('Staffel')
  if (lauf.wertung === 'triathlon') liste.push('Triathlon')
  return liste
}

function zuruecksetzen() {
  filter.value = 'alle'
  suche.value = ''
}
</script>

<template>
  <div class="protokoll">
    <div class="werkzeug">
      <div class="werkzeug__filter" role="group" aria-label="Einträge filtern">
        <button
          v-for="option in PROTOKOLL_FILTER"
          :key="option.wert"
          type="button"
          class="chip"
          :aria-pressed="filter === option.wert"
          @click="filter = option.wert"
        >
          {{ option.label }}
        </button>
      </div>

      <label class="suche">
        <span class="sr-only">Einträge durchsuchen</span>
        <Icon name="lucide:search" class="suche__icon" aria-hidden="true" />
        <input
          v-model="suche"
          type="search"
          class="suche__feld"
          placeholder="Ort, Lauf oder Jahr"
          maxlength="60"
          autocomplete="off"
        >
      </label>
    </div>

    <p class="anzahl" aria-live="polite">
      {{ treffer.length }} {{ treffer.length === 1 ? 'Eintrag' : 'Einträge' }}
    </p>

    <div v-if="!treffer.length" class="leer">
      <p>Kein Eintrag passt{{ suche.trim() ? ` zu „${suche.trim()}“` : '' }}.</p>
      <button type="button" class="leer__knopf" @click="zuruecksetzen">
        Alle Einträge zeigen
      </button>
    </div>

    <section
      v-for="gruppe in gruppen"
      :key="gruppe.jahr"
      class="jahrgang"
      :aria-labelledby="`jahrgang-${gruppe.jahr}`"
    >
      <h3 :id="`jahrgang-${gruppe.jahr}`" class="jahrgang__jahr">
        {{ gruppe.jahr }}
      </h3>

      <ol class="jahrgang__liste">
        <li
          v-for="lauf in gruppe.laeufe"
          :id="`lauf-${lauf.id}`"
          :key="lauf.id"
          class="eintrag"
          :class="{
            'eintrag--markiert': markiert === lauf.id,
            'eintrag--ausfall': lauf.ergebnis !== 'finish' && lauf.art !== 'meilenstein',
            'eintrag--meilenstein': lauf.art === 'meilenstein',
          }"
        >
          <span class="eintrag__datum">{{ formatTagMonat(lauf.datum) }}</span>

          <div class="eintrag__text">
            <p class="eintrag__titel">
              {{ lauf.titel }}
              <span
                v-for="zeichen in kennzeichen(lauf)"
                :key="zeichen"
                class="kennzeichen"
              >{{ zeichen }}</span>
            </p>
            <p v-if="lauf.notiz" class="eintrag__notiz">
              {{ lauf.notiz }}
            </p>
            <p v-if="lauf.links.length" class="eintrag__links">
              <template v-for="link in lauf.links" :key="`${link.label}-${link.url}`">
                <NuxtLink
                  v-if="internerBlogPfad(link.url)"
                  :to="internerBlogPfad(link.url)!"
                  class="verweis"
                >{{ link.label }}</NuxtLink>
                <a
                  v-else-if="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="verweis"
                >{{ link.label }}<Icon name="lucide:arrow-up-right" class="verweis__pfeil" aria-hidden="true" /></a>
                <span v-else class="verweis verweis--ohne">{{ link.label }}</span>
              </template>
            </p>
          </div>

          <span class="eintrag__distanz">
            <template v-if="lauf.distanzKm !== null">{{ formatDistanz(lauf.distanzKm) }}<span class="einheit"> km</span></template>
          </span>

          <span class="eintrag__zeit">
            <template v-if="lauf.sekunden">
              {{ formatDauer(lauf.sekunden) }}
              <span v-if="formatPace(lauf.sekunden, lauf.distanzKm)" class="eintrag__pace">
                {{ formatPace(lauf.sekunden, lauf.distanzKm) }} /km
              </span>
            </template>
          </span>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.protokoll {
  margin-top: clamp(2rem, 5vw, 3rem);
}

.werkzeug {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.werkzeug__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-graphite-600);
  background: transparent;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
  color: var(--color-steel-300);
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
}

.chip:hover {
  border-color: var(--color-steel-500);
  color: var(--color-steel-100);
}

.chip[aria-pressed='true'] {
  border-color: var(--color-accent-500);
  background: var(--color-accent-500);
  /* Auf Teal dunkle Schrift (6,30:1), nie weiße (main.css) */
  color: var(--color-graphite-950);
}

.suche {
  position: relative;
  flex: 0 1 18rem;
}

.suche__icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--color-steel-500);
}

.suche__feld {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
  border: 1px solid var(--color-graphite-600);
  background: var(--color-graphite-950);
  font-size: var(--text-sm);
  color: var(--color-steel-100);
}

.suche__feld::placeholder {
  color: var(--color-steel-500);
}

.suche__feld:focus-visible {
  outline-offset: 0;
  border-color: var(--color-accent-500);
}

.anzahl {
  margin-top: 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-steel-500);
}

.leer {
  margin-top: 2rem;
  padding: 2rem;
  border: 1px dashed var(--color-graphite-600);
  color: var(--color-steel-300);
}

.leer__knopf {
  margin-top: 0.75rem;
  background: none;
  border: 0;
  padding: 0;
  font-size: var(--text-sm);
  color: var(--color-accent-300);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.jahrgang {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 0 clamp(1rem, 3vw, 2rem);
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-graphite-700);
}

.jahrgang__jahr {
  position: sticky;
  top: 5rem;
  align-self: start;
  font-family: var(--font-mono);
  font-size: clamp(1.6rem, 3.5vw, 2.25rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-200);
}

.eintrag {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr) 5.5rem 6.5rem;
  gap: 0 1rem;
  padding: 0.85rem 0.5rem;
  margin: 0 -0.5rem;
  border-bottom: 1px solid rgba(41, 43, 49, 0.6);
  /* Platz unter dem fixierten Kopf beim Sprung aus dem Zeitstrahl */
  scroll-margin-top: 7rem;
  transition: background-color 0.6s;
}

.eintrag:last-child {
  border-bottom: 0;
}

.eintrag--markiert {
  background: rgba(33, 164, 163, 0.1);
  box-shadow: inset 2px 0 0 var(--color-accent-500);
}

.eintrag__datum,
.eintrag__distanz,
.eintrag__zeit {
  padding-top: 0.15rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-400);
}

.eintrag__distanz,
.eintrag__zeit {
  text-align: right;
  color: var(--color-steel-200);
}

.eintrag__zeit {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.eintrag__pace {
  font-size: var(--text-2xs);
  color: var(--color-steel-500);
}

.einheit {
  color: var(--color-steel-500);
}

.eintrag__titel {
  color: var(--color-steel-100);
  line-height: 1.45;
}

.eintrag--ausfall .eintrag__titel {
  color: var(--color-steel-400);
}

.eintrag--meilenstein .eintrag__titel {
  font-family: var(--font-display);
  font-style: italic;
}

.kennzeichen {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.05rem 0.4rem;
  border: 1px solid var(--color-graphite-600);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-style: normal;
  letter-spacing: 0.08em;
  vertical-align: 0.15em;
  color: var(--color-steel-400);
}

.eintrag--meilenstein .kennzeichen {
  border-color: var(--color-brass-500);
  color: var(--color-brass-300);
}

.eintrag__notiz {
  margin-top: 0.2rem;
  font-size: var(--text-sm);
  color: var(--color-steel-400);
}

.eintrag__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: 0.35rem;
}

.verweis {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: var(--text-sm);
  color: var(--color-accent-300);
  text-decoration: underline;
  text-decoration-color: rgba(88, 197, 187, 0.35);
  text-underline-offset: 3px;
}

.verweis:hover {
  text-decoration-color: currentColor;
}

.verweis__pfeil {
  width: 0.8rem;
  height: 0.8rem;
}

.verweis--ohne {
  color: var(--color-steel-500);
  text-decoration: none;
}

@media (max-width: 767px) {
  .jahrgang {
    grid-template-columns: minmax(0, 1fr);
  }

  .jahrgang__jahr {
    position: static;
    margin-bottom: 0.5rem;
  }

  .eintrag {
    grid-template-columns: 3.25rem minmax(0, 1fr) auto;
    grid-template-areas:
      'datum text text'
      'datum distanz zeit';
    row-gap: 0.4rem;
  }

  .eintrag__datum { grid-area: datum; }
  .eintrag__text { grid-area: text; }
  .eintrag__distanz { grid-area: distanz; text-align: left; padding-top: 0; }
  .eintrag__zeit { grid-area: zeit; padding-top: 0; flex-direction: row; gap: 0.6rem; align-items: baseline; }

  .eintrag__distanz:empty,
  .eintrag__zeit:empty {
    display: none;
  }
}
</style>
