<script setup lang="ts">
/**
 * Die Werkbank: Eddys Arbeit mit KI und Automatisierung.
 *
 * Konzept, Quellen und die Begründung für jede Zahl stehen in `docs/werkbank.md`.
 * Die Inhalte selbst liegen als Konstanten in `app/utils/werkbank.ts` — diese Seite
 * ist ein reiner Orchestrator ohne eigene Datenbeschaffung.
 *
 * ── Design-Richtung ────────────────────────────────────────────────────────────
 * Fortsetzung von „Präzisionswerk“, aber im Modus Innenansicht: `/ueber-mich` zeigt
 * das Zifferblatt, die Werkbank zeigt das offene Werk. Konkret heißt das hier:
 *
 * - Mono trägt mehr als sonst. JetBrains Mono setzt ganze Datenblöcke, nicht nur Labels.
 * - Die Kette ist das Leitmotiv: Knoten auf einer Linie statt Karten im Raster.
 * - Teal führt (die Maschine), Messing tritt genau einmal auf (das Papier des Buches).
 * - Das Faksimile ist die einzige helle Fläche der ganzen Site. Maximaler Kontrast an
 *   genau einer Stelle, damit ein Moment hängen bleibt.
 */
const maxCommits = Math.max(...WERKBANK_BUILDS.map(build => build.commits))
const maxModules = Math.max(...WERKBANK_SZENARIEN.map(scenario => scenario.modules))

/**
 * Lightbox für den Screenshot. Natives `<dialog>` statt eigener Overlay-Logik: bringt
 * Fokusfalle, Escape-Taste und Backdrop mit, ohne dass die Seite das nachbauen muss.
 */
const shotDialog = useTemplateRef<HTMLDialogElement>('shotDialog')

const title = 'Werkbank — Eduard Andrae'
const description
  = 'Wie ich trusted blogs mit KI neu gebaut habe: Zahlen aus dem Repository, 19 Make-Szenarien '
    + 'und die Stellen, an denen es geklemmt hat.'

const { url: siteUrl } = useSiteConfig()

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  ogSiteName: 'Eduard Andrae',
  ogUrl: `${siteUrl}/werkbank`,
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
    <!-- ═══════════════ INTRO ═══════════════ -->
    <section class="intro">
      <UContainer>
        <p class="kicker">
          <span class="intro__mark" aria-hidden="true" />Werkbank
        </p>

        <!--
          Beide Zeilen bleiben je für sich ungebrochen, solange die Breite reicht
          (`.intro__line`). Ein hartes `nowrap` wäre hier falsch: „Ohne eine Zeile Code
          selbst zu schreiben." passt bei 390px in keine Zeile und würde die Seite
          seitlich aufschieben.
        -->
        <h1 class="intro__title">
          <span class="intro__line">Eine Plattform, neu gebaut.</span>
          <span class="intro__line">Ohne eine Zeile Code selbst zu schreiben.</span>
        </h1>

        <div class="intro__text">
          <p>
            Zwischen Februar und Mai 2026 habe ich trusted blogs vollständig neu gebaut.
            Nicht als Umbau des alten Systems, sondern von Grund auf, mit Claude Code als
            Werkzeug. Seitdem kommen laufend neue Funktionen hinzu. Dazu neunzehn
            Make-Szenarien, die inzwischen den größten Teil der Arbeit übernehmen, die ich
            zuvor von Hand gemacht habe.
          </p>
          <p>
            Was hier steht, sind Zahlen aus dem Repository und aus Make. Der Stand ist der
            {{ WERKBANK_STICHTAG }}.
          </p>
        </div>

        <!--
          Das Faksimile. Einziger heller Block der Seite und bewusst früh gesetzt: Der
          stärkste Beleg kommt von außen, nicht von mir. Als Buchseite gesetzt statt als
          Screenshot der PDF-Seite, damit die Typografie zur Seite gehört und mitskaliert.
        -->
        <figure class="folio reveal">
          <blockquote class="folio__sheet" :cite="WERKBANK_ZITAT.url">
            <!-- Der Bund einer aufgeschlagenen Seite, links an der Kante. -->
            <span class="folio__gutter" aria-hidden="true" />
            <!--
              Großes Anführungszeichen als Wasserzeichen, rein dekorativ.
              Bewusst das SCHLIESSENDE deutsche Zeichen (U+201C): Es sitzt auf
              Versalhöhe und steht damit oben richtig. Das öffnende „ liegt auf der
              Grundlinie und sieht hier oben verkehrt herum aus.
            -->
            <span class="folio__mark" aria-hidden="true">“</span>

            <p class="folio__heading">
              {{ WERKBANK_ZITAT.heading }}
            </p>
            <p class="folio__body">
              „{{ WERKBANK_ZITAT.body }}“
            </p>
            <span class="folio__page" aria-hidden="true">175</span>
          </blockquote>

          <figcaption class="folio__credit">
            <span class="folio__author">{{ WERKBANK_ZITAT.author }}</span>
            <a
              :href="WERKBANK_ZITAT.url"
              target="_blank"
              rel="noopener noreferrer"
              class="folio__work"
            >
              {{ WERKBANK_ZITAT.work }}
              <Icon name="lucide:arrow-up-right" class="size-3.5" />
            </a>
            <span class="folio__detail">{{ WERKBANK_ZITAT.detail }}</span>
          </figcaption>
        </figure>
      </UContainer>
    </section>

    <!-- ═══════════════ 01 · DER NEUBAU ═══════════════ -->
    <section class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="01 · Der Neubau"
          title="Was da eigentlich gebaut wurde"
        >
          <template #lead>
            Manfred Wolff beschreibt die Plattform
            <a
              href="https://mwolff.org/whitepapers"
              target="_blank"
              rel="noopener noreferrer"
              class="textlink"
            >in seinem Buch</a>
            genauer, als ich es über mein eigenes Produkt täte. Deshalb hier seine Worte.
          </template>
        </SectionHead>

        <div class="section__body">
          <blockquote class="pull">
            <p>{{ WERKBANK_KOMPLEXITAET.quote }}</p>
            <cite class="pull__source">{{ WERKBANK_KOMPLEXITAET.page }}</cite>
          </blockquote>

          <p class="prose">
            Die Plattform gibt es seit 2015. Was heute läuft, ist kein weiterentwickelter
            Altbestand, sondern ein kompletter Neubau. Der Vergleich der beiden
            Repositories zeigt, was das heißt.
          </p>

          <!-- Balkenvergleich: Länge IMMER aus commits gerechnet, nie gepflegt. -->
          <ul class="builds">
            <li
              v-for="build in WERKBANK_BUILDS"
              :key="build.label"
              class="build"
              :class="{ 'build--current': build.current }"
            >
              <div class="build__head">
                <span class="build__label">{{ build.label }}</span>
                <span class="build__period">{{ build.period }}</span>
              </div>

              <div class="build__track">
                <span
                  class="build__bar"
                  :style="{ width: `${barWidth(build.commits, maxCommits)}%` }"
                />
              </div>

              <div class="build__figures">
                <span class="build__commits">{{ build.commits.toLocaleString('de-DE') }} Commits</span>
                <span class="build__months">
                  in {{ build.months }} {{ build.months === 1 ? 'Monat' : 'Monaten' }}
                </span>
              </div>
            </li>
          </ul>

          <dl class="metrics">
            <div v-for="metric in WERKBANK_NEUBAU_METRIKEN" :key="metric.label" class="metric">
              <dt class="metric__value" :class="{ 'metric__value--accent': metric.accent }">
                {{ metric.value }}
              </dt>
              <dd class="metric__label">
                {{ metric.label }}
              </dd>
            </div>
          </dl>

          <p class="prose">
            Die Zahl, auf die es mir ankommt, ist die letzte: 103 Dokumente. Der Neubau
            besteht nicht nur aus Code, sondern zu einem guten Teil aus aufgeschriebenen
            Regeln, Konzepten und Fehlerprotokollen. Ohne die schreibt eine KI munter
            weiter, was sie für richtig hält.
          </p>

          <h3 class="sub">
            Den Anfang habe ich mir nicht selbst gebaut
          </h3>

          <p class="prose">
            Das Schwierigste war der Start. Dabei hat mich
            <a
              href="https://www.linkedin.com/in/hardy-kutzer/"
              target="_blank"
              rel="noopener noreferrer"
              class="textlink"
            >Hardy Kutzer</a>
            unterstützt, und zwar in den ersten Tagen im Februar 2026. Er hat nicht
            mitprogrammiert. Er hat
            das Gerüst gestellt: die Bau- und Ausliefer-Strecke, die Prüfungen, die bei
            jedem Push laufen, und die Regelwerke, nach denen Claude in diesem Projekt
            arbeitet. Von seinen 112 Beiträgen liegen fast alle in diesen ersten Tagen. Die
            restlichen 2.450 sind dann meine gewesen.
          </p>

          <p class="prose">
            Das halte ich für den entscheidenden Teil der Geschichte.
            <a
              href="https://www.linkedin.com/in/manfred-wolff-2a7a224/"
              target="_blank"
              rel="noopener noreferrer"
              class="textlink"
            >Manfred</a>
            schreibt in seinem Buch, KI-Werkzeuge in ungeübten Händen seien gefährlich,
            weil ein Modell plausiblen Code schneller produziert, als eine unerfahrene
            Person ihn prüfen kann. Das stimmt. Meine Antwort darauf war, mir für die
            Leitplanken jemanden zu holen, der sie bauen kann. Danke, Hardy!
          </p>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ 02 · DIE MASCHINEN ═══════════════ -->
    <section class="section section--bordered section--muted reveal">
      <UContainer>
        <SectionHead
          kicker="02 · Die Maschinen"
          title="Neunzehn Szenarien, die ihre Arbeit alleine machen"
          lead="Make verbindet Dienste zu Ketten. Eine Zeile in einer Tabelle löst aus, und am Ende steht ein fertiger Beitrag auf vier Netzwerken."
        />

        <div class="section__body">
          <dl class="metrics">
            <div v-for="metric in WERKBANK_MAKE_METRIKEN" :key="metric.label" class="metric">
              <dt class="metric__value" :class="{ 'metric__value--accent': metric.accent }">
                {{ metric.value }}
              </dt>
              <dd class="metric__label">
                {{ metric.label }}
              </dd>
            </div>
          </dl>

          <WerkbankChain class="chain-block" />

          <!--
            Die Vitrine erscheint nur, wenn der Screenshot wirklich im Repo liegt
            (`WERKBANK_SCREENSHOT`). Sonst bliebe hier eine 404-Lücke im Layout stehen.
          -->
          <figure v-if="WERKBANK_SCREENSHOT" class="vitrine">
            <button
              type="button"
              class="vitrine__trigger"
              @click="shotDialog?.showModal()"
            >
              <span class="case">
                <NuxtImg
                  :src="WERKBANK_SCREENSHOT.src"
                  :alt="WERKBANK_SCREENSHOT.alt"
                  :width="WERKBANK_SCREENSHOT.width"
                  :height="WERKBANK_SCREENSHOT.height"
                  format="webp"
                  quality="82"
                  loading="lazy"
                  class="vitrine__shot"
                />
                <span class="case__glass" aria-hidden="true" />
                <span class="case__fittings" aria-hidden="true" />
              </span>
              <span class="vitrine__zoom">
                <Icon name="lucide:maximize-2" class="size-3.5" />
                Vergrößern
              </span>
            </button>

            <figcaption class="vitrine__caption">
              So sieht das Szenario „Promotion erstellen“ wirklich aus. 115 Module in einer
              Kette, verdrahtet ohne eine Zeile Code.
            </figcaption>
          </figure>

          <!-- Szenarientabelle: die fünf größten, nicht alle 19. -->
          <div class="table-scroll">
            <table class="scenarios">
              <caption class="scenarios__caption">
                Drei der neunzehn Szenarien, Stand {{ WERKBANK_STICHTAG }}
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    Szenario
                  </th>
                  <th scope="col" class="scenarios__num">
                    Module
                  </th>
                  <th scope="col" class="scenarios__num">
                    Läufe
                  </th>
                  <th scope="col" class="scenarios__num">
                    Operationen
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="scenario in WERKBANK_SZENARIEN" :key="scenario.name">
                  <th scope="row" class="scenarios__name">
                    {{ scenario.name }}
                    <span
                      class="scenarios__bar"
                      :style="{ width: `${barWidth(scenario.modules, maxModules)}%` }"
                      aria-hidden="true"
                    />
                  </th>
                  <td class="scenarios__num scenarios__num--strong">
                    {{ scenario.modules }}
                  </td>
                  <td class="scenarios__num">
                    {{ scenario.runs.toLocaleString('de-DE') }}
                  </td>
                  <td class="scenarios__num">
                    {{ scenario.operations.toLocaleString('de-DE') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="sub">
            Das Werkzeugregal
          </h3>

          <ul class="tools">
            <li v-for="tool in WERKBANK_WERKZEUGE" :key="tool.name" class="tool">
              <span class="tool__name">{{ tool.name }}</span>
              <span class="tool__role">{{ tool.role }}</span>
            </li>
          </ul>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ 03 · WO ES KLEMMTE ═══════════════ -->
    <section class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="03 · Wo es klemmte"
          title="Drei Sachen, die ich falsch gemacht habe"
          lead="Im Projekt läuft ein Dokument mit, in dem nach jeder größeren Runde steht, was schiefgegangen ist. Drei Einträge daraus, übersetzt."
        />

        <div class="section__body">
          <ol class="lessons">
            <li v-for="(lesson, i) in WERKBANK_LEKTIONEN" :key="lesson.title" class="lesson">
              <span class="lesson__num">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="lesson__main">
                <h3 class="lesson__title">
                  {{ lesson.title }}
                </h3>
                <p class="lesson__text">
                  {{ lesson.text }}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ 04 · DIESE SEITE ═══════════════ -->
    <section class="section section--bordered section--muted reveal">
      <UContainer>
        <SectionHead
          kicker="04 · Diese Seite"
          title="Und dann ist da noch diese Seite hier"
          lead="Gemeint ist die Seite, auf der dieser Satz steht: eduard-andrae.de. Auch sie ist mit Claude Code entstanden, und sie ist das einzige der drei Beispiele, das sich ohne Umweg ansehen lässt."
        />

        <div class="section__body">
          <dl class="metrics">
            <div v-for="metric in WERKBANK_SITE_METRIKEN" :key="metric.label" class="metric">
              <dt class="metric__value" :class="{ 'metric__value--accent': metric.accent }">
                {{ metric.value }}
              </dt>
              <dd class="metric__label">
                {{ metric.label }}
              </dd>
            </div>
          </dl>

          <p class="prose">
            Das Zifferblatt auf der Seite „Über mich", die Bilderwand auf der Startseite,
            die Zeichnung weiter oben und das Papier, auf dem Manfreds Zitat steht: alles
            in diesem Browserfenster ist so entstanden. Darunter liegen Nuxt 4, Tailwind
            und TypeScript, dazu der Blog, der weiter in WordPress wohnt und über eine
            Schnittstelle hereinkommt. Ich kann diesen Code lesen und beurteilen.
            Schreiben kann ich ihn nicht, und ich muss es auch nicht.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ DIE LEISE TÜR ═══════════════ -->
    <section class="outro reveal">
      <UContainer>
        <p class="outro__lead">
          Immer wieder fragt mich jemand, wie ich das gemacht habe. Für
          <a
            href="https://www.trusted-blogs.com/hilfe/das-team"
            target="_blank"
            rel="noopener noreferrer"
            class="outro__link-inline"
          >Carsten Meyer-Heder</a>
          habe ich aufgeschrieben, wie man sich dieselbe Umgebung einrichtet. Fünfzig
          Minuten, Klick für Klick, ohne Kommandozeile. Die Anleitung stelle ich gern allen
          zur Verfügung.
        </p>

        <div class="outro__actions">
          <a
            :href="WERKBANK_WERKZEUGKASTEN_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="outro__button"
          >
            Den Werkzeugkasten ansehen
            <Icon name="lucide:arrow-up-right" class="outro__button-icon size-4" />
          </a>

          <NuxtLink to="/kontakt" class="outro__link">
            Oder einfach fragen
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <!--
      Lightbox: liegt außerhalb der Sektionen, damit sie nicht von deren
      `transform`/`filter` eingefangen wird. Ein `<dialog>` in einem transformierten
      Vorfahren verliert seine Positionierung am Viewport.
    -->
    <dialog v-if="WERKBANK_SCREENSHOT" ref="shotDialog" class="shot" @click="shotDialog?.close()">
      <NuxtImg
        :src="WERKBANK_SCREENSHOT.src"
        :alt="WERKBANK_SCREENSHOT.alt"
        :width="WERKBANK_SCREENSHOT.width"
        :height="WERKBANK_SCREENSHOT.height"
        format="webp"
        quality="88"
        class="shot__img"
      >
        <p class="shot__hint">
          Klicken oder Escape zum Schließen
        </p>
      </nuxtimg>
    </dialog>
  </div>
</template>

<style scoped>
/* ── Intro ──────────────────────────────────────────────────────────────────── */
.intro {
  position: relative;
  padding: clamp(3.5rem, 9vw, 6.5rem) 0 clamp(3rem, 7vw, 5rem);
  border-bottom: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(68% 120% at 18% 8%, rgba(33, 164, 163, 0.09) 0%, transparent 60%),
    var(--color-graphite-950);
}

.intro__mark {
  width: 2rem;
  height: 2px;
  background: var(--color-accent-400);
}

.intro__title {
  margin-top: 1.25rem;
  font-size: clamp(1.9rem, 4.2vw, 3.1rem);
  line-height: 1.12;
  color: var(--color-steel-100);
}

/*
  Jede Zeile der Überschrift ein eigener Block: Damit steht der Umbruch zwischen den
  beiden Sätzen fest, ohne dass ein <br> mitten im Text hängt — und jede Zeile darf
  für sich umbrechen, wenn der Platz nicht reicht. `text-wrap: balance` verteilt einen
  solchen Umbruch dann gleichmäßig, statt ein einzelnes Wort abzuhängen.
*/
.intro__line {
  display: block;
  text-wrap: balance;
}

.intro__text {
  margin-top: 1.75rem;
  max-width: 38rem;
  display: grid;
  gap: 1.15rem;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-300);
}

/* ── Das Faksimile ──────────────────────────────────────────────────────────── */
/*
  Die einzige helle Fläche der ganzen Website. Bewusst kein Kasten im Seitenstil,
  sondern eine Buchseite: warmer Papierton, Serifenschrift, Seitenzahl am Fuß. Der
  Kontrastbruch ist der Punkt — er markiert, dass hier jemand anderes spricht.
*/
.folio {
  margin: clamp(2.75rem, 6vw, 4.5rem) 0 0;
  max-width: 44rem;
}

.folio__sheet {
  position: relative;
  overflow: hidden;
  margin: 0;
  /* Links mehr Innenabstand als rechts: Der Bund braucht Platz, sonst klebt der Text daran. */
  padding: clamp(2rem, 4.5vw, 3rem) clamp(1.75rem, 4vw, 3.25rem) clamp(2.75rem, 5vw, 3.5rem)
    clamp(2.5rem, 5.5vw, 4.25rem);
  background: #f2ece1;
  color: #221f1a;
  border: 1px solid var(--color-brass-500);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12) inset,
    0 26px 60px rgba(8, 9, 11, 0.6);
}

/*
  Der Bund: ein schmaler Schattenverlauf an der linken Kante, wie er entsteht, wenn eine
  Seite zur Bindung hin gewölbt ist. Macht aus der Fläche eine aufgeschlagene Seite,
  ohne dass ein Bild nötig wäre.
*/
.folio__gutter {
  position: absolute;
  inset: 0 auto 0 0;
  width: clamp(1rem, 2.5vw, 1.75rem);
  pointer-events: none;
  background: linear-gradient(
    to right,
    rgba(70, 58, 40, 0.22) 0%,
    rgba(70, 58, 40, 0.08) 45%,
    transparent 100%
  );
}

/*
  Das Anführungszeichen als Wasserzeichen. Sehr groß, sehr schwach, halb aus dem Satzspiegel
  geschoben — es soll das Zitat markieren, nicht mit ihm um Aufmerksamkeit streiten. Der
  echte Zitatanfang steht trotzdem als Zeichen im Text, damit er auch vorgelesen wird.
*/
.folio__mark {
  position: absolute;
  /* Knapp unter die Oberkante, damit es die erste Textzeile nicht hinterlegt. */
  top: -0.06em;
  right: 0.14em;
  font-family: var(--font-display);
  font-size: clamp(6rem, 13vw, 9.5rem);
  line-height: 1;
  color: rgba(120, 100, 66, 0.11);
  user-select: none;
}

.folio__heading {
  position: relative;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(1.35rem, 2.6vw, 1.75rem);
  line-height: 1.25;
  color: #14120f;
}

.folio__body {
  position: relative;
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: var(--text-md);
  line-height: 1.66;
  /* Etwas weicher als die Überschrift, wie Buchsatz auf getöntem Papier. */
  color: #3a352c;
}

/* Seitenzahl unten mittig, wie im Buch. */
.folio__page {
  position: absolute;
  bottom: 1.15rem;
  left: 50%;
  translate: -50% 0;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  letter-spacing: 0.18em;
  color: #8a8070;
}

.folio__credit {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
}

.folio__author {
  color: var(--color-steel-200);
}

.folio__work {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-brass-300);
  border-bottom: 1px solid var(--color-brass-500);
  padding-bottom: 0.15rem;
  transition: color 200ms ease, border-color 200ms ease;
}
.folio__work:hover {
  color: var(--color-brass-400);
  border-color: var(--color-brass-300);
}

.folio__detail {
  color: var(--color-steel-600);
}

/* ── Sektionsrahmen ─────────────────────────────────────────────────────────── */
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
  margin-top: clamp(2rem, 4vw, 3rem);
  display: grid;
  gap: clamp(2rem, 4vw, 2.75rem);
}

/*
  Grid-Items haben `min-width: auto` und schrumpfen deshalb NICHT unter die Breite
  ihres Inhalts. Ohne diese Zeile sprengen die beiden bewusst breiten Blöcke (die
  Tabelle mit `min-width: 34rem`, die Kette mit 38rem) ihre Spalte und schieben die
  ganze Seite seitlich auf — ihr eigenes `overflow-x: auto` greift dann nie, weil das
  Grid-Item selbst mitwächst. Genau dieser Überlauf war auf dem Handy sichtbar.
*/
.section__body > * {
  min-width: 0;
}

.prose {
  max-width: 38rem;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-300);
}

/*
  Link mitten im Fließtext. Bewusst über eine eigene Klasse statt über `.prose a`:
  Der Sektionskopf nutzt ihn auch, und dort greift `.prose` nicht.
*/
.textlink {
  color: var(--color-steel-100);
  border-bottom: 1px solid var(--color-accent-600);
  padding-bottom: 0.05rem;
  transition: color 200ms ease, border-color 200ms ease;
}
.textlink:hover {
  color: var(--color-accent-300);
  border-bottom-color: var(--color-accent-400);
}

.sub {
  margin-top: clamp(0.5rem, 2vw, 1rem);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent-300);
}

/* ── Zitatblock im Fließtext ────────────────────────────────────────────────── */
.pull {
  margin: 0;
  max-width: 40rem;
  padding-left: clamp(1.25rem, 3vw, 2rem);
  border-left: 2px solid var(--color-accent-700);
  font-family: var(--font-display);
  font-size: var(--text-md);
  line-height: 1.62;
  color: var(--color-steel-200);
}

.pull__source {
  display: block;
  margin-top: 0.85rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-style: normal;
  letter-spacing: 0.14em;
  color: var(--color-steel-600);
}

/* ── Balkenvergleich ────────────────────────────────────────────────────────── */
.builds {
  display: grid;
  gap: 1.75rem;
  max-width: 46rem;
}

.build__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
}

.build__label {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-steel-200);
}

.build__period,
.build__months {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
  color: var(--color-steel-600);
}

.build__track {
  margin-top: 0.85rem;
  height: 10px;
  background: var(--color-graphite-800);
  border: 1px solid var(--color-graphite-700);
}

.build__bar {
  display: block;
  height: 100%;
  background: var(--color-graphite-600);
}

/* Der Neubau ist der Punkt der Grafik und bekommt als einziger die Akzentfarbe. */
.build--current .build__bar {
  background: var(--color-accent-500);
}

.build__figures {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
}

.build__commits {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-300);
}

.build--current .build__commits {
  color: var(--color-accent-300);
}

/* ── Kennzahlenleiste ───────────────────────────────────────────────────────── */
.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}
@media (min-width: 780px) {
  .metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.metric {
  padding: clamp(1.15rem, 2.5vw, 1.65rem);
  background: var(--color-graphite-900);
}

.section--muted .metric {
  background: var(--color-graphite-950);
}

.metric__value {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.4vw, 2.25rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--color-steel-100);
}

.metric__value--accent {
  color: var(--color-accent-400);
}

.metric__label {
  margin-top: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--color-steel-500);
}

/* ── Kette ──────────────────────────────────────────────────────────────────── */
.chain-block {
  padding: clamp(1.25rem, 3vw, 2rem) 0;
  border-block: 1px solid var(--color-graphite-800);
}

/* ── Vitrine ────────────────────────────────────────────────────────────────── */
.vitrine {
  margin: 0;
}

.vitrine__trigger {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
  text-align: left;
}

.case {
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-900);
}

.vitrine__shot {
  display: block;
  width: 100%;
  height: auto;
  /*
    Der Make-Screenshot ist hell und violett und damit die zweite große helle Fläche der
    Seite. Das Buch-Faksimile soll die auffälligste bleiben, deshalb liegt der Screenshot
    im Ruhezustand spürbar gedämpft und geht erst beim Überfahren oder bei Tastaturfokus
    auf die volle Helligkeit. Weiter abdunkeln geht nicht: Ein Beweisstück, das man
    zurechtretuschiert, ist keines mehr.
  */
  filter: saturate(0.7) brightness(0.82);
  transition: filter 400ms ease;
}

.vitrine__trigger:hover .vitrine__shot,
.vitrine__trigger:focus-visible .vitrine__shot {
  filter: saturate(1) brightness(1);
}

/* Lichtreflex über dem Glas, wandert beim Überfahren. Bauart wie auf /1apreis. */
.case__glass {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -40%;
  width: 180%;
  pointer-events: none;
  background: linear-gradient(
    104deg,
    transparent 38%,
    rgba(255, 255, 255, 0.08) 46%,
    rgba(255, 255, 255, 0.02) 52%,
    transparent 60%
  );
  transform: translateX(-10%);
  transition: transform 1100ms cubic-bezier(0.16, 1, 0.3, 1);
}

.vitrine__trigger:hover .case__glass,
.vitrine__trigger:focus-within .case__glass {
  transform: translateX(10%);
}

/* Vier Messing-Winkel als acht Hintergrund-Layer statt vier zusätzlicher Elemente. */
.case__fittings {
  --fitting: 0.85rem;

  position: absolute;
  inset: -1px;
  pointer-events: none;
  background-image:
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500)),
    linear-gradient(var(--color-brass-500), var(--color-brass-500));
  background-repeat: no-repeat;
  background-size:
    var(--fitting) 1px, 1px var(--fitting),
    var(--fitting) 1px, 1px var(--fitting),
    var(--fitting) 1px, 1px var(--fitting),
    var(--fitting) 1px, 1px var(--fitting);
  background-position:
    0 0, 0 0,
    100% 0, 100% 0,
    0 100%, 0 100%,
    100% 100%, 100% 100%;
}

.vitrine__zoom {
  margin-top: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-500);
  transition: color 200ms ease;
}

.vitrine__trigger:hover .vitrine__zoom {
  color: var(--color-accent-400);
}

.vitrine__caption {
  margin-top: 1rem;
  max-width: 34rem;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-steel-500);
}

/* ── Lightbox ───────────────────────────────────────────────────────────────── */
.shot {
  margin: auto;
  max-width: min(96vw, 1600px);
  max-height: 92vh;
  padding: 0;
  border: 1px solid var(--color-graphite-600);
  background: var(--color-graphite-950);
  color: var(--color-steel-400);
  overflow: auto;
  cursor: zoom-out;
}

.shot::backdrop {
  background: rgba(8, 9, 11, 0.88);
}

.shot__img {
  display: block;
  width: 100%;
  height: auto;
}

.shot__hint {
  padding: 0.85rem 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-align: center;
  color: var(--color-steel-600);
}

/* ── Szenarientabelle ───────────────────────────────────────────────────────── */
/* Tabellen dürfen waagerecht scrollen, der Seitenkörper nicht (Regel aus main.css). */
.table-scroll {
  overflow-x: auto;
}

.scenarios {
  width: 100%;
  min-width: 34rem;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.scenarios__caption {
  margin-bottom: 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-align: left;
  color: var(--color-steel-600);
}

.scenarios th,
.scenarios td {
  padding: 0.9rem 1rem 0.9rem 0;
  text-align: left;
  border-bottom: 1px solid var(--color-graphite-800);
}

.scenarios thead th {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-600);
  border-bottom-color: var(--color-graphite-700);
}

.scenarios__name {
  position: relative;
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-steel-200);
}

/*
  Der Balken liegt als dünne Linie am unteren Rand der Zeile, nicht als eigene Spalte:
  So bleibt die Tabelle schmal genug fürs Handy und der Größenvergleich trotzdem sichtbar.
*/
.scenarios__bar {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 2px;
  background: var(--color-accent-700);
}

.scenarios__num {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-align: right;
  color: var(--color-steel-400);
}

.scenarios__num--strong {
  color: var(--color-accent-300);
}

/* ── Werkzeugregal ──────────────────────────────────────────────────────────── */
.tools {
  border-top: 1px solid var(--color-graphite-700);
}

.tool {
  display: grid;
  gap: 0.3rem 2rem;
  padding: 1.15rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}
@media (min-width: 720px) {
  .tool {
    grid-template-columns: 13rem minmax(0, 1fr);
    align-items: baseline;
  }
}

.tool__name {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.06em;
  color: var(--color-accent-300);
}

.tool__role {
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-steel-300);
}

/* ── Lektionen ──────────────────────────────────────────────────────────────── */
.lessons {
  display: grid;
  gap: 1px;
  background: var(--color-graphite-700);
  border: 1px solid var(--color-graphite-700);
}

/*
  Drei Spalten, seit es drei Lektionen sind. Bei zwei Spalten stünde die dritte allein
  in einer zweiten Reihe und läse sich wie ein Nachtrag. Die Schwelle liegt bei 1040px,
  weil eine Spalte darunter zu schmal für den Fließtext wird; dazwischen und darunter
  steht alles untereinander.
*/
@media (min-width: 1040px) {
  .lessons {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.lesson {
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
  gap: 0 1rem;
  padding: clamp(1.35rem, 3vw, 2rem);
  background: var(--color-graphite-900);
}

.lesson__num {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-accent-600);
  font-variant-numeric: tabular-nums;
}

.lesson__title {
  font-family: var(--font-display);
  font-size: var(--text-md);
  line-height: 1.3;
  color: var(--color-steel-100);
}

.lesson__text {
  margin-top: 0.75rem;
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--color-steel-400);
}

/* ── Die leise Tür ──────────────────────────────────────────────────────────── */
.outro {
  border-top: 1px solid var(--color-graphite-700);
  padding: clamp(3.5rem, 8vw, 6rem) 0;
  background:
    radial-gradient(70% 130% at 82% 40%, rgba(33, 164, 163, 0.1) 0%, transparent 62%),
    var(--color-graphite-900);
}

.outro__lead {
  max-width: 36rem;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.4vw, 1.6rem);
  line-height: 1.45;
  color: var(--color-steel-200);
}

/*
  Link im großen Fraunces-Satz des Schlussabsatzes. Eigene Regel statt `.textlink`:
  Bei dieser Schriftgröße braucht die Unterlinie mehr Abstand, sonst schneidet sie
  durch die Unterlängen von „y“ und „g“.
*/
.outro__link-inline {
  color: var(--color-steel-100);
  text-decoration: underline;
  text-decoration-color: var(--color-accent-600);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.28em;
  transition: color 200ms ease, text-decoration-color 200ms ease;
}
.outro__link-inline:hover {
  color: var(--color-accent-300);
  text-decoration-color: var(--color-accent-400);
}

.outro__actions {
  margin-top: clamp(2rem, 4vw, 2.75rem);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
}

.outro__button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-accent-500);
  background: var(--color-accent-500);
  padding: 1.05rem 2rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  /* Dunkle Schrift auf Teal: 6,30:1. Weiß käme nur auf 3,04:1. */
  color: var(--color-graphite-950);
  transition: background 250ms ease, border-color 250ms ease;
}
.outro__button:hover {
  border-color: var(--color-accent-300);
  background: var(--color-accent-300);
}

.outro__button-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.outro__button:hover .outro__button-icon {
  translate: 0.2rem -0.2rem;
}

.outro__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-400);
  border-bottom: 1px solid var(--color-graphite-600);
  padding-bottom: 0.35rem;
  transition: color 200ms ease, border-color 200ms ease;
}
.outro__link:hover {
  color: var(--color-accent-400);
  border-color: var(--color-accent-500);
}
</style>
