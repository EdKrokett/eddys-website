<script setup lang="ts">
/**
 * Das Zifferblatt-Motiv und die Fakten-Leiste standen zunächst auf der Startseite
 * und sind auf Eddys Wunsch hierher gewandert (26.08.2026) — inhaltlich gehören
 * beide zur Person, nicht zum Einstieg: Der Bezel greift die Uhrmacher-Herkunft
 * auf, die Fakten sind die Kurzfassung der Biografie darunter.
 *
 * Der Bezel ist reines SVG (kein Bild, kein Canvas): skaliert verlustfrei,
 * kostet keinen Netzwerk-Request und ist SSR-fest.
 */

/** 60 Indexstriche wie auf einem Zifferblatt; jeder 5. ist ein betonter Hauptindex. */
const TICKS = Array.from({ length: 60 }, (_, i) => ({
  angle: i * 6,
  major: i % 5 === 0,
  /** Akzentindex auf 12 Uhr — die klassische Referenzmarke einer Uhr. */
  accent: i === 0,
}))

/**
 * Stunden- und Minutenzeiger stehen fest auf 4:30 — Eddys Zeit beim ersten
 * Berlin-Marathon (viereinhalb Stunden, neun Monate nach der letzten Zigarette).
 * Das ist der Grund für die Uhr auf dieser Seite und kein zufällig gewählter Stand.
 *
 * Der Sekundenzeiger läuft dagegen: 60 s pro Umlauf, gleitend wie bei einem
 * mechanischen Werk statt im Quarz-Sekundentakt — der Uhrmacher hätte es so gewollt.
 *
 * Bewusst KEINE echte Uhrzeit: Die käme auf Server und Client unterschiedlich heraus
 * und würde einen Hydration-Mismatch erzeugen (siehe docs/error-catalog.md). Ein
 * fester Stand plus reine CSS-Animation braucht kein JavaScript und keinen Timer.
 */
const HOUR_HAND_ANGLE = 135 // 4,5 h von 12 aus: 4,5 / 12 * 360
const MINUTE_HAND_ANGLE = 180 // 30 min: 30 / 60 * 360

useSeoMeta({
  title: 'Über mich — Eduard Andrae',
  description:
    'Werdegang, Kompetenzen und Projekte: vom Uhrmachermeister über zwei eigene Startups zum Gründer von trusted blogs und Agile Coach.',
})
</script>

<template>
  <div>
    <!-- ═══════════════ INTRO ═══════════════ -->
    <section class="intro">
      <UContainer class="relative z-10">
        <div class="intro__top">
          <!-- Textspalte -->
          <div class="intro__body">
            <p class="kicker">
              <span class="intro__mark" aria-hidden="true" />Über mich
            </p>

            <h1 class="intro__title">
              Erst Uhren.<br>Dann Startups.<br>Dann Marathon.
            </h1>

            <div class="intro__text">
              <p>
                Geboren 1966 in Nettetal am Niederrhein, gelernt habe ich ein Handwerk,
                das Geduld verlangt: Uhrmacher. Acht Jahre stand ich im familiengeführten
                Fachgeschäft, ab 1996 in der Geschäftsführung. Dann kam das Internet — und
                ich habe schweren Herzens verkauft und neu angefangen.
              </p>
              <p>
                Seit 2000 arbeite ich im Netz. Über den Schwarzwald, Gütersloh und Hamburg
                bin ich in Bremen gelandet, wo ich mit meiner Frau Kathi lebe. Zwei
                Unternehmen habe ich gegründet: 1Apreis.de, mein erstes Startup, und
                trusted blogs, das ich bis heute führe.
              </p>
              <p>
                Mit 40 habe ich das Rauchen aufgegeben — über 50 Zigaretten am Tag — und
                mir vorgenommen, einen Marathon zu laufen. Neun Monate später bin ich in
                Berlin ins Ziel gekommen. Seitdem läuft es, im Wortsinn.
              </p>
            </div>
          </div>

          <!--
            Bildspalte: Eddy vor dem Zifferblatt — der Uhrmacher vor der Uhr.
            Der Freisteller hat echte Transparenz (geprüft), deshalb steht er ohne
            Rahmen oder Kasten direkt auf der dunklen Fläche.
          -->
          <div class="intro__visual">
            <svg
              class="intro__dial"
              viewBox="-110 -110 220 220"
              aria-hidden="true"
              focusable="false"
            >
              <circle r="104" class="intro__dial-ring" />
              <circle r="86" class="intro__dial-ring intro__dial-ring--inner" />

              <g v-for="tick in TICKS" :key="tick.angle">
                <line
                  :transform="`rotate(${tick.angle})`"
                  x1="0"
                  y1="-104"
                  x2="0"
                  :y2="tick.major ? -93 : -99"
                  :class="[
                    'intro__tick',
                    tick.major && 'intro__tick--major',
                    tick.accent && 'intro__tick--accent',
                  ]"
                />
              </g>

              <!-- Zeiger: Stunde und Minute fest auf 4:30, Sekunde läuft -->
              <line
                :transform="`rotate(${HOUR_HAND_ANGLE})`"
                x1="0"
                y1="8"
                x2="0"
                y2="-48"
                class="intro__hand intro__hand--hour"
              />
              <line
                :transform="`rotate(${MINUTE_HAND_ANGLE})`"
                x1="0"
                y1="10"
                x2="0"
                y2="-74"
                class="intro__hand intro__hand--minute"
              />
              <line
                x1="0"
                y1="18"
                x2="0"
                y2="-88"
                class="intro__hand intro__hand--second"
              />

              <!-- Zeigerkappe über den Zeigerenden, wie die Lagerschraube im Werk -->
              <circle r="3.5" class="intro__cap" />
              <circle r="1.2" class="intro__cap-pin" />
            </svg>

            <NuxtImg
              src="/images/eddy-portrait.png"
              alt="Eduard Andrae"
              width="620"
              densities="1x 2x"
              format="webp"
              quality="88"
              class="intro__portrait"
            />
          </div>
        </div>

        <!-- Fakten als Messwerte, nicht als Fließtext -->
        <dl class="facts">
          <div v-for="fact in CV_FACTS" :key="fact.label" class="facts__item">
            <dt class="facts__value">
              {{ fact.value }}
            </dt>
            <dd class="facts__label">
              {{ fact.label }}
            </dd>
          </div>
        </dl>
      </UContainer>
    </section>

    <!-- ═══════════════ WERDEGANG ═══════════════ -->
    <section class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="Stationen"
          title="Werdegang"
          lead="Vom Handwerk in die Digitalwirtschaft — und irgendwann zurück zu dem, was beides verbindet: Dinge bauen, die funktionieren."
        />

        <div class="section__body">
          <CvTimeline :stations="CV_STATIONS" />
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ SKILLS ═══════════════ -->
    <section class="section section--bordered section--muted reveal">
      <UContainer>
        <SectionHead
          kicker="Kompetenzen"
          title="Was ich kann"
          lead="Eine Auswahl aus dem Kompetenzprofil — Schwerpunkte statt vollständiger Liste."
        />

        <div class="section__body">
          <SkillMeters :groups="CV_SKILL_GROUPS" />
        </div>

        <!-- Zertifikate & Sprachen als Datenblatt -->
        <div class="datasheet">
          <div class="datasheet__col">
            <h3 class="datasheet__title">
              Zertifikate
            </h3>
            <ul class="datasheet__list">
              <li v-for="cert in CV_CERTIFICATES" :key="cert.name" class="datasheet__row">
                <span class="datasheet__year">{{ cert.year }}</span>
                <span>
                  <span class="datasheet__name">{{ cert.name }}</span>
                  <span class="datasheet__meta">{{ cert.issuer }}</span>
                </span>
              </li>
            </ul>
          </div>

          <div class="datasheet__col">
            <h3 class="datasheet__title">
              Ausbildung
            </h3>
            <ul class="datasheet__list">
              <li v-for="edu in CV_EDUCATION" :key="edu.qualification" class="datasheet__row">
                <span class="datasheet__year">{{ edu.period }}</span>
                <span>
                  <span class="datasheet__name">{{ edu.qualification }}</span>
                  <span class="datasheet__meta">{{ edu.institution }}</span>
                </span>
              </li>
            </ul>
          </div>

          <div class="datasheet__col">
            <h3 class="datasheet__title">
              Sprachen
            </h3>
            <ul class="datasheet__list">
              <li
                v-for="lang in CV_LANGUAGES"
                :key="lang.name"
                class="datasheet__row"
                :class="{ 'datasheet__row--playful': lang.playful }"
              >
                <span class="datasheet__year">{{ lang.playful ? '¯\\_(ツ)_/¯' : '—' }}</span>
                <span>
                  <span class="datasheet__name">{{ lang.name }}</span>
                  <span class="datasheet__meta">{{ lang.level }}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ PROJEKTE ═══════════════ -->
    <section class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="Projekte"
          title="Was ich gebaut habe"
        />

        <ol class="projects">
          <li v-for="(project, i) in CV_PROJECTS" :key="project.name" class="project">
            <span class="project__num">{{ String(i + 1).padStart(2, '0') }}</span>

            <div class="project__main">
              <h3 class="project__name">
                <a
                  v-if="project.url"
                  :href="project.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="project__link"
                >
                  {{ project.name }}
                  <Icon name="lucide:arrow-up-right" class="project__link-icon size-4" />
                </a>
                <template v-else>{{ project.name }}</template>
              </h3>
              <p class="project__description">
                {{ project.description }}
              </p>
            </div>

            <div class="project__meta">
              <span class="project__period">{{ project.period }}</span>
              <span class="project__role">{{ project.role }}</span>
            </div>
          </li>
        </ol>
      </UContainer>
    </section>

    <!-- ═══════════════ ABSCHLUSS ═══════════════ -->
    <section class="outro reveal">
      <UContainer>
        <p class="outro__quote">
          „Es ist nicht die Zeit, die zählt — es ist Deine Leidenschaft.“
        </p>
        <div class="outro__actions">
          <NuxtLink to="/blog" class="outro__link">
            Zum Blog
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
          <NuxtLink to="/kontakt" class="outro__link outro__link--muted">
            Kontakt aufnehmen
          </NuxtLink>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* ── Intro ──────────────────────────────────────────────────────────────── */
.intro {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(3.5rem, 9vw, 6.5rem) 0 clamp(3rem, 6vw, 4.5rem);
  background:
    radial-gradient(85% 70% at 12% 0%, rgba(33, 164, 163, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

/* ── Zwei-Spalten-Kopf ──────────────────────────────────────────────────── */
.intro__top {
  display: grid;
  gap: clamp(2.5rem, 5vw, 4rem);
}
/* Erst ab dieser Breite ist wirklich Platz für Text UND Bild nebeneinander —
   darunter stapeln beide, damit die Zeilenlänge lesbar bleibt. */
@media (min-width: 1000px) {
  .intro__top {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
    align-items: center;
  }
}

.intro__body {
  max-width: 40rem;
}

/* ── Bildspalte: Porträt vor dem Zifferblatt ───────────────────────────── */
.intro__visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(20rem, 42vw, 30rem);
}

.intro__dial {
  position: absolute;
  /*
   * Bewusst nicht mittig: Der Zeigerdrehpunkt läge sonst genau auf Eddys Kinn.
   * Um 14 % nach unten versetzt sitzt die Achse auf Brusthöhe, die Zeiger laufen
   * über Hemd und Arme statt übers Gesicht.
   */
  top: 50%;
  left: 50%;
  translate: -50% -36%;
  width: min(115%, 34rem);
  aspect-ratio: 1;
  /*
   * Bewusst ÜBER dem Porträt (z-index 2): Die Zeiger stehen auf 4:30 und zeigen
   * damit nach unten rechts — also genau dorthin, wo Eddys Schulter ist. Hinter
   * dem Bild wären sie unsichtbar und die Uhr hätte nur einen laufenden Zeiger.
   * Davor gelegt liest sich das Ganze wie ein Zifferblatt unter Uhrenglas.
   */
  z-index: 2;
  pointer-events: none;
}

.intro__portrait {
  position: relative;
  z-index: 1;
  width: min(74%, 21rem);
  height: auto;
  /* Etwas tiefer gesetzt, damit oben genug Zifferblatt frei bleibt, um die
     Zeiger zu erkennen — sonst verdeckt der Freisteller die halbe Uhr. */
  margin-top: 1rem;
  /* Weicher Abriss nach unten, damit der Freisteller nicht wie ausgeschnitten
     auf der Fläche klebt, sondern in den Hintergrund ausläuft. */
  mask-image: linear-gradient(to bottom, #000 76%, transparent 99%);
  filter: drop-shadow(0 18px 45px rgba(14, 15, 18, 0.75));
}

/* Hochkant: Bild zuerst, Zifferblatt deutlich zurückgenommener Hintergrund. */
@media (max-width: 999px) {
  .intro__visual {
    order: -1;
    min-height: 0;
  }
  .intro__dial {
    width: min(120%, 26rem);
    opacity: 0.45;
  }
  .intro__portrait {
    width: min(78%, 20rem);
  }
}

/* ── Zifferblatt-Details ────────────────────────────────────────────────── */
.intro__dial-ring {
  fill: none;
  stroke: var(--color-graphite-700);
  stroke-width: 0.4;
}
.intro__dial-ring--inner {
  stroke-dasharray: 1 5;
  opacity: 0.7;
}

.intro__tick {
  stroke: var(--color-steel-600);
  stroke-width: 0.7;
  opacity: 0.75;
}
.intro__tick--major {
  stroke: var(--color-steel-600);
  stroke-width: 1.4;
}
.intro__tick--accent {
  stroke: var(--color-accent-500);
  stroke-width: 2.4;
}

/* ── Zeiger ─────────────────────────────────────────────────────────────── */
.intro__hand {
  stroke-linecap: round;
  /* Leichter Schatten, damit die Zeiger auch über hellen Bildstellen ablesbar
     bleiben — auf dem hellblauen Hemd würden sie sonst verschwinden. */
  filter: drop-shadow(0 1px 3px rgba(14, 15, 18, 0.85));
}

.intro__hand--hour {
  stroke: var(--color-steel-100);
  stroke-width: 4.5;
}

.intro__hand--minute {
  stroke: var(--color-steel-200);
  stroke-width: 3;
}

/*
 * Der Sekundenzeiger dreht um den Zifferblattmittelpunkt. Die viewBox ist auf
 * (0 0) zentriert (-110 -110 220 220), deshalb liegt `transform-origin: center`
 * mit `transform-box: view-box` exakt auf der Zeigerachse — ohne dass hier
 * Pixelwerte nachgerechnet werden müssten.
 */
.intro__hand--second {
  stroke: var(--color-accent-300);
  stroke-width: 1.6;
  transform-box: view-box;
  transform-origin: center;
  animation: clock-sweep 60s linear infinite;
}

@keyframes clock-sweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Sekundenzeiger anhalten, wenn reduzierte Bewegung gewünscht ist. Er bleibt
   sichtbar, die Uhr wirkt dann nur stehengeblieben statt zu verschwinden. */
@media (prefers-reduced-motion: reduce) {
  .intro__hand--second {
    animation: none;
  }
}

.intro__cap {
  fill: var(--color-steel-300);
}
.intro__cap-pin {
  fill: var(--color-graphite-950);
}

.intro__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

/* ── Fakten ─────────────────────────────────────────────────────────────── */
.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  max-width: 46rem;
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}
@media (min-width: 720px) {
  .facts {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.facts__item {
  padding: 1rem 1.125rem 1.125rem;
  background: var(--color-graphite-950);
}
/* Fünf Fakten in zwei Spalten lassen unten rechts ein leeres Feld stehen —
   der letzte Eintrag nimmt deshalb die ganze Breite ein. */
@media (max-width: 719px) {
  .facts__item:last-child {
    grid-column: 1 / -1;
  }
}

.facts__value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  color: var(--color-steel-100);
}

.facts__label {
  margin-top: 0.35rem;
  font-size: var(--text-xs);
  line-height: 1.4;
  color: var(--color-steel-500);
}

.intro__title {
  margin-top: 1.25rem;
  font-size: clamp(2.25rem, 6vw, 3.75rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

.intro__text {
  display: grid;
  gap: 1.25rem;
  margin-top: clamp(2rem, 4vw, 3rem);
  max-width: 40rem;
  font-size: var(--text-lg);
  line-height: 1.75;
  color: var(--color-steel-200);
}

/* ── Sektionen ──────────────────────────────────────────────────────────── */
.section {
  padding: clamp(3.5rem, 8vw, 6rem) 0;
}
.section--bordered + .section--bordered {
  border-top: 1px solid var(--color-graphite-700);
}
.section--muted {
  background: var(--color-graphite-950);
}

.section__body {
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
}

/* ── Datenblatt ─────────────────────────────────────────────────────────── */
.datasheet {
  display: grid;
  gap: 2.5rem;
  margin-top: clamp(3rem, 6vw, 4.5rem);
  padding-top: clamp(2rem, 4vw, 3rem);
  border-top: 1px solid var(--color-graphite-700);
}
@media (min-width: 768px) {
  .datasheet {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.5rem;
  }
}

.datasheet__title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-400);
}

.datasheet__list {
  margin-top: 1.125rem;
  display: flex;
  flex-direction: column;
}

.datasheet__row {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}

.datasheet__year {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-600);
}

.datasheet__name {
  display: block;
  font-size: var(--text-base);
  color: var(--color-steel-200);
}

.datasheet__meta {
  display: block;
  margin-top: 0.15rem;
  font-size: var(--text-xs);
  color: var(--color-steel-500);
}

.datasheet__row--playful .datasheet__year {
  font-size: var(--text-2xs);
  color: var(--color-brass-400);
}
.datasheet__row--playful .datasheet__name {
  color: var(--color-brass-300);
}

/* ── Projekte ───────────────────────────────────────────────────────────── */
.projects {
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  border-top: 1px solid var(--color-graphite-700);
}

.project {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: 0.5rem 1rem;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
  transition: background 250ms ease;
}
@media (min-width: 900px) {
  .project {
    grid-template-columns: 3.5rem 1fr 14rem;
    gap: 2rem;
    align-items: baseline;
  }
}

.project__num {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-600);
  font-variant-numeric: tabular-nums;
}

.project__name {
  font-size: 1.25rem;
  color: var(--color-steel-100);
}

.project__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 200ms ease;
}
.project__link:hover {
  color: var(--color-accent-400);
}
.project__link-icon {
  color: var(--color-steel-600);
  transition: color 200ms ease, translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.project__link:hover .project__link-icon {
  color: var(--color-accent-400);
  translate: 0.15rem -0.15rem;
}

.project__description {
  margin-top: 0.5rem;
  max-width: 40rem;
  font-size: var(--text-base);
  line-height: 1.65;
  color: var(--color-steel-400);
}

.project__meta {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.75rem;
}
@media (min-width: 900px) {
  .project__meta {
    grid-column: 3;
    margin-top: 0;
    text-align: right;
  }
}

.project__period {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-accent-400);
  font-variant-numeric: tabular-nums;
}

.project__role {
  font-size: var(--text-xs);
  color: var(--color-steel-500);
}

/* ── Outro ──────────────────────────────────────────────────────────────── */
.outro {
  border-top: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
  padding: clamp(3.5rem, 8vw, 5.5rem) 0;
  text-align: center;
}

.outro__quote {
  margin-inline: auto;
  max-width: 34rem;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 3vw, 1.85rem);
  font-style: italic;
  line-height: 1.4;
  color: var(--color-steel-200);
}

.outro__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem 2.5rem;
  margin-top: 2.5rem;
}

.outro__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-100);
  border-bottom: 1px solid var(--color-accent-500);
  padding-bottom: 0.35rem;
  transition: color 200ms ease;
}
.outro__link:hover {
  color: var(--color-accent-400);
}

.outro__link--muted {
  color: var(--color-steel-400);
  border-color: var(--color-graphite-600);
}
</style>
