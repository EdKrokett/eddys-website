<script setup lang="ts">
import type { ProtokollFilter } from '~/utils/statistik'

/**
 * Eddys Laufstatistik seit 2006. Datenquelle, Regeln und Design: docs/statistik.md.
 *
 * ── Design-Richtung „Gangbuch“ ─────────────────────────────────────────────────
 * Ein Chronometer bekommt beim Uhrmacher ein Gangbuch: Messwerte über die Zeit. Diese Seite
 * ist Eddys Gangbuch als Läufer und setzt „Präzisionswerk“ fort:
 *
 * - Zahlen tragen die Seite. Mono, groß, tabellarisch ausgerichtet.
 * - Der Zeitstrahl ist das Leitmotiv: jeder Lauf ein Indexstrich wie auf einem Zifferblatt.
 * - Teal ist die Messung, Messing die Auszeichnung (Bestzeit, Meilenstein). Nirgends sonst.
 * - Haarlinien statt Karten. Kein Diagramm sitzt in einer Box.
 */
const { laeufe, kennzahlen, zeitstrahl, marathons, halbmarathons, status, refresh } = useStatistik()

const halbmarathonPlot = computed(() => baueZeitPlot(halbmarathons.value, zeitstrahl.value?.bisJahr ?? 0))

/** Lead-Texte aus den Daten, damit sie nach dem nächsten Marathon nicht veralten. */
const marathonLead = computed(() => {
  const erster = marathons.value[0]?.lauf
  const letzter = marathons.value.at(-1)?.lauf
  if (!erster || !letzter) return undefined
  return `Der erste ${erster.jahr} in ${ortAus(erster.titel)}, der bisher letzte ${letzter.jahr}. `
    + 'Die Staffel in Köln 2011 steht im Protokoll und zählt hier nicht mit.'
})

const halbmarathonLead = computed(() => {
  const zuletztUnterZwei = [...halbmarathons.value].reverse().find(p => p.sekunden < 7200)?.lauf
  const satz = 'Je tiefer ein Punkt, desto schneller.'
  return zuletztUnterZwei
    ? `${satz} Zuletzt unter zwei Stunden: ${zuletztUnterZwei.titel}, ${zuletztUnterZwei.jahr}.`
    : satz
})

/** „real,- Marathon Berlin“ → „Berlin“. Nur für den Lead, deshalb bewusst schlicht. */
function ortAus(titel: string): string {
  return titel.split(' ').at(-1) ?? titel
}

const filter = ref<ProtokollFilter>('alle')
const suche = ref('')
const markiert = ref<number | null>(null)

/**
 * Sprung aus einem Diagramm ins Protokoll. Filter und Suche werden zurückgesetzt, sonst
 * stünde der Eintrag womöglich gar nicht in der Liste.
 */
async function springeZu(id: number) {
  filter.value = 'alle'
  suche.value = ''
  markiert.value = id
  await nextTick()
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(`lauf-${id}`)?.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'center' })
}

const title = 'Laufstatistik — Eduard Andrae'
const description
  = 'Alle meine Läufe seit 2006: zehn Marathons, die Bestzeiten, der Weg zurück unter zwei '
    + 'Stunden im Halbmarathon und das vollständige Protokoll mit Urkunden und Berichten.'

const { url: siteUrl } = useSiteConfig()

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogSiteName: 'Eduard Andrae',
  ogUrl: `${siteUrl}/statistik`,
  ogImage: `${siteUrl}/images/og-startseite.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/jpeg',
  ogLocale: 'de_DE',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <!-- ═══════════════ KOPF ═══════════════ -->
    <section class="kopf">
      <UContainer>
        <div class="kopf__oben">
          <div>
            <p class="kicker">
              <span class="kopf__mark" aria-hidden="true" />Laufstatistik
            </p>

            <h1 class="kopf__titel">
              Gangbuch eines Läufers
            </h1>

            <div class="kopf__text">
              <p>
                Uhrmacher führ(t)en für Chronometer ein Gangbuch, in dem Messwerte über einen
                längeren Zeitraum festgehalten werden. Das hier ist meins.
              </p>
              <p>
                Im Januar 2006 habe ich als 40-jähriger Kettenraucher mit dem Laufen angefangen.
                Das Ziel war, einmal im Leben einen Marathon zu überstehen. Neun Monate später war
                ich in Berlin im Ziel, und seitdem halte ich hier fest, wann, wo und wie weit ich
                gelaufen bin.
              </p>
            </div>
          </div>

          <div v-if="zeitstrahl" class="kopf__blatt">
            <StatistikZifferblatt :modell="zeitstrahl" />
          </div>
        </div>

        <StatistikPruefschein v-if="status === 'success' && laeufe.length" :kennzahlen="kennzahlen" />
      </UContainer>
    </section>

    <!-- ═══════════════ ZUSTÄNDE ═══════════════ -->
    <UContainer v-if="status === 'pending' || status === 'idle'" class="zustand">
      <p class="zustand__text" role="status">
        Lade die Läufe …
      </p>
    </UContainer>

    <UContainer v-else-if="status === 'error'" class="zustand">
      <p class="zustand__text" role="alert">
        Die Laufstatistik ist gerade nicht erreichbar.
      </p>
      <button type="button" class="zustand__knopf" @click="refresh()">
        Noch einmal versuchen
      </button>
    </UContainer>

    <UContainer v-else-if="!laeufe.length" class="zustand">
      <p class="zustand__text">
        Noch keine Läufe eingetragen.
      </p>
    </UContainer>

    <template v-else>
      <!-- ═══════════════ 01 · ZEITSTRAHL ═══════════════ -->
      <section v-if="zeitstrahl" class="abschnitt">
        <UContainer>
          <SectionHead
            kicker="01 · Zeitstrahl"
            title="Jeder Lauf ein Strich"
            lead="Die Länge zeigt die Distanz. Hohle Striche stehen für Läufe, zu denen ich nicht angetreten oder nicht ins Ziel gekommen bin. Die Rauten unter der Achse sind Meilensteine abseits der Startlinie."
          />
          <StatistikZeitstrahl :modell="zeitstrahl" @select="springeZu" />
        </UContainer>
      </section>

      <!-- ═══════════════ 02 · MARATHON ═══════════════ -->
      <section v-if="marathons.length" class="abschnitt abschnitt--linie">
        <UContainer>
          <SectionHead
            kicker="02 · Marathon"
            :title="`${marathons.length} Marathons`"
            :lead="marathonLead"
          />
          <StatistikMarathons :reihe="marathons" />
        </UContainer>
      </section>

      <!-- ═══════════════ 03 · HALBMARATHON ═══════════════ -->
      <section v-if="halbmarathonPlot" class="abschnitt abschnitt--linie">
        <UContainer>
          <SectionHead
            kicker="03 · Halbmarathon"
            title="Die Zwei-Stunden-Marke"
            :lead="halbmarathonLead"
          />
          <StatistikHalbmarathon :modell="halbmarathonPlot" />
        </UContainer>
      </section>

      <!-- ═══════════════ 04 · PROTOKOLL ═══════════════ -->
      <section id="protokoll" class="abschnitt abschnitt--linie">
        <UContainer>
          <SectionHead
            kicker="04 · Protokoll"
            title="Alle Einträge"
            lead="Wettkämpfe, Trainingsläufe und Meilensteine, die neuesten zuerst. Urkunden und Berichte sind verlinkt, soweit es sie noch gibt."
          />
          <StatistikProtokoll
            v-model:filter="filter"
            v-model:suche="suche"
            :laeufe="laeufe"
            :markiert="markiert"
          />
        </UContainer>
      </section>

      <!-- ═══════════════ MOTTO ═══════════════ -->
      <section class="motto">
        <UContainer>
          <blockquote class="motto__zitat">
            <p>Es ist nicht die Zeit, die zählt, es ist deine Leidenschaft.</p>
          </blockquote>
          <p class="motto__nachsatz">
            Die Zahlen auf dieser Seite messen, was die Leidenschaft dazwischen angerichtet hat.
            Die Berichte dazu stehen in
            <NuxtLink to="/blog" class="textlink">meinem Blog</NuxtLink>.
          </p>
        </UContainer>
      </section>
    </template>
  </div>
</template>

<style scoped>
.kopf {
  position: relative;
  padding: clamp(3.5rem, 9vw, 6.5rem) 0 clamp(3rem, 7vw, 5rem);
  border-bottom: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(60% 110% at 15% 0%, rgba(33, 164, 163, 0.09) 0%, transparent 60%),
    radial-gradient(40% 70% at 90% 30%, rgba(207, 168, 100, 0.05) 0%, transparent 70%),
    var(--color-graphite-950);
}

.kopf__oben {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 2rem 4rem;
}

/* Das Zifferblatt nur, wo es neben dem Text Platz hat. Darunter folgt direkt der Prüfschein. */
.kopf__blatt {
  display: none;
}

@media (min-width: 1100px) {
  .kopf__oben {
    grid-template-columns: minmax(0, 1fr) minmax(0, 27rem);
  }

  .kopf__blatt {
    display: block;
  }
}

.kopf__mark {
  width: 2rem;
  height: 2px;
  background: var(--color-accent-400);
}

.kopf__titel {
  margin-top: 1.25rem;
  max-width: 14ch;
  font-size: clamp(2.6rem, 7.5vw, 5.25rem);
  line-height: 0.98;
  color: var(--color-steel-100);
  animation: var(--animate-rise);
}

.kopf__text {
  display: grid;
  gap: 1rem;
  max-width: 40rem;
  margin-top: clamp(1.5rem, 3vw, 2.25rem);
  font-size: var(--text-md);
  line-height: 1.65;
  color: var(--color-steel-300);
}

.kopf__text p:first-child {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-lg);
  color: var(--color-steel-200);
}

.abschnitt {
  padding: clamp(3.5rem, 8vw, 6rem) 0;
}

.abschnitt--linie {
  border-top: 1px solid var(--color-graphite-700);
}

.zustand {
  padding-block: clamp(3rem, 8vw, 5rem);
}

.zustand__text {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-steel-400);
}

.zustand__knopf {
  margin-top: 1rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-accent-500);
  background: transparent;
  font-size: var(--text-sm);
  color: var(--color-accent-300);
}

.motto {
  padding: clamp(4rem, 10vw, 7.5rem) 0;
  border-top: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(50% 90% at 50% 100%, rgba(33, 164, 163, 0.07) 0%, transparent 70%),
    var(--color-graphite-950);
  text-align: center;
}

.motto__zitat p {
  max-width: 22ch;
  margin-inline: auto;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.9rem, 5vw, 3.4rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-wrap: balance;
  color: var(--color-steel-100);
}

.motto__nachsatz {
  max-width: 36rem;
  margin: 1.75rem auto 0;
  font-size: var(--text-base);
  color: var(--color-steel-400);
}

.textlink {
  color: var(--color-accent-300);
  text-decoration: underline;
  text-decoration-color: rgba(88, 197, 187, 0.4);
  text-underline-offset: 3px;
}

.textlink:hover {
  text-decoration-color: currentColor;
}
</style>
