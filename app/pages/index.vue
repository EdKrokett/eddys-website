<script setup lang="ts">
const { filteredPosts: recentPosts, status } = useBlog({ limit: 3, lazy: true })

const title = 'Eduard Andrae — Blog-Marketing, Agile & Laufen'
const description
  = 'Uhrmachermeister, der Startup-Gründer wurde. Kettenraucher, der Marathonläufer wurde. Heute verbinde ich Blogs und Brands.'

// Facebook, LinkedIn und WhatsApp lösen relative Pfade nicht auf — og:url und
// og:image müssen absolut sein. Die Basis kommt aus site.url (nuxt.config) statt
// als Literal hierher, damit es genau eine Stelle gibt, die die Domain kennt.
const { url: siteUrl } = useSiteConfig()

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogSiteName: 'Eduard Andrae',
  ogUrl: `${siteUrl}/`,
  ogImage: `${siteUrl}/images/og-startseite.jpg`,
  // Breite/Höhe mitzugeben erspart den Crawlern einen zweiten Abruf, sonst
  // zeigen manche Netzwerke beim ersten Teilen noch keine Vorschau.
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/jpeg',
  ogImageAlt: 'Eduard Andrae vor dunklem Grafit-Hintergrund, daneben der Satz "Uhrmachermeister, der Startup-Gründer wurde."',
  ogLocale: 'de_DE',
  // X liest Titel, Beschreibung und Bild aus den og:-Tags — nur den Kartentyp
  // nicht. Ohne ihn bleibt die Vorschau die kleine quadratische Variante.
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <HomeHero />

    <!--
      Kontakt bewusst weit oben, direkt hinter dem Hero (Eddys Wunsch) — mit
      viel Luft nach oben und unten, damit der Block trotz der frühen Position
      nicht drängelt.
    -->
    <section class="contact reveal">
      <UContainer>
        <div class="contact__inner">
          <div class="contact__body">
            <p class="kicker">
              <span class="contact__mark" aria-hidden="true" />Kontakt
            </p>

            <h2 class="contact__title">
              Reden wir über Blogs.<br>
              Oder übers Laufen.<br>
              Oder über KI.<br>
              <span class="contact__title-open">Oder …</span>
            </h2>

            <!--
              Neuer Tab statt Calendly-Modal: Das Popup-Widget verlangt Calendlys
              eigenes Skript im Seitenkopf. Das wäre eine Drittanbieter-Einbindung
              mit eigener Datenverarbeitung — und würde der Datenschutzerklärung
              widersprechen, die ausdrücklich sagt, dass nichts automatisch
              eingebettet wird und eine Verbindung erst beim Klick entsteht.
            -->
            <a
              :href="CALENDLY_URL ?? '/kontakt'"
              target="_blank"
              rel="noopener noreferrer"
              class="contact__button"
            >
              Kontakt aufnehmen
              <Icon name="lucide:arrow-up-right" class="contact__button-icon size-4" />
            </a>
          </div>

          <div class="contact__visual">
            <NuxtImg
              src="/images/eddy-portrait.png"
              alt="Eduard Andrae"
              width="440"
              densities="1x 2x"
              format="webp"
              quality="88"
              loading="lazy"
              class="contact__portrait"
            />
          </div>
        </div>
      </UContainer>
    </section>

    <HomeDoors />

    <!-- ═══════════════ BLOG-VORSCHAU (live von blog.eduard-andrae.de) ═══════════════ -->
    <section class="section reveal">
      <UContainer>
        <div class="section__head">
          <SectionHead
            kicker="Zuletzt geschrieben"
            title="Frisch aus dem Blog"
          />
          <NuxtLink to="/blog" class="section__all">
            Alle Beiträge
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </NuxtLink>
        </div>

        <div v-if="status === 'pending' || status === 'idle'" class="state">
          Lade Beiträge …
        </div>
        <div v-else-if="status === 'error'" class="state state--error">
          Die Beiträge konnten gerade nicht geladen werden.
          <NuxtLink to="/blog" class="state__link">
            Direkt zur Blog-Übersicht
          </NuxtLink>
        </div>
        <div v-else-if="recentPosts.length === 0" class="state">
          Noch keine Beiträge vorhanden.
        </div>
        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <BlogCard v-for="post in recentPosts" :key="post.id" :post="post" />
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.section {
  padding: clamp(4rem, 9vw, 7rem) 0;
}

.section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.section__all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-steel-300);
  border-bottom: 1px solid var(--color-graphite-600);
  padding-bottom: 0.35rem;
  transition: color 200ms ease, border-color 200ms ease;
}
.section__all:hover {
  color: var(--color-accent-400);
  border-color: var(--color-accent-500);
}

.state {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-steel-500);
}
.state--error {
  color: var(--color-accent-300);
}
.state__link {
  display: block;
  margin-top: 0.5rem;
  color: var(--color-steel-300);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Kontaktband ────────────────────────────────────────────────────────── */
.contact {
  border-bottom: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(75% 130% at 78% 55%, rgba(33, 164, 163, 0.1) 0%, transparent 62%),
    var(--color-graphite-950);
  /* Viel Luft: Der Block steht sehr weit oben und braucht Abstand, damit er
     nicht am Hero klebt. */
  padding: clamp(4.5rem, 11vw, 9rem) 0;
}

.contact__inner {
  display: grid;
  gap: clamp(2.5rem, 5vw, 4rem);
  align-items: end;
}
@media (min-width: 880px) {
  .contact__inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.62fr);
  }
}

.contact__mark {
  width: 2rem;
  height: 2px;
  background: var(--color-accent-400);
}

.contact__title {
  margin-top: 1.25rem;
  font-size: clamp(1.75rem, 3.6vw, 2.75rem);
  line-height: 1.18;
  color: var(--color-steel-100);
}

/* Die offene vierte Zeile bewusst zurückgenommen — sie ist eine Einladung,
   keine Aussage. */
.contact__title-open {
  color: var(--color-steel-500);
}

/* Button unten links, mit Abstand zur Überschrift. */
.contact__button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: clamp(2rem, 4vw, 2.75rem);
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
.contact__button:hover {
  border-color: var(--color-accent-300);
  background: var(--color-accent-300);
}
.contact__button-icon {
  transition: translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.contact__button:hover .contact__button-icon {
  translate: 0.2rem -0.2rem;
}

/* ── Porträt ────────────────────────────────────────────────────────────── */
.contact__visual {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.contact__portrait {
  width: min(100%, 22rem);
  height: auto;
  /* Kurzer Abriss unten, damit der Freisteller nicht abgeschnitten wirkt. */
  mask-image: linear-gradient(to bottom, #000 90%, transparent 100%);
  filter: drop-shadow(0 18px 45px rgba(14, 15, 18, 0.7));
}

@media (max-width: 879px) {
  .contact__visual {
    justify-content: center;
  }
  .contact__portrait {
    width: min(72%, 17rem);
  }
}
</style>
