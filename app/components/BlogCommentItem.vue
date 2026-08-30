<script setup lang="ts">
import type { WordPressCommentNode } from '#shared/types/wordpress'

/**
 * Ein Kommentar samt seiner Antworten — rekursiv, weil 27 von 50 Kommentaren
 * Antworten sind (Messung 30.08.2026, siehe docs/blog-kommentare.md).
 *
 * `paragraphs` kommt bereits als reiner Text vom Server und wird per `v-text`
 * gerendert: Kommentare sind Fremdtext, hier ist bewusst kein `v-html`.
 * Der Baum ist garantiert zyklenfrei (`buildCommentThreads`), sonst würde diese
 * Rekursion nie terminieren.
 */
const props = withDefaults(
  defineProps<{ comment: WordPressCommentNode, depth?: number }>(),
  { depth: 0 },
)

/** Ab Ebene 3 nicht weiter einrücken — sonst bleibt auf dem Handy keine Zeilenbreite. */
const MAX_INDENT_DEPTH = 3
const isIndented = computed(() => props.depth > 0 && props.depth <= MAX_INDENT_DEPTH)

/** Monogramm statt Gravatar: kein externer Request, kein Datenschutz-Punkt. */
const monogram = computed(() => props.comment.authorName.trim().charAt(0).toUpperCase() || '?')
</script>

<template>
  <li class="comment" :class="{ 'comment--reply': isIndented }">
    <article class="comment__box">
      <span
        class="comment__mono"
        :class="{ 'comment__mono--author': comment.isSiteAuthor }"
        aria-hidden="true"
        v-text="monogram"
      />

      <div class="comment__main">
        <p class="comment__meta">
          <NuxtLink
            v-if="comment.authorUrl"
            :to="comment.authorUrl"
            external
            target="_blank"
            rel="nofollow ugc noopener noreferrer"
            class="comment__name comment__name--link"
          >
            <!-- Interpolation statt v-text: auf einer Komponente ist v-text unzulässig,
                 escaped wird der Fremdname hier genauso. -->
            {{ comment.authorName }}
          </NuxtLink>
          <span v-else class="comment__name" v-text="comment.authorName" />

          <span v-if="comment.isSiteAuthor" class="comment__badge">Autor</span>

          <span class="comment__sep" aria-hidden="true" />

          <NuxtTime
            :datetime="comment.date"
            day="2-digit"
            month="2-digit"
            year="numeric"
            locale="de-DE"
            class="comment__date"
          />
        </p>

        <p
          v-for="(paragraph, index) in comment.paragraphs"
          :key="index"
          class="comment__text"
          v-text="paragraph"
        />
      </div>
    </article>

    <ul v-if="comment.replies.length" class="comment__replies">
      <BlogCommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :depth="depth + 1"
      />
    </ul>
  </li>
</template>

<style scoped>
.comment {
  position: relative;
}

/* Antwort-Rail: die Haarlinie führt vom Elternkommentar herunter zur Antwort. */
.comment--reply {
  padding-left: clamp(1rem, 4.5vw, 2.25rem);
}
.comment--reply::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-graphite-700);
}
.comment--reply::after {
  content: '';
  position: absolute;
  left: 0;
  top: 1.55rem;
  width: clamp(0.6rem, 3vw, 1.35rem);
  height: 1px;
  background: var(--color-graphite-700);
}

.comment__box {
  display: flex;
  gap: clamp(0.75rem, 2.5vw, 1.125rem);
  padding: 1.5rem 0;
}

/* Monogramm auf Indexraster — nimmt das Zifferblatt-Motiv der Seite auf. */
.comment__mono {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-900);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--color-steel-400);
}

.comment__mono--author {
  border-color: var(--color-accent-700);
  color: var(--color-accent-300);
  background:
    radial-gradient(120% 120% at 50% 0%, rgba(33, 164, 163, 0.14) 0%, transparent 70%),
    var(--color-graphite-900);
}

.comment__main {
  min-width: 0;
  flex: 1;
}

.comment__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.comment__name {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-steel-200);
  /* Fremder Anzeigename ohne Leerzeichen darf das Layout nicht sprengen. */
  overflow-wrap: anywhere;
}

.comment__name--link {
  border-bottom: 1px solid var(--color-graphite-600);
  padding-bottom: 1px;
  transition: color 200ms ease, border-color 200ms ease;
}
.comment__name--link:hover {
  color: var(--color-accent-300);
  border-color: var(--color-accent-700);
}

.comment__badge {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-brass-400);
  border: 1px solid var(--color-brass-500);
  padding: 0.05rem 0.4rem;
}

.comment__sep {
  width: 0.75rem;
  height: 1px;
  background: var(--color-graphite-600);
}

.comment__date {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-steel-600);
  font-variant-numeric: tabular-nums;
}

.comment__text {
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-300);
  /* Der Server liefert Zeilenumbrüche aus <br> als echte \n mit. */
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.comment__text + .comment__text {
  margin-top: 0.85em;
}

.comment__replies {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
