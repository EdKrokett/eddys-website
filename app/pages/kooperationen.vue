<script setup lang="ts">
/**
 * Kooperationen: Bedingungen, Referenzen, Media-Kit und Buchung über trusted blogs.
 *
 * Übernommen von blog.eduard-andrae.de/kooperationen/. Herkunft, Entscheidungen und
 * Q1–Q6 stehen in `docs/kooperationen.md`, die Inhalte in `app/utils/kooperationen.ts`.
 *
 * ── Design-Richtung ────────────────────────────────────────────────────────────
 * „Präzisionswerk“, Modus Auftragsannahme: die Theke der Werkstatt.
 *
 * - Die drei Bedingungen sind ein Prüfprotokoll: nummerierte Zeilen, Index-Häkchen.
 * - Die Referenzen sind ausgeführte Arbeiten: Bildstreifen, Jahreszahl in Mono.
 * - Der Buchungslink sitzt auf einem Auftragsschein mit Abrisskante. Das ist das eine
 *   auffällige Element der Seite; Katalog-Nr. 76 ist die Auftragsnummer.
 * - Nur Teal. Messing gehört auf `/werkbank` dem Ausgestellten.
 */

/**
 * `#mediakit` und `#trustedblogsbuchung` sind die Anker der alten WordPress-Seite und
 * werden von außen verlinkt. Das Composable hält den Direktsprung auf dem Ziel, während
 * die Schriften nachladen (Begründung in `app/composables/useAnchorScroll.ts`).
 */
useAnchorScroll()

const title = 'Kooperationen — Eduard Andrae'
const description
  = 'Kooperationen mit Eduard Andrae: unter welchen Bedingungen, wie die Beiträge aussehen, '
    + 'das Media-Kit und die direkte Buchung über trusted blogs.'

const { url: siteUrl } = useSiteConfig()

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogSiteName: 'Eduard Andrae',
  ogUrl: `${siteUrl}/kooperationen`,
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
    <section class="top">
      <UContainer>
        <p class="kicker top__kicker">
          <span class="top__mark" aria-hidden="true" />Kooperationen
        </p>

        <h1 class="top__title">
          Lust auf Kooperationen.
        </h1>

        <p class="top__lead">
          Ich freue mich über Angebote. Wichtig ist, dass sie für beide Seiten
          „passen“.
        </p>
      </UContainer>
    </section>

    <!-- ═══════════════ BEDINGUNGEN ═══════════════ -->
    <section class="section">
      <UContainer>
        <div class="protocol">
          <p class="protocol__label">
            Annahme&shy;bedingungen
          </p>

          <ol class="protocol__list">
            <li
              v-for="(kriterium, index) in KOOPERATION_KRITERIEN"
              :key="kriterium.label"
              class="protocol__row"
            >
              <span class="protocol__num">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="protocol__tick" aria-hidden="true" />
              <div>
                <h2 class="protocol__title">
                  {{ kriterium.label }}
                </h2>
                <p class="protocol__detail">
                  {{ kriterium.detail }}
                </p>
              </div>
            </li>
          </ol>
        </div>

        <!--
          Eddys Satz aus der alten Seite, als eigenes Satzbild zwischen zwei Linien:
          Er ist der Kern der Bedingungen, keine Fußnote dazu.
        -->
        <p class="statement reveal">
          Wenn du überzeugt bist, dass diese Maßnahmen die
          <em>Wirksamkeit</em> eines Artikels nicht schmälern, dann haben wir die
          gleichen Erwartungen an Content- bzw. Blog-Marketing-Maßnahmen.
          <span class="statement__heart">❤️</span>
        </p>
      </UContainer>
    </section>

    <!-- ═══════════════ 01 · REFERENZEN ═══════════════ -->
    <section class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="01 · Referenzen"
          title="Was bei einer Zusammenarbeit entsteht"
          lead="So sehen meine Beiträge aus, die bei einer Zusammenarbeit entstehen. Drei Beispiele aus dem Blog, jeweils als „Werbung“ gekennzeichnet."
        />

        <ul class="works">
          <li v-for="referenz in KOOPERATION_REFERENZEN" :key="referenz.slug">
            <NuxtLink :to="`/blog/${referenz.slug}`" class="work">
              <span class="work__frame">
                <NuxtImg
                  :src="referenz.image"
                  alt=""
                  width="480"
                  height="160"
                  densities="1x 2x"
                  fit="cover"
                  format="webp"
                  quality="80"
                  loading="lazy"
                  class="work__img"
                />
              </span>

              <span class="work__body">
                <span class="work__meta">
                  <span class="work__year">{{ referenz.year }}</span>
                  <span class="work__tag">Werbung</span>
                </span>
                <span class="work__title">{{ referenz.title }}</span>
                <span class="work__excerpt">{{ referenz.excerpt }}</span>
              </span>

              <Icon name="lucide:arrow-right" class="work__icon size-5" />
            </NuxtLink>
          </li>
        </ul>

        <a
          :href="KOOPERATION_WERBUNG_ARCHIV"
          target="_blank"
          rel="noopener noreferrer"
          class="archive"
        >
          Alle als Werbung gekennzeichneten Beiträge im Blogarchiv
          <Icon name="lucide:arrow-up-right" class="size-4" />
        </a>
      </UContainer>
    </section>

    <!-- ═══════════════ 02 · MEDIA-KIT ═══════════════ -->
    <section id="mediakit" class="section section--bordered reveal">
      <UContainer>
        <SectionHead
          kicker="02 · Media-Kit"
          title="Steckbrief, Daten, Zahlen"
          lead="Meinen Steckbrief und wichtige Daten, Zahlen und Fakten habe ich im Media-Kit hinterlegt. Du kannst es hier als PDF-Datei ansehen und herunterladen."
        />

        <a
          :href="KOOPERATION_MEDIAKIT.url"
          target="_blank"
          rel="noopener noreferrer"
          class="sheet"
        >
          <!-- Ein Blatt mit Eselsohr, rein typografisch gebaut. -->
          <span class="sheet__doc" aria-hidden="true">
            <span class="sheet__lines" />
            <span class="sheet__type">PDF</span>
          </span>

          <span class="sheet__main">
            <span class="sheet__name">{{ KOOPERATION_MEDIAKIT.fileName }}</span>
            <span class="sheet__facts">
              <span>{{ KOOPERATION_MEDIAKIT.pages }} Seite</span>
              <span>{{ KOOPERATION_MEDIAKIT.sizeKb }} KB</span>
              <span>Stand {{ KOOPERATION_MEDIAKIT.stand }}</span>
            </span>
          </span>

          <span class="sheet__action">
            Ansehen
            <Icon name="lucide:arrow-up-right" class="sheet__icon size-4" />
          </span>
        </a>
      </UContainer>
    </section>

    <!-- ═══════════════ 03 · BUCHUNG ═══════════════ -->
    <section id="trustedblogsbuchung" class="section section--bordered section--muted reveal">
      <UContainer>
        <div class="booking">
          <div class="booking__main">
            <SectionHead kicker="03 · Buchung" title="Buche mich über trusted blogs">
              <template #lead>
                Mein Blog ist bei trusted blogs registriert und du kannst mich mit einem
                Klick direkt
                <a
                  :href="TRUSTED_BLOGS_BOOKING_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="textlink"
                >über die Plattform buchen</a>. Das bringt dir folgende Vorteile:
              </template>
            </SectionHead>

            <ol class="perks">
              <li
                v-for="(vorteil, index) in KOOPERATION_VORTEILE"
                :key="vorteil.title"
                class="perk"
              >
                <span class="perk__num">{{ String(index + 1).padStart(2, '0') }}</span>
                <h3 class="perk__title">
                  {{ vorteil.title }}
                </h3>
                <p class="perk__text">
                  {{ vorteil.text }}
                </p>
              </li>
            </ol>
          </div>

          <aside class="booking__side">
            <p class="booking__ask">
              Also: Was genau erwartest du von mir? Und bietest du mir an? Beschreibe es
              im Kampagnen-Konfigurator: Ich bin gespannt auf dein Briefing und freue mich
              auf eine Zusammenarbeit!
            </p>

            <!--
              Der Auftragsschein. Ersetzt das Partnerbild der alten Seite, das direkt von
              trusted-blogs.com geladen wurde (Drittanbieter-Verbindung ohne Klick, siehe
              docs/kooperationen.md).
            -->
            <div class="ticket">
              <div class="ticket__body">
                <p class="ticket__kind">
                  Auftragsschein
                </p>
                <p class="ticket__title">
                  Kampagne mit Eddys Blog
                </p>

                <dl class="ticket__fields">
                  <div class="ticket__field">
                    <dt>Auftragnehmer</dt>
                    <dd>Eduard Andrae</dd>
                  </div>
                  <div class="ticket__field">
                    <dt>Abwicklung</dt>
                    <dd>trusted blogs</dd>
                  </div>
                  <div class="ticket__field">
                    <dt>Zusatzkosten für dich</dt>
                    <dd>keine</dd>
                  </div>
                </dl>

                <a
                  :href="TRUSTED_BLOGS_BOOKING_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ticket__cta"
                >
                  Kampagne erstellen
                  <Icon name="lucide:arrow-up-right" class="ticket__cta-icon size-5" />
                </a>
                <p class="ticket__hint">
                  Öffnet trusted-blogs.com in einem neuen Tab
                </p>
              </div>

              <div class="ticket__stub" aria-hidden="true">
                <span class="ticket__stub-label">Kat.-Nr.</span>
                <span class="ticket__stub-num">{{ TRUSTED_BLOGS_KATALOG_NR }}</span>
              </div>
            </div>

            <p class="booking__direct">
              Lieber erst reden? Alle Wege zu mir stehen auf der
              <NuxtLink to="/kontakt" class="textlink">
                Kontaktseite</NuxtLink>.
            </p>
          </aside>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* ── Kopf ───────────────────────────────────────────────────────────────── */
.top {
  padding: clamp(3.5rem, 8vw, 5.5rem) 0 clamp(2.5rem, 5vw, 3.5rem);
  background:
    radial-gradient(80% 70% at 15% 0%, rgba(33, 164, 163, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

.top__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

.top__title {
  margin-top: 1.25rem;
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

.top__lead {
  margin-top: 1.25rem;
  max-width: 32rem;
  font-size: var(--text-lg);
  line-height: 1.65;
  color: var(--color-steel-300);
}

@media (prefers-reduced-motion: no-preference) {
  .top__kicker,
  .top__title,
  .top__lead {
    animation: var(--animate-rise);
  }
  .top__title { animation-delay: 80ms; }
  .top__lead { animation-delay: 160ms; }
}

/* ── Sektionen ──────────────────────────────────────────────────────────── */
.section {
  padding: clamp(3.5rem, 8vw, 6rem) 0;
}

.section--bordered {
  border-top: 1px solid var(--color-graphite-700);
}

.section--muted {
  background: var(--color-graphite-950);
}

/* Gleiche Reserve wie auf /werkbank: 4rem Header plus Puffer für den Schriftwechsel. */
.section[id] {
  scroll-margin-top: 9rem;
}

.textlink {
  color: var(--color-steel-100);
  text-decoration: underline;
  text-decoration-color: var(--color-accent-500);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
  transition: color 200ms ease, text-decoration-color 200ms ease;
}
.textlink:hover {
  color: var(--color-accent-300);
  text-decoration-color: var(--color-accent-300);
}

/* ── Prüfprotokoll ──────────────────────────────────────────────────────── */
.protocol {
  display: grid;
  gap: 1.25rem;
}
@media (min-width: 768px) {
  .protocol {
    grid-template-columns: 11rem 1fr;
    gap: 2.5rem;
  }
}

.protocol__label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-500);
  padding-top: 1.6rem;
  hyphens: manual;
}

.protocol__list {
  border-top: 1px solid var(--color-graphite-700);
}

.protocol__row {
  display: grid;
  grid-template-columns: 2rem 1.25rem 1fr;
  gap: 1rem;
  align-items: start;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}
@media (min-width: 768px) {
  .protocol__row {
    grid-template-columns: 3rem 1.5rem 1fr;
    gap: 1.5rem;
  }
}

.protocol__num {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-600);
  padding-top: 0.45rem;
  font-variant-numeric: tabular-nums;
}

/*
  Das Häkchen als Indexmarke: ein kurzer und ein langer Strich im rechten Winkel,
  gedreht. Kein Icon-Font, damit es dieselbe Strichstärke hat wie die Haarlinien.
*/
.protocol__tick {
  position: relative;
  width: 0.6rem;
  height: 1.05rem;
  margin-top: 0.3rem;
  margin-left: 0.3rem;
  border-right: 2px solid var(--color-accent-400);
  border-bottom: 2px solid var(--color-accent-400);
  rotate: 40deg;
}

.protocol__title {
  font-size: clamp(1.3rem, 2.4vw, 1.6rem);
  line-height: 1.2;
  color: var(--color-steel-100);
}

.protocol__detail {
  margin-top: 0.4rem;
  max-width: 34rem;
  font-size: var(--text-base);
  line-height: 1.65;
  color: var(--color-steel-400);
}

/* ── Statement ──────────────────────────────────────────────────────────── */
.statement {
  margin-top: clamp(3rem, 6vw, 4.5rem);
  padding: clamp(2rem, 4vw, 2.75rem) 0;
  border-top: 1px solid var(--color-graphite-700);
  border-bottom: 1px solid var(--color-graphite-700);
  max-width: 52rem;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.8vw, 1.95rem);
  line-height: 1.4;
  letter-spacing: -0.015em;
  color: var(--color-steel-200);
}
@media (min-width: 768px) {
  .statement {
    margin-left: 13.5rem;
  }
}

.statement em {
  font-style: italic;
  color: var(--color-accent-300);
}

.statement__heart {
  font-style: normal;
  white-space: nowrap;
}

/* ── Referenzen ─────────────────────────────────────────────────────────── */
.works {
  margin-top: clamp(2rem, 4vw, 3rem);
  border-top: 1px solid var(--color-graphite-700);
}

.work {
  display: grid;
  gap: 1.25rem;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
  transition: background 250ms ease;
}
@media (min-width: 768px) {
  .work {
    grid-template-columns: minmax(14rem, 20rem) 1fr auto;
    gap: 2rem;
    align-items: center;
    padding: 1.75rem 1rem;
  }
  .work:hover {
    background: var(--color-graphite-850);
  }
}

/*
  Gemeinsamer 3:1-Ausschnitt: Die Beitragsbilder reichen von gut 2:1 bis 5:1. Im
  Ruhezustand gedämpft wie die Vitrinen auf /werkbank, damit drei farbige Fotos die
  dunkle Seite nicht überstrahlen.
*/
.work__frame {
  display: block;
  aspect-ratio: 3 / 1;
  overflow: hidden;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-800);
}

.work__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.7) brightness(0.82);
  transition: filter 300ms ease, scale 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.work:hover .work__img,
.work:focus-visible .work__img {
  filter: none;
  scale: 1.03;
}

.work__body {
  display: grid;
  gap: 0.45rem;
}

.work__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.work__year {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-accent-300);
  font-variant-numeric: tabular-nums;
}

.work__tag {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-500);
  border: 1px solid var(--color-graphite-600);
  padding: 0.1rem 0.45rem;
}

.work__title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--color-steel-100);
}

.work__excerpt {
  max-width: 38rem;
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-steel-400);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.work__icon {
  display: none;
  color: var(--color-steel-600);
  transition: color 200ms ease, translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
@media (min-width: 768px) {
  .work__icon {
    display: block;
  }
}
.work:hover .work__icon {
  color: var(--color-accent-400);
  translate: 0.25rem 0;
}

.archive {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
  font-size: var(--text-sm);
  color: var(--color-steel-400);
  transition: color 200ms ease;
}
@media (min-width: 768px) {
  .archive {
    margin-left: 1rem;
  }
}
.archive:hover {
  color: var(--color-accent-300);
}

/* ── Media-Kit ──────────────────────────────────────────────────────────── */
.sheet {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.25rem 1.5rem;
  align-items: center;
  margin-top: clamp(2rem, 4vw, 3rem);
  max-width: 44rem;
  padding: 1.5rem;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-850);
  transition: border-color 250ms ease;
}
@media (min-width: 640px) {
  .sheet {
    grid-template-columns: auto 1fr auto;
    padding: 1.75rem 2rem;
  }
}
.sheet:hover {
  border-color: var(--color-accent-500);
}

/* Blatt mit Eselsohr: Die Ecke ist ein Dreieck in Hintergrundfarbe plus eine Falz. */
.sheet__doc {
  position: relative;
  display: block;
  width: 3.25rem;
  height: 4.25rem;
  border: 1px solid var(--color-steel-500);
  clip-path: polygon(0 0, calc(100% - 0.9rem) 0, 100% 0.9rem, 100% 100%, 0 100%);
}
.sheet__doc::after {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0.9rem;
  height: 0.9rem;
  background: linear-gradient(225deg, transparent 50%, var(--color-steel-500) 50%, var(--color-steel-500) calc(50% + 1px), var(--color-graphite-700) calc(50% + 1px));
}

.sheet__lines {
  position: absolute;
  inset: 1.1rem 0.55rem auto;
  height: 1.3rem;
  background: repeating-linear-gradient(
    to bottom,
    var(--color-graphite-600) 0 1px,
    transparent 1px 5px
  );
}

.sheet__type {
  position: absolute;
  left: 0.5rem;
  bottom: 0.4rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-accent-300);
}

.sheet__main {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}

.sheet__name {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  color: var(--color-steel-100);
  overflow-wrap: anywhere;
}

.sheet__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-500);
  font-variant-numeric: tabular-nums;
}

.sheet__action {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-accent-300);
}
@media (min-width: 640px) {
  .sheet__action {
    grid-column: auto;
  }
}

.sheet__icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet:hover .sheet__icon {
  translate: 0.2rem -0.2rem;
}

/* ── Buchung ────────────────────────────────────────────────────────────── */
.booking {
  display: grid;
  gap: clamp(3rem, 6vw, 4rem);
}
@media (min-width: 1024px) {
  .booking {
    grid-template-columns: 1fr 24rem;
    gap: 4.5rem;
    align-items: start;
  }
}

.perks {
  display: grid;
  margin-top: clamp(2rem, 4vw, 2.75rem);
  border-top: 1px solid var(--color-graphite-700);
}
@media (min-width: 768px) {
  .perks {
    grid-template-columns: 1fr 1fr;
    column-gap: 2.5rem;
  }
}

.perk {
  display: grid;
  grid-template-columns: 2.25rem 1fr;
  /* Sonst verteilt das Raster die Zeilenhöhe des Nachbarn auf Titel und Text. */
  align-content: start;
  column-gap: 0.75rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
}

.perk__num {
  grid-row: span 2;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-accent-300);
  padding-top: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.perk__title {
  font-size: 1.15rem;
  line-height: 1.3;
  color: var(--color-steel-100);
}

.perk__text {
  margin-top: 0.45rem;
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-steel-400);
}

@media (min-width: 1024px) {
  .booking__side {
    position: sticky;
    top: 6rem;
  }
}

.booking__ask {
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-steel-300);
}

.booking__direct {
  margin-top: 1.5rem;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-steel-500);
}

/* ── Auftragsschein ─────────────────────────────────────────────────────── */
/*
  Schein und Abriss sind zwei Flächen nebeneinander. Die Perforation ist eine
  gestrichelte Linie am Abriss, die beiden halbrunden Kerben oben und unten sind
  Kreise in der Sektionsfarbe (graphite-950), die über die Kante ragen.
*/
.ticket {
  --ticket-bg: var(--color-graphite-850);
  --notch: 1.35rem;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 4.5rem;
  margin-top: 1.75rem;
  border: 1px solid var(--color-graphite-600);
  background: var(--ticket-bg);
}

.ticket__body {
  padding: 1.75rem 1.5rem 1.5rem;
}

.ticket__kind {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-steel-500);
}

.ticket__title {
  margin-top: 0.6rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--color-steel-100);
}

.ticket__fields {
  margin-top: 1.25rem;
  border-top: 1px dashed var(--color-graphite-600);
}

.ticket__field {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px dashed var(--color-graphite-600);
  font-size: var(--text-sm);
}

.ticket__field dt {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-steel-500);
}

.ticket__field dd {
  color: var(--color-steel-200);
  text-align: right;
}

/* Teal-Fläche mit DUNKLER Schrift — weiße Schrift erreichte nur 3,04:1 (main.css). */
.ticket__cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 0.95rem 1.15rem;
  background: var(--color-accent-500);
  color: var(--color-graphite-950);
  font-weight: 700;
  font-size: var(--text-base);
  transition: background 200ms ease;
}
.ticket__cta:hover {
  background: var(--color-accent-400);
}

.ticket__cta-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.ticket__cta:hover .ticket__cta-icon {
  translate: 0.2rem -0.2rem;
}

.ticket__hint {
  margin-top: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-steel-600);
}

.ticket__stub {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-left: 1px dashed var(--color-graphite-500);
}

/* Die beiden Kerben an der Perforation. */
.ticket__stub::before,
.ticket__stub::after {
  content: '';
  position: absolute;
  left: calc(var(--notch) / -2 - 0.5px);
  width: var(--notch);
  height: var(--notch);
  border-radius: 50%;
  background: var(--color-graphite-950);
  border: 1px solid var(--color-graphite-600);
}
.ticket__stub::before {
  top: calc(var(--notch) / -2 - 1px);
  clip-path: inset(50% 0 0 0);
}
.ticket__stub::after {
  bottom: calc(var(--notch) / -2 - 1px);
  clip-path: inset(0 0 50% 0);
}

.ticket__stub-label {
  writing-mode: vertical-rl;
  rotate: 180deg;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-500);
}

.ticket__stub-num {
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-accent-300);
  font-variant-numeric: tabular-nums;
}
</style>
