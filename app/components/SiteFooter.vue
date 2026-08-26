<script setup lang="ts">
/**
 * Footer mit Kontakt, Social-Profilen und den Pflichtangaben.
 * `activeSocialProfiles()` filtert Einträge ohne bestätigte URL heraus, damit
 * hier nie ein toter Link steht (app/utils/site.ts).
 */
const socials = activeSocialProfiles()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <UContainer>
      <div class="footer__grid">
        <div class="footer__brand">
          <p class="footer__name">
            Eduard Andrae
          </p>
          <p class="footer__claim">
            Es ist nicht die Zeit, die zählt —<br>
            es ist Deine Leidenschaft.
          </p>
        </div>

        <nav class="footer__col" aria-label="Seiten">
          <p class="footer__col-title">
            Seiten
          </p>
          <NuxtLink to="/ueber-mich" class="footer__link">
            Über mich
          </NuxtLink>
          <NuxtLink to="/blog" class="footer__link">
            Blog
          </NuxtLink>
          <NuxtLink to="/kontakt" class="footer__link">
            Kontakt
          </NuxtLink>
        </nav>

        <nav v-if="socials.length" class="footer__col" aria-label="Profile">
          <p class="footer__col-title">
            Profile
          </p>
          <a
            v-for="social in socials"
            :key="social.name"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__link footer__link--icon"
          >
            <Icon :name="social.icon" class="size-3.5" />
            {{ social.name }}
          </a>
        </nav>

        <nav class="footer__col" aria-label="Rechtliches">
          <p class="footer__col-title">
            Rechtliches
          </p>
          <NuxtLink to="/impressum" class="footer__link">
            Impressum
          </NuxtLink>
          <NuxtLink to="/datenschutz" class="footer__link">
            Datenschutz
          </NuxtLink>
        </nav>
      </div>

      <div class="footer__bar">
        <p>© {{ year }} Eduard Andrae</p>
        <p class="footer__made">
          Bremen
        </p>
      </div>
    </UContainer>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
  padding: clamp(3rem, 6vw, 4.5rem) 0 2rem;
}

.footer__grid {
  display: grid;
  gap: 2.5rem;
}
@media (min-width: 640px) {
  .footer__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .footer__grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
  }
}

.footer__brand {
  max-width: 20rem;
}

.footer__name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-steel-100);
}

.footer__claim {
  margin-top: 0.85rem;
  font-size: var(--text-base);
  line-height: 1.7;
  font-style: italic;
  color: var(--color-steel-500);
}

.footer__col {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: flex-start;
}

.footer__col-title {
  margin-bottom: 0.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent-300);
}

.footer__link {
  font-size: var(--text-base);
  color: var(--color-steel-300);
  transition: color 180ms ease;
}
.footer__link:hover {
  color: var(--color-accent-400);
}

.footer__link--icon {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.footer__bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-top: clamp(2.5rem, 5vw, 4rem);
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-graphite-800);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-steel-500);
}
</style>
