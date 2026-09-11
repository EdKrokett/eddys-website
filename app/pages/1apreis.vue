<script setup lang="ts">
/**
 * Gedenkseite für Eddys erstes Startup 1Apreis.de.
 *
 * WARUM DIESER PFAD FESTLIEGT: Die Domain `1apreis.de` leitet auf `/1apreis`
 * weiter. Bis diese Seite existierte, fing `app/pages/[...slug].vue` die Anfrage
 * ab und schickte sie per 301 zurück an WordPress. Ein Umbenennen der Route
 * würde genau diesen Umweg wiederherstellen — dann bitte die Weiterleitung bei
 * IONOS mitziehen. Hintergrund: docs/1apreis-gedenkseite.md.
 *
 * DESIGN „VITRINE“: Eine durchgehende Zeitachse, an der vier Schaukästen hängen.
 * Die Screenshots liegen gedämpft hinter Glas und kommen erst beim Hover auf
 * volle Farbe — das Hineinbeugen ans Schaufenster. Die Messing-Eckbeschläge
 * (`--color-brass-*`) sind das warme Gegenstück zum sonst kühlen Teal der Seite
 * und tragen hier die Nostalgie, ohne dass die Seite aus dem Rahmen fällt.
 *
 * Keine Datenanbindung: alle Inhalte sind Konstanten aus app/utils/onepreis.ts,
 * die vier Screenshots liegen lokal unter public/images/1apreis/.
 */
useSeoMeta({
  title: '1Apreis.de — Gedenkseite für mein erstes Startup',
  description:
    'Von 2000 bis 2012 verkaufte 1Apreis.de „Markenartikel zu Hammerpreisen“. Die Geschichte meines ersten Startups, mit vier Ansichten aus der Wayback Machine.',
})
</script>

<template>
  <div>
    <!-- ═══════════════ KOPF ═══════════════ -->
    <section class="head">
      <UContainer>
        <p class="kicker">
          <span class="head__mark" aria-hidden="true" />Gedenkseite
        </p>

        <h1 class="head__title">
          1Apreis.de
        </h1>

        <p class="head__slogan">
          „Markenartikel zu Hammerpreisen“
        </p>

        <dl class="facts">
          <div v-for="fact in ONEPREIS_FACTS" :key="fact.label" class="facts__item">
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

    <!-- ═══════════════ DIE GESCHICHTE ═══════════════ -->
    <section class="section reveal">
      <UContainer>
        <SectionHead
          kicker="Die Geschichte"
          title="Was hier einmal stand"
        />

        <div class="story">
          <p>
            Unter der Domain 1apreis.de präsentierte sich von 2000 bis 2012 ein Online-Shop
            für Schnäppchen aller Art. Der Slogan „Markenartikel zu Hammerpreisen“ war
            Philosophie und Programm. Es gab Warenüberhänge, Auslaufmodelle, Ware mit knappem
            Mindesthaltbarkeitsdatum, Restanten und Retouren zu stark vergünstigten Preisen.
            Häufig kosteten die Artikel weniger als 50 Prozent des unverbindlichen
            Verkaufspreises.
          </p>

          <p>
            Wichtig war dabei, dass ausschließlich bekannte Markenartikel angeboten wurden.
            So konnten Kundinnen und Kunden schnell und leicht Preise vergleichen. Das
            Sortiment hatte keinen Schwerpunkt. Es gab Artikel aus allen möglichen Bereichen
            wie Beauty, Fashion, Haushalt, Spielwaren und Unterhaltungselektronik, dazu Marken
            von A wie Armani bis Z wie Zippo.
          </p>

          <p>
            Firmensitz der 1Apreis.de GmbH war Steinhagen bei Gütersloh. Die Gründer und
            zugleich Geschäftsführer waren Uwe Sachse und ich selbst. Investor und weiterer
            Gesellschafter war die Haltermann &amp; Schulte GmbH aus Asendorf in Niedersachsen.
          </p>

          <p>
            Das Konzept war für seine Zeit neu genug, dass der Otto-Konzern es unter dem Namen
            Discount24.de nachgebaut hat. Rückblickend ist das die schmeichelhafteste Form von
            Wettbewerb, die einem jungen Startup passieren kann.
          </p>

          <p>
            Im Jahr 2006 haben Uwe und ich unser Startup aufgegeben. Inventar und Domain wurden
            verkauft. Unter neuer Firmenleitung wurde der Shop noch bis in das Jahr 2012 weiter
            betrieben. Dann wurde die Firma liquidiert, der Shop geschlossen und die Domain
            nicht weiter genutzt. Sie fiel quasi in einen Dornröschenschlaf.
          </p>

          <p>
            2019 habe ich 1Apreis.de über einen Domain-Handelsplatz zurückgekauft, aus rein
            nostalgischen Gründen. Ich habe nicht vor, die Website wiederzubeleben. Die Domain
            zeigt seitdem hierher, auf diese Infotafel.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ DIE VITRINE ═══════════════ -->
    <section class="section section--muted reveal">
      <UContainer>
        <SectionHead
          kicker="Archiv"
          title="Vier Blicke ins Schaufenster"
          lead="Die folgenden Ansichten stammen aus der Wayback Machine. Nicht alle Bilder und Schriftarten sind im Archiv erhalten geblieben. Für einen Eindruck reicht es."
        />

        <div class="vitrine">
          <ol class="vitrine__list">
            <li
              v-for="(exhibit, i) in ONEPREIS_EXHIBITS"
              :key="exhibit.year"
              class="exhibit"
            >
              <div class="exhibit__rail">
                <span class="exhibit__year">{{ exhibit.year }}</span>
              </div>

              <figure class="exhibit__body">
                <div class="case">
                  <!--
                    Screenshots sind großflächig und detailreich; als PNG wöge dieser
                    Abschnitt mehr als der Rest der Seite zusammen (1428 KB für die vier
                    Quelldateien).

                    `format="webp"` wirkt dabei NUR lokal: IPX liefert ohne diesen Prop
                    das Quellformat aus, also PNG — damit fällt der Abschnitt im Dev-Build
                    von 1428 KB auf 259 KB. Auf Vercel ignoriert der Image-Optimizer den
                    Prop und wählt das Format selbst über den Accept-Header; dort kommen
                    157 KB als AVIF an (beides gemessen 11.09.2026).

                    Der Prop bleibt trotzdem stehen, damit die Entwicklungsansicht nicht
                    um ein Vielfaches schwerer ist als die ausgelieferte Seite.

                    `densities="1x 2x"`, weil man die alten Shops auf einem
                    Retina-Display lesen können soll.
                  -->
                  <NuxtImg
                    :src="`/images/1apreis/${exhibit.year}.png`"
                    :alt="exhibit.alt"
                    :width="exhibit.width"
                    :height="exhibit.height"
                    :loading="i === 0 ? 'eager' : 'lazy'"
                    densities="1x 2x"
                    format="webp"
                    quality="80"
                    class="case__shot"
                  />
                  <span class="case__glass" aria-hidden="true" />
                  <span class="case__fittings" aria-hidden="true" />
                </div>

                <figcaption class="plaque">
                  <p class="plaque__no">
                    Exponat {{ String(i + 1).padStart(2, '0') }}
                  </p>
                  <p class="plaque__title">
                    {{ exhibit.title }}
                  </p>
                  <p class="plaque__text">
                    {{ exhibit.caption }}
                  </p>
                </figcaption>
              </figure>
            </li>
          </ol>

          <!--
            Schlussmarke: 2019 hat kein Exponat, beendet aber die Zeitachse. Steht
            deshalb bewusst außerhalb der <ol> — die Liste zählt Schaukästen, und
            hier hängt keiner.
          -->
          <div class="exhibit exhibit--coda">
            <div class="exhibit__rail">
              <span class="exhibit__year">2019</span>
            </div>
            <p class="coda">
              Zurückgekauft. Seitdem zeigt 1apreis.de auf diese Seite.
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════ RÜCKWEG ═══════════════ -->
    <section class="section section--bordered">
      <UContainer>
        <NuxtLink to="/ueber-mich#projekte" class="backlink">
          <Icon name="lucide:arrow-left" class="backlink__icon size-4" />
          <span>Alle Projekte und der ganze Werdegang</span>
        </NuxtLink>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* ── Kopf ─────────────────────────────────────────────────────────────────
 * Der Schimmer ist hier Messing statt Teal wie auf den übrigen Seiten: warmes
 * Licht über einem Ausstellungsstück, nicht das kühle Werkstattlicht.          */
.head {
  padding: clamp(3.5rem, 8vw, 5.5rem) 0 clamp(2.5rem, 5vw, 3.5rem);
  background:
    radial-gradient(80% 70% at 15% 0%, rgba(168, 130, 63, 0.10) 0%, transparent 55%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

.head__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-brass-400);
}

.head__title {
  margin-top: 1.25rem;
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

.head__slogan {
  margin-top: 1rem;
  max-width: 32rem;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-style: italic;
  line-height: 1.5;
  color: var(--color-brass-300);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2.75rem;
  margin-top: clamp(2rem, 4vw, 2.75rem);
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-graphite-800);
}

.facts__value {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  letter-spacing: -0.01em;
  color: var(--color-steel-100);
}

.facts__label {
  margin-top: 0.3rem;
  font-size: var(--text-sm);
  color: var(--color-steel-500);
}

/* ── Sektionsrahmen ──────────────────────────────────────────────────────── */
.section {
  padding: clamp(3.5rem, 8vw, 6rem) 0;
}

.section--muted {
  background: var(--color-graphite-950);
  border-block: 1px solid var(--color-graphite-800);
}

.section--bordered {
  border-top: 1px solid var(--color-graphite-800);
}

/* ── Fließtext ───────────────────────────────────────────────────────────── */
.story {
  max-width: 40rem;
  margin-top: clamp(2rem, 4vw, 2.75rem);
  font-size: var(--text-md);
  line-height: 1.8;
  color: var(--color-steel-300);
}

.story > p + p {
  margin-top: 1.35em;
}

/* ── Vitrine: Zeitachse mit Schaukästen ──────────────────────────────────── */
.vitrine {
  position: relative;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
}

.vitrine__list {
  display: grid;
}

/*
 * Die Achse selbst. Sie liegt als eigene Linie über der ganzen Vitrine statt als
 * `border` an jedem Eintrag: Zwischen den Einträgen sitzt Abstand, einzelne
 * Rahmen ergäben also eine gestrichelte statt einer durchgehenden Achse.
 * Unten läuft sie aus, statt hart zu enden — das Auslaufen ist der
 * Dornröschenschlaf.
 */
@media (min-width: 768px) {
  .vitrine::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    bottom: 0;
    left: 6.5rem;
    width: 1px;
    background: linear-gradient(
      to bottom,
      var(--color-graphite-700) 0%,
      var(--color-graphite-700) 88%,
      transparent 100%
    );
  }
}

.exhibit {
  display: grid;
  gap: 1rem;
  padding-bottom: clamp(3rem, 6vw, 5rem);
}

@media (min-width: 768px) {
  .exhibit {
    grid-template-columns: 6.5rem minmax(0, 1fr);
    column-gap: 2.5rem;
  }
}

.exhibit--coda {
  padding-bottom: 0;
}

/* Jahreszahl an der Achse, mit Indexstrich, der die Achse quert. */
.exhibit__rail {
  position: relative;
}

.exhibit__year {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  letter-spacing: 0.02em;
  color: var(--color-steel-400);
}

@media (min-width: 768px) {
  .exhibit__rail {
    padding-right: 1.5rem;
    text-align: right;
  }

  .exhibit__rail::after {
    content: '';
    position: absolute;
    top: 0.72em;
    right: -0.5rem;
    width: 1rem;
    height: 1px;
    background: var(--color-accent-400);
  }
}

.exhibit__body {
  display: grid;
  gap: 1.25rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .exhibit__body {
    grid-template-columns: minmax(0, 40rem) minmax(13rem, 1fr);
    column-gap: 2.25rem;
  }
}

/* ── Der Schaukasten ─────────────────────────────────────────────────────── */
.case {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-graphite-700);
  /* Passepartout: der Screenshot klebt nicht am Rahmen, er ist aufgezogen. */
  padding: clamp(0.5rem, 1.4vw, 0.9rem);
  background: var(--color-graphite-850);
}

/*
 * Museumslicht: gedämpft im Ruhezustand, volle Farbe beim Hineinbeugen. Die alten
 * Shops sind knallig orange — ungedämpft würden sie die ganze Seite dominieren,
 * und genau das soll erst die bewusste Zuwendung auslösen.
 */
.case__shot {
  display: block;
  width: 100%;
  height: auto;
  filter: saturate(0.45) brightness(0.72) contrast(1.05);
  transition: filter 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.exhibit__body:hover .case__shot,
.exhibit__body:focus-within .case__shot {
  filter: none;
}

/*
 * Die Scheibe: eine schräge Spiegelung, die beim Hover über das Glas wandert.
 * Bewusst breiter als der Kasten (`left`/`width`), damit beim Verschieben keine
 * Kante ins Bild läuft.
 */
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
    rgba(255, 255, 255, 0.10) 46%,
    rgba(255, 255, 255, 0.03) 52%,
    transparent 60%
  );
  transform: translateX(-10%);
  transition: transform 1100ms cubic-bezier(0.16, 1, 0.3, 1);
}

.exhibit__body:hover .case__glass,
.exhibit__body:focus-within .case__glass {
  transform: translateX(10%);
}

/*
 * Vier Messing-Winkel wie die Eckbeschläge einer Vitrine: je zwei 1px-Striche pro
 * Ecke, als acht Hintergrund-Layer statt als vier zusätzliche Elemente im DOM.
 * `inset: -1px` setzt sie exakt auf die Haarlinie des Rahmens.
 */
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

/* ── Das Schild neben dem Exponat ────────────────────────────────────────── */
.plaque {
  padding-top: 1rem;
  border-top: 1px solid var(--color-graphite-700);
}

@media (min-width: 1024px) {
  .plaque {
    padding-top: 0.4rem;
    border-top: 0;
    border-left: 1px solid var(--color-graphite-700);
    padding-left: 1.5rem;
  }
}

.plaque__no {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-brass-400);
}

.plaque__title {
  margin-top: 0.6rem;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--color-steel-100);
}

.plaque__text {
  margin-top: 0.7rem;
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--color-steel-400);
}

.coda {
  max-width: 26rem;
  font-size: var(--text-md);
  line-height: 1.6;
  color: var(--color-steel-300);
}

/* ── Rückweg ─────────────────────────────────────────────────────────────── */
.backlink {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-400);
  transition: color 180ms ease;
}

.backlink:hover {
  color: var(--color-accent-300);
}

.backlink__icon {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.backlink:hover .backlink__icon {
  transform: translateX(-0.25rem);
}
</style>
