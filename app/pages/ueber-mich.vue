<script setup lang="ts">
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
      <UContainer>
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
      </UContainer>
    </section>

    <!-- ═══════════════ WERDEGANG ═══════════════ -->
    <section class="section section--bordered">
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
    <section class="section section--bordered section--muted">
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
    <section class="section section--bordered">
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
    <section class="outro">
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
  padding: clamp(3.5rem, 9vw, 6.5rem) 0 clamp(3rem, 6vw, 4.5rem);
  background:
    radial-gradient(85% 70% at 12% 0%, rgba(200, 16, 46, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

.intro__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-swiss-500);
}

.intro__title {
  margin-top: 1.25rem;
  font-size: clamp(2.5rem, 7.5vw, 4.75rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

.intro__text {
  display: grid;
  gap: 1.25rem;
  margin-top: clamp(2rem, 4vw, 3rem);
  max-width: 40rem;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--color-steel-300);
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
  font-size: 0.7rem;
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
  font-size: 0.7rem;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-600);
}

.datasheet__name {
  display: block;
  font-size: 0.875rem;
  color: var(--color-steel-200);
}

.datasheet__meta {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: var(--color-steel-500);
}

.datasheet__row--playful .datasheet__year {
  font-size: 0.6rem;
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
  font-size: 0.75rem;
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
  color: var(--color-swiss-400);
}
.project__link-icon {
  color: var(--color-steel-600);
  transition: color 200ms ease, translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.project__link:hover .project__link-icon {
  color: var(--color-swiss-400);
  translate: 0.15rem -0.15rem;
}

.project__description {
  margin-top: 0.5rem;
  max-width: 40rem;
  font-size: 0.9rem;
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
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--color-swiss-400);
  font-variant-numeric: tabular-nums;
}

.project__role {
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-100);
  border-bottom: 1px solid var(--color-swiss-500);
  padding-bottom: 0.35rem;
  transition: color 200ms ease;
}
.outro__link:hover {
  color: var(--color-swiss-400);
}

.outro__link--muted {
  color: var(--color-steel-400);
  border-color: var(--color-graphite-600);
}
</style>
