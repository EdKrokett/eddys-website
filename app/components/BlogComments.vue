<script setup lang="ts">
/**
 * Kommentarbereich unter einem Beitrag — Anzeige aus WordPress, bewusst nur lesend.
 *
 * Neue Kommentare können hier (noch) nicht entstehen: WordPress verbietet anonyme
 * Kommentare über die REST-API (`401 rest_comment_login_required`, gemessen
 * 30.08.2026). Statt eines toten Formulars führt der Weg zum nativen Formular im
 * WordPress-Beitrag. Begründung und Ausbaupfad: docs/blog-kommentare.md.
 */
const props = defineProps<{ slug: string }>()

const { threads, total, truncated, status } = useBlogComments(props.slug)

const config = useRuntimeConfig()
/** Zielt auf das native WP-Kommentarformular (`#respond` ist WordPress-Standard). */
const writeUrl = computed(() => `${config.public.wordpressUrl}/${props.slug}/#respond`)
</script>

<template>
  <section class="comments" aria-labelledby="comments-title">
    <div class="comments__head">
      <h2 id="comments-title" class="kicker">
        <span class="comments__rail index-rail" aria-hidden="true" />
        Gespräch
      </h2>
      <span v-if="status === 'success' && total > 0" class="comments__count">
        {{ truncated ? `${total}+` : total }}
      </span>
    </div>

    <!-- Ladezustand: nur bei Client-Navigation sichtbar, per SSR sind die
         Kommentare schon im HTML. -->
    <div v-if="status === 'pending'" class="comments__pending">
      <span v-for="n in 3" :key="n" class="comments__pending-line" />
      <span class="sr-only">Kommentare werden geladen</span>
    </div>

    <!-- Fehler darf den Beitrag nicht dominieren: ein ruhiger Hinweis mit Ausweg. -->
    <p v-else-if="status === 'error'" class="comments__note">
      Die Kommentare lassen sich gerade nicht laden.
      <NuxtLink :to="writeUrl" external target="_blank" rel="noopener" class="comments__link">
        Direkt im Blog ansehen
      </NuxtLink>
    </p>

    <template v-else-if="threads.length">
      <ul class="comments__list">
        <BlogCommentItem v-for="comment in threads" :key="comment.id" :comment="comment" />
      </ul>

      <p v-if="truncated" class="comments__note">
        Dieser Beitrag hat mehr Kommentare, als sich auf einmal laden lassen.
        <NuxtLink :to="writeUrl" external target="_blank" rel="noopener" class="comments__link">
          Alle im Blog lesen
        </NuxtLink>
      </p>
    </template>

    <p v-else class="comments__note comments__note--empty">
      Noch kein Kommentar zu diesem Beitrag.
    </p>

    <!-- Schreibweg: führt zum nativen WordPress-Formular, siehe Kommentar oben. -->
    <NuxtLink :to="writeUrl" external target="_blank" rel="noopener" class="comments__cta">
      <Icon name="lucide:pen-line" class="size-4" />
      Kommentar schreiben
      <span class="comments__cta-hint">im Blog</span>
    </NuxtLink>
  </section>
</template>

<style scoped>
.comments {
  max-width: 44rem;
  margin-inline: auto;
  padding-bottom: clamp(3rem, 6vw, 4.5rem);
  border-top: 1px solid var(--color-graphite-700);
  padding-top: clamp(2.5rem, 5vw, 3.5rem);
}

.comments__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.comments__rail {
  width: 2.25rem;
  height: 0.5rem;
}

/* Zähler als Instrumentenablesung — Tabularziffern, damit nichts springt. */
.comments__count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  color: var(--color-accent-400);
  font-variant-numeric: tabular-nums;
}

.comments__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.comments__list > li + li {
  border-top: 1px solid var(--color-graphite-800);
}

.comments__pending {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2rem 0;
}
.comments__pending-line {
  height: 1px;
  background: var(--color-graphite-700);
  animation: comment-pulse 1.4s ease-in-out infinite;
}
.comments__pending-line:nth-child(2) { width: 82%; animation-delay: 140ms; }
.comments__pending-line:nth-child(3) { width: 56%; animation-delay: 280ms; }

@keyframes comment-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .comments__pending-line { animation: none; }
}

.comments__note {
  padding: 1.75rem 0;
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--color-steel-500);
}
.comments__note--empty {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-steel-600);
}

.comments__link {
  color: var(--color-accent-300);
  text-underline-offset: 4px;
  text-decoration: underline;
  text-decoration-thickness: 1px;
}
.comments__link:hover {
  color: var(--color-accent-200);
}

.comments__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 2rem;
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--color-graphite-600);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  transition: color 200ms ease, border-color 200ms ease, background-color 200ms ease;
}
.comments__cta:hover {
  color: var(--color-accent-300);
  border-color: var(--color-accent-700);
  background: rgba(33, 164, 163, 0.05);
}

.comments__cta-hint {
  color: var(--color-steel-600);
  letter-spacing: 0.12em;
}
</style>
