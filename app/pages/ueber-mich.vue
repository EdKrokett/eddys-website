<script setup lang="ts">
import type { CvChapter } from '#shared/types/cv'

/**
 * ── Einstieg seit 19.10.2026 ───────────────────────────────────────────────
 * Die animierte Uhr ist auf Eddys Wunsch entfallen. Oben steht jetzt der Text
 * seiner alten Seite blog.eduard-andrae.de/persoenliches, mit den Fotos von dort
 * als Tafeln und einem eigenen Lageplan von Arsten, über die volle Breite.
 * Konzept, Textänderungen und Kartendaten: docs/ueber-mich-einstieg.md.
 *
 * Die Fakten-Leiste darunter ist geblieben: die Kurzfassung der Biografie.
 *
 * ── Navigierbar seit 30.08.2026 ────────────────────────────────────────────
 * Die Seite war "eine lange Tapete" (Eddy): ein Scroll ohne Orientierung. Sie ist
 * jetzt in VIER Kapitel geteilt, die zweimal auftauchen — als Übersicht nach dem
 * Intro (CvChapters, "was kommt noch?") und als Sticky-Leiste beim Scrollen
 * (CvChapterBar, "wo bin ich?"). Dazu die Jahresachse über dem Werdegang und
 * aufklappbare Stationen. Konzept und Begründungen: docs/ueber-mich-navigation.md.
 */

/** LinkedIn-Adresse aus der zentralen Profilliste statt doppelt gepflegt. */
const linkedInUrl = SOCIAL_PROFILES.find(profile => profile.name === 'LinkedIn')?.url

/**
 * Referenzjahr für Dauerangaben ("10 Jahre") und das Ende der Jahresachse.
 *
 * Über `useState`, NICHT über ein direktes `new Date()` im Template: useState
 * serialisiert den Serverwert in den Payload, der Client übernimmt ihn. Sonst
 * liefen Server- und Client-Render über den Jahreswechsel auseinander — genau der
 * Hydration-Mismatch, an dem auf dieser Seite schon die Uhrzeiger gescheitert sind.
 */
const nowYear = useState('cv-year', () => new Date().getFullYear())

// ── Kapitel ────────────────────────────────────────────────────────────────
/**
 * Eine Quelle für Übersicht und Sticky-Leiste. Die Kennzahlen werden IMMER aus den
 * Datenlängen gerechnet — von Hand gezählte Zahlen veralten beim nächsten Eintrag
 * in app/utils/cv.ts still.
 */
const chapters = computed<CvChapter[]>(() => {
  const firstYear = Math.min(...CV_STATIONS.map(station => station.startYear))
  const skillCount = CV_SKILL_GROUPS.reduce((sum, group) => sum + group.skills.length, 0)
  const onlineProjects = CV_PROJECTS.filter(project => project.url).length

  return [
    {
      id: 'werdegang',
      num: '01',
      label: 'Werdegang',
      title: 'Werdegang',
      teaser: 'Vom Uhrmacherhandwerk über zwei eigene Startups zum Agile Coach.',
      metrics: [`${CV_STATIONS.length} Stationen`, `${firstYear}—heute`],
    },
    {
      id: 'kompetenzen',
      num: '02',
      label: 'Was ich kann',
      title: 'Was ich kann',
      teaser: 'Schwerpunkte aus dem Kompetenzprofil, mit ehrlicher Stärke-Skala.',
      metrics: [`${skillCount} Kompetenzen`, `${CV_SKILL_GROUPS.length} Felder`],
    },
    {
      id: 'datenblatt',
      num: '03',
      label: 'Datenblatt',
      title: 'Datenblatt',
      teaser: 'Zertifikate, Ausbildung und Sprachen — die Nachweise dahinter.',
      metrics: [
        `${CV_CERTIFICATES.length} Zertifikate`,
        `${CV_EDUCATION.length} Abschlüsse`,
        `${CV_LANGUAGES.length} Sprachen`,
      ],
    },
    {
      id: 'projekte',
      num: '04',
      label: 'Projekte',
      title: 'Was ich gebaut habe',
      teaser: 'Eigene Gründungen und Projekte, an denen ich mitgebaut habe.',
      metrics: [`${CV_PROJECTS.length} Projekte`, `${onlineProjects} davon online`],
    },
  ]
})

const chapterIds = computed(() => chapters.value.map(chapter => chapter.id))
const { activeId } = useScrollSpy(chapterIds)

// ── Aufklappbare Stationen ─────────────────────────────────────────────────
/**
 * Vorbelegt sind die laufenden Stationen: Wer die Seite öffnet, liest sofort, was
 * Eddy HEUTE macht, und klappt den Rest bei Interesse auf.
 */
const openKeys = ref<string[]>(
  CV_STATIONS.filter(station => station.current).map(stationKey),
)

const allOpen = computed(() => openKeys.value.length === CV_STATIONS.length)

function toggleStation(key: string) {
  openKeys.value = openKeys.value.includes(key)
    ? openKeys.value.filter(open => open !== key)
    : [...openKeys.value, key]
}

function toggleAll() {
  openKeys.value = allOpen.value ? [] : CV_STATIONS.map(stationKey)
}

/**
 * Klick auf einen Balken der Jahresachse: Station aufklappen und hinspringen.
 *
 * `scrollIntoView` bewusst OHNE `behavior: 'smooth'` — so gilt `scroll-behavior`
 * aus main.css, und der Block für `prefers-reduced-motion` schaltet den weichen
 * Sprung dort zentral ab. Ein hart gesetztes `smooth` würde ihn überstimmen.
 */
async function focusStation(key: string) {
  if (!openKeys.value.includes(key)) openKeys.value = [...openKeys.value, key]

  // Erst rendern lassen: das Panel ändert beim Aufklappen die Höhe.
  await nextTick()
  document.getElementById(`station-${key}`)?.scrollIntoView({ block: 'start' })
}

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
        <!--
          Text der alten Seite blog.eduard-andrae.de/persoenliches, Eddys eigener
          Wortlaut. Was davon für die neue Seite angepasst ist (Links, ein Tippfehler):
          docs/ueber-mich-einstieg.md.
        -->

        <!-- Block 1: Herkunft, rechts die Color-Run-Tafel bis zur Überschrift hochgezogen. -->
        <div class="opening">
          <div class="opening__head">
            <p class="kicker">
              <span class="intro__mark" aria-hidden="true" />Über mich
            </p>

            <h1 class="intro__title">
              Wer schreibt hier?<br><em class="intro__title-turn">Und warum?</em>
            </h1>
          </div>

          <div class="prose opening__text">
            <p class="prose__lead">
              Ich heiße Eduard (Eddy) Andrae und stamme aus dem schönen
              <a href="https://www.nettetal.de/" target="_blank" rel="noopener noreferrer">Nettetal</a>
              am Niederrhein, wo ich 1966 geboren wurde. Na? Nachgerechnet? Ja genau: so alt bin
              ich schon. Aber ich sag mal: je oller, je doller! Und außerdem werde ich 150 Jahre
              alt, wie Du <NuxtLink to="/blog/ich-werde-150-jahre-alt">hier nachlesen</NuxtLink>
              kannst. 😊
            </p>
            <p>
              Eigentlich bin ich ja Uhrmachermeister, aber seit dem Jahr 2000 mache ich
              <em>was mit Internet</em>, wie meine Mutter das gerne beschreibt, wenn sie gefragt
              wird, was ihr Sohn beruflich macht. Wenn Dir diese Erklärung nicht reicht, findest
              Du mehr Details weiter unten im <a href="#werdegang">Werdegang</a> und in meinem
              <a
                v-if="linkedInUrl"
                :href="linkedInUrl"
                target="_blank"
                rel="noopener noreferrer"
              >LinkedIn-Profil</a><template v-else>LinkedIn-Profil</template>.
              Meine beruflichen Stationen führten mich zunächst in den Schwarzwald, danach über
              Gütersloh und Hamburg nach Bremen.
            </p>
            <p>
              Hier habe ich Kathi getroffen, kennengelernt und geheiratet. Wir beide leben mit
              <del>zwei Perserkatern</del> Perserkater Felix (leider mussten wir uns 2024 von
              unserem geliebten Tyson verabschieden) in einem kleinen, aber feinen
              Reihen-Eigenheim aka ‚Scheibchenvilla‘ am südlichen Bremer Stadtrand, im schönen
              Arsten.
            </p>
          </div>

          <CvPhotoPlate
            class="opening__plate"
            :photo="ABOUT_PHOTOS.colorRun"
            sizes="100vw sm:420px lg:420px"
            eager
          />
        </div>

        <!-- Block 2: Lageplan über die volle Breite, die Einladung liegt als Tafel darauf. -->
        <div class="intro__map">
          <CvArstenMap>
            <div class="prose prose--note">
              <p>
                Übrigens: Wenn Du mal in Bremen bist und Lust hast, mit mir zu laufen, dann trau
                Dich und <NuxtLink to="/kontakt">melde Dich einfach bei mir</NuxtLink>. Ich würde
                mich freuen, wenn wir uns über das gemeinsame Hobby kennenlernen. Und ich biete
                Dir bei Bedarf auch gern eine Übernachtungsmöglichkeit bei uns an.
              </p>
              <p>
                Das ist wirklich ernst gemeint. Zum Beweis: unter der Überschrift
                „<NuxtLink to="/blog/couch-running-eine-idee">Couch-Running</NuxtLink>“ habe ich
                zu dieser Idee auch schon mal etwas hier im Blog geschrieben.
              </p>
            </div>
          </CvArstenMap>
        </div>

        <!-- Block 3: Laufen + Bloggen, gespiegelt zu Block 1. -->
        <div class="running">
          <CvPhotoPlate
            class="running__plate"
            :photo="ABOUT_PHOTOS.karstadtMarathon"
            sizes="100vw sm:420px lg:420px"
          />

          <div class="prose running__text">
            <h2 class="intro__subtitle">
              Laufen <span class="intro__subtitle-plus" aria-hidden="true">+</span><span class="sr-only">und</span> Bloggen
            </h2>
            <p>
              Mit dem Laufen begonnen habe ich erst mit 40 Jahren. Damals noch als Kettenraucher:
              über 50 Kippen täglich, mehr als zwei Jahrzehnte lang. Wahnsinn. Damit sollte
              Schluss sein…
            </p>
            <p class="prose__pull">
              Statt einer neuen Schachtel Zigaretten kaufte ich also das erste Paar Laufschuhe.
            </p>
            <p>
              Meine Absicht war, durch das Laufen meine „Gesundung“ zu beschleunigen und das
              Nikotin noch schneller aus meinem Körper zu treiben. Wenn schon, denn schon!
            </p>
            <p>
              Mein Ziel damals: wenigstens einmal in meinem Leben einen Marathon schaffen.
            </p>
            <p>
              Zur gleichen Zeit (also 2006) habe ich auch mit dem Bloggen angefangen: Ich wollte
              meine Verwandlung vom Kettenraucher zum Marathonläufer festhalten. Für später…
            </p>
            <p>
              Mein Ziel habe ich 9 Monate später erreicht, als ich beim Berlin-Marathon nach rund
              viereinhalb Stunden überglücklich über die Ziellinie gelaufen bin. Seitdem versuche
              ich, mindestens einmal pro Jahr über offiziell vermessene Distanzen ins Ziel zu
              laufen. Das ist mir bis heute auch ein paar mal gelungen. Und inzwischen bin ich
              richtig verliebt in diese ganz besondere Atmosphäre bei Wettkämpfen.
            </p>
            <p>
              Auf der Seite „<a
                href="https://blog.eduard-andrae.de/statistik/"
                target="_blank"
                rel="noopener noreferrer"
              >Statistisches</a>“ halte ich fest, wann, wo und wie weit ich gelaufen bin. Für
              später, wie gesagt.
            </p>
          </div>
        </div>

        <!-- Fakten als Messwerte, nicht als Fließtext: die Kurzfassung des Texts darüber. -->
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

        <!-- Inhaltsverzeichnis: beantwortet "was kommt noch?", bevor jemand scrollt. -->
        <div class="intro__chapters">
          <CvChapters :chapters="chapters" />
        </div>
      </UContainer>
    </section>

    <!--
      Sticky-Leiste. Steht direkt hinter dem Intro und klebt ab dort unter dem
      Header; sie ist 0 px hoch und überlagert den Inhalt, statt Platz zu belegen.
      Eingeblendet wird sie erst, wenn das Scrollspy ein Kapitel meldet.
    -->
    <CvChapterBar :chapters="chapters" :active-id="activeId" />

    <!-- ═══════════════ 01 WERDEGANG ═══════════════ -->
    <section id="werdegang" class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="Stationen"
          title="Werdegang"
          lead="Vom Handwerk in die Digitalwirtschaft — und irgendwann zurück zu dem, was beides verbindet: Dinge bauen, die funktionieren."
        />

        <div class="section__body">
          <!-- 35 Jahre auf einen Blick, bevor man eine einzige Station liest. -->
          <CvYearAxis
            :stations="CV_STATIONS"
            :now-year="nowYear"
            :open-keys="openKeys"
            @select="focusStation"
          />

          <div class="stations__bar">
            <p class="stations__note">
              Stationen öffnen für Details
            </p>
            <button type="button" class="stations__all" @click="toggleAll">
              {{ allOpen ? 'Alle zuklappen' : 'Alle aufklappen' }}
            </button>
          </div>

          <CvTimeline
            :stations="CV_STATIONS"
            :open-keys="openKeys"
            :now-year="nowYear"
            @toggle="toggleStation"
          />
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ 02 KOMPETENZEN ═══════════════ -->
    <section id="kompetenzen" class="section section--bordered section--muted reveal">
      <UContainer>
        <SectionHead
          kicker="Kompetenzen"
          title="Was ich kann"
          lead="Eine Auswahl aus dem Kompetenzprofil — Schwerpunkte statt vollständiger Liste."
        />

        <div class="section__body">
          <SkillMeters :groups="CV_SKILL_GROUPS" />
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ 03 DATENBLATT ═══════════════ -->
    <!--
      Zertifikate, Ausbildung und Sprachen saßen bis 30.08.2026 INNERHALB der
      Kompetenzen-Sektion. Sie stehen jetzt eigenständig: Ohne eigene Sektion
      können sie kein eigenes Kapitel sein — und inhaltlich sind es Nachweise,
      keine Selbsteinschätzungen.
    -->
    <section id="datenblatt" class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="Nachweise"
          title="Datenblatt"
          lead="Was auf Papier steht: Zertifikate, Ausbildung und Sprachen."
        />

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
                  <NuxtLink
                    v-if="cert.story"
                    :to="cert.story.to"
                    class="datasheet__story"
                  >
                    {{ cert.story.label }}
                    <Icon name="lucide:arrow-right" class="size-3" />
                  </NuxtLink>
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
            <!--
              Ohne führende Spalte: Zertifikate und Ausbildung haben dort eine Jahreszahl,
              Sprachen hätten nur einen Platzhalterstrich. Eine Spalte, die in jeder Zeile
              dasselbe Zeichen zeigt, trägt keine Information.
            -->
            <ul class="datasheet__list datasheet__list--plain">
              <li
                v-for="lang in CV_LANGUAGES"
                :key="lang.name"
                class="datasheet__row"
                :class="{ 'datasheet__row--playful': lang.playful }"
              >
                <span>
                  <span class="datasheet__name">{{ lang.name }}</span>
                  <span class="datasheet__meta">
                    {{ lang.level }}
                    <!-- Der Shruggie hing vorher in der Strichspalte und wäre mit ihr
                         verschwunden; er steht jetzt hinter dem Niveau. -->
                    <span v-if="lang.playful" class="datasheet__shrug">¯\_(ツ)_/¯</span>
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ 04 PROJEKTE ═══════════════ -->
    <section id="projekte" class="section section--bordered section--muted reveal">
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
              <NuxtLink
                v-if="project.story"
                :to="project.story.to"
                class="project__story"
              >
                <span class="project__story-label">{{ project.story.label }}</span>
                <Icon name="lucide:arrow-right" class="project__story-icon size-3.5" />
              </NuxtLink>
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
        <p class="outro__label">
          Mein Motto. Es gilt nicht nur beim Laufen, sondern fürs ganze Leben
          <span class="outro__wink" aria-hidden="true">;-)</span>
        </p>

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
  /* `clip` statt `hidden`: `hidden` machte die Sektion zum Scroll-Container, und
     die mitlaufende Karstadt-Tafel (position: sticky) bliebe dann stehen. */
  overflow: clip;
  padding: clamp(3.5rem, 9vw, 6.5rem) 0 clamp(3rem, 6vw, 4.5rem);
  background:
    radial-gradient(85% 70% at 12% 0%, rgba(33, 164, 163, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

/*
 * ── Raster des Einstiegs ────────────────────────────────────────────────
 * Volle Containerbreite, 12 Spalten ab 1024 px. Block 1 (Text links, Tafel
 * rechts) und Block 3 (Tafel links, Text rechts) sind gespiegelt, der Lageplan
 * dazwischen läuft über alle Spalten. Darunter eine Spalte, die Tafeln stehen
 * dann jeweils hinter ihrem Text. Konzept: docs/ueber-mich-einstieg.md.
 */
.opening,
.running {
  display: grid;
  gap: clamp(2rem, 5vw, 3rem);
}

@media (min-width: 1024px) {
  .opening,
  .running {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: clamp(1.5rem, 3vw, 2.5rem);
    row-gap: 0;
  }

  .opening__head {
    grid-column: 1 / 8;
    grid-row: 1;
  }
  .opening__text {
    grid-column: 1 / 8;
    grid-row: 2;
    margin-top: clamp(2rem, 4vw, 3rem);
  }
  /* Bis zur Überschrift hochgezogen: Das Foto ist der erste Blickfang, nicht
     ein Anhängsel unter dem Text. */
  .opening__plate {
    grid-column: 9 / 13;
    grid-row: 1 / 3;
    align-self: start;
    margin-top: 0.5rem;
  }

  .running__plate {
    grid-column: 1 / 5;
    grid-row: 1;
    align-self: start;
    /* Klebt beim Lesen der langen Textspalte mit, statt oben allein zu stehen. */
    position: sticky;
    top: 6rem;
  }
  .running__text {
    grid-column: 6 / 13;
    grid-row: 1;
  }
}

/* Einspaltig: Tafeln nicht über die ganze Breite ziehen, ein Hochformat-Foto
   würde sonst mehr als einen Bildschirm füllen. */
@media (max-width: 1023px) {
  .opening__plate,
  .running__plate {
    max-width: 26rem;
  }
  .running__plate {
    order: 2;
  }
}

.intro__map {
  margin-block: clamp(3.5rem, 8vw, 6rem);
}

/* ── Typografie des Einstiegs ───────────────────────────────────────────── */
.intro__title {
  margin-top: 1.25rem;
  font-size: clamp(2.5rem, 7vw, 5rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

/* Die zweite Frage kippt in Kursive und Akzent — die Antwort steht im Text. */
.intro__title-turn {
  font-style: italic;
  font-weight: 500;
  color: var(--color-accent-300);
}

.intro__subtitle {
  margin-bottom: 0.5rem;
  font-size: clamp(1.875rem, 4vw, 2.75rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--color-steel-100);
}
.intro__subtitle-plus {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--color-accent-400);
}

.prose {
  display: grid;
  gap: 1.25rem;
  max-width: 42rem;
  font-size: var(--text-md);
  line-height: 1.75;
  color: var(--color-steel-200);
}

.prose__lead {
  font-size: var(--text-lg);
  line-height: 1.65;
  color: var(--color-steel-100);
}

/*
 * Der Wendepunkt der Geschichte, groß gesetzt. Kein wiederholtes Zitat: Der Satz
 * steht nur hier, die Hervorhebung ist reine Typografie.
 */
.prose__pull {
  margin-block: 0.75rem;
  padding-left: 1.25rem;
  border-left: 2px solid var(--color-accent-500);
  font-family: var(--font-display);
  font-size: clamp(1.375rem, 2.6vw, 1.75rem);
  font-style: italic;
  line-height: 1.35;
  color: var(--color-steel-100);
}

.prose--note {
  max-width: none;
  gap: 1rem;
  font-size: var(--text-base);
  line-height: 1.7;
}

.prose a {
  color: var(--color-steel-100);
  border-bottom: 1px solid var(--color-accent-500);
  transition: color 200ms ease, border-color 200ms ease;
}
.prose a:hover {
  color: var(--color-accent-300);
  border-bottom-color: var(--color-accent-300);
}

/* Eddys sichtbare Korrektur ("zwei Perserkatern") — durchgestrichen, aber lesbar. */
.prose del {
  color: var(--color-steel-500);
  text-decoration-color: var(--color-brass-400);
  text-decoration-thickness: 1.5px;
}

/* ── Auftritt beim Laden ────────────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  .opening__head,
  .opening__text,
  .opening__plate {
    animation: var(--animate-rise);
  }
  .opening__text {
    animation-delay: 120ms;
  }
  .opening__plate {
    animation-delay: 220ms;
  }
}

.intro__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

/* ── Fakten ─────────────────────────────────────────────────────────────── */
/* auto-fit statt fester Spaltenzahl: Die Leiste steht jetzt in der schmaleren
   Textspalte und muss sich selbst umbrechen, statt fünf Zellen zu quetschen. */
.facts {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  max-width: 52rem;
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}
/* Feste Spaltenzahl statt auto-fit: Bei fünf Fakten und automatischer
   Spaltenzahl blieb eine Zeile halb leer und die Rasterfläche schien durch. */
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

/* ── Kapitelübersicht ───────────────────────────────────────────────────── */
.intro__chapters {
  position: relative;
  z-index: 1;
  margin-top: clamp(2rem, 4vw, 2.75rem);
}

/* ── Sektionen als Sprungziele ──────────────────────────────────────────── */
/*
 * Header (4rem) + Sticky-Leiste (3rem) + Luft. Ohne das verschwindet die
 * Überschrift beim Ankersprung unter der Leiste. Ändert sich eine der beiden
 * Höhen, gehört dieser Wert mitgezogen — ebenso HEADER_PX/BAR_PX in
 * app/composables/useScrollSpy.ts.
 */
.section[id] {
  scroll-margin-top: 8rem;
}

/* ── Werkzeugleiste über den Stationen ──────────────────────────────────── */
.stations__bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--color-graphite-700);
}
/* Nebeneinander kollidierten Hinweis und Schalter bei 375 px: Der Hinweis brach
   zweizeilig um und schob sich unter den Schalter. Untereinander ist beides ruhig. */
@media (max-width: 560px) {
  .stations__bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

.stations__note {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-600);
}

.stations__all {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--color-steel-300);
  border-bottom: 1px solid var(--color-graphite-600);
  padding-bottom: 0.15rem;
  transition: color 200ms ease, border-color 200ms ease;
}
.stations__all:hover {
  color: var(--color-accent-300);
  border-bottom-color: var(--color-accent-500);
}

/* ── Datenblatt ─────────────────────────────────────────────────────────── */
/* Seit dem 30.08.2026 eine eigene Sektion: der frühere `border-top` war der
   Übergang INNERHALB der Kompetenzen — jetzt trennt die Sektionsgrenze selbst,
   und der Abstand folgt dem Rhythmus von .section__body. */
.datasheet {
  display: grid;
  gap: 2.5rem;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
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

/*
  Weiterführender Link an einem Nachweis. Zurückgenommen gesetzt: Das Datenblatt ist
  eine Nachweisliste und soll nicht zur Linksammlung werden, deshalb trägt aktuell nur
  das Make-Zertifikat einen Verweis.
*/
.datasheet__story {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.4rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  color: var(--color-accent-400);
  border-bottom: 1px solid transparent;
  transition: color 200ms ease, border-color 200ms ease;
}
.datasheet__story:hover {
  color: var(--color-accent-300);
  border-bottom-color: var(--color-accent-500);
}

/* Sprachen: einspaltig, weil die Jahresspalte dort nichts zu zeigen hätte. */
.datasheet__list--plain .datasheet__row {
  grid-template-columns: 1fr;
  gap: 0;
}

.datasheet__row--playful .datasheet__name {
  color: var(--color-brass-300);
}

.datasheet__shrug {
  margin-left: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  white-space: nowrap;
  color: var(--color-brass-400);
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

/*
 * Beitrag zum Projekt — bewusst leiser als .project__link: Mono, klein, gesperrt.
 * Der Projektname bleibt die erste Ebene, die Geschichte ist die Fußnote dazu.
 */
.project__story {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.85rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-steel-500);
  transition: color 200ms ease;
}
.project__story-label {
  border-bottom: 1px solid var(--color-graphite-700);
  padding-bottom: 0.15rem;
  transition: border-color 200ms ease;
}
.project__story-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.project__story:hover {
  color: var(--color-accent-400);
}
.project__story:hover .project__story-label {
  border-color: var(--color-accent-400);
}
.project__story:hover .project__story-icon {
  translate: 0.2rem 0;
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

/*
  Kleine Einordnung über dem Zitat. Bewusst zurückgenommen in Mono: Sie sagt, was das
  Zitat ist, und soll ihm nicht die Aufmerksamkeit nehmen.
*/
.outro__label {
  margin-inline: auto;
  margin-bottom: 1.25rem;
  max-width: 30rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.6;
  letter-spacing: 0.06em;
  color: var(--color-steel-500);
}

/* Zwinkersmiley nicht umbrechen lassen, sonst steht die Klammer allein in der Zeile. */
.outro__wink {
  white-space: nowrap;
  color: var(--color-brass-400);
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
