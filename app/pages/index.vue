<script setup lang="ts">
const { filteredPosts: recentPosts, status } = useBlog({ limit: 3, lazy: true })

useSeoMeta({
  title: 'Eduard Andrae — Blog-Marketing, Agile & Laufen',
  description:
    'Uhrmachermeister, der Unternehmer wurde. Gründer von trusted blogs, Scrum Master und seit 2006 Laufblogger aus Bremen.',
})
</script>

<template>
  <div>
    <HomeHero />

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

    <!-- ═══════════════ KONTAKT-BAND ═══════════════ -->
    <section class="cta reveal">
      <UContainer>
        <div class="cta__inner">
          <div>
            <p class="kicker">
              <span class="cta__mark" aria-hidden="true" />Kontakt
            </p>
            <h2 class="cta__title">
              Reden wir über Blogs.<br>Oder übers Laufen.
            </h2>
          </div>

          <NuxtLink to="/kontakt" class="cta__button">
            Kontakt aufnehmen
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
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
.cta {
  border-top: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(90% 140% at 85% 50%, rgba(33, 164, 163, 0.09) 0%, transparent 60%),
    var(--color-graphite-950);
  padding: clamp(3.5rem, 8vw, 6rem) 0;
}

.cta__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.cta__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent-500);
}

.cta__title {
  margin-top: 1rem;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  line-height: 1.15;
  color: var(--color-steel-100);
}

.cta__button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-steel-600);
  padding: 0.9rem 1.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-100);
  transition: background 250ms ease, border-color 250ms ease, color 250ms ease;
}
.cta__button:hover {
  background: var(--color-accent-500);
  border-color: var(--color-accent-500);
  color: #fff;
}
</style>
