<script setup lang="ts">
import type { CommentReplyTarget, SentComment } from '~/composables/useCommentForm'

/**
 * Kommentarbereich unter einem Beitrag: Anzeige aus WordPress, darunter das Formular für
 * neue Kommentare und Antworten.
 *
 * Bis 22.11.2026 führte die Schaltfläche „Kommentar schreiben“ auf das Formular im
 * WordPress-Beitrag. Diese Adresse leitet seit der Headless-Umstellung (13.11.2026) auf
 * die Nuxt-Seite zurück, es gibt also keinen WordPress-Beitrag mehr, auf den ein Link
 * zeigen könnte (docs/error-catalog.md). Deshalb enthält dieser Bereich KEINEN Link auf
 * `blog.eduard-andrae.de` mehr. Weg eines Kommentars: docs/blog-kommentare.md.
 */
const props = defineProps<{ slug: string, postId: number }>()

const { threads, total, truncated, status, refresh } = useBlogComments(props.slug)

/** Erst beim ersten Öffnen eingehängt, danach nur noch versteckt: Die Eingabe bleibt stehen. */
const formMounted = ref(false)
const formOpen = ref(false)
const replyTo = ref<CommentReplyTarget | null>(null)

/** Im selben Besuch gesendete Kommentare, als Prüfschein unter der Liste. */
const sentComments = ref<SentComment[]>([])

const form = useTemplateRef<{ focus: () => void }>('form')
const receipts = useTemplateRef<HTMLElement>('receipts')

async function openForm() {
  formMounted.value = true
  formOpen.value = true
  await nextTick()
  form.value?.focus()
}

function toggleForm() {
  if (formOpen.value) {
    formOpen.value = false
    return
  }
  replyTo.value = null
  openForm()
}

// Jeder BlogCommentItem ruft das über seinen „Antworten“-Knopf auf (rekursiv verschachtelt,
// deshalb Provide/Inject statt durchgereichter Events).
provide(COMMENT_REPLY_KEY, (target) => {
  replyTo.value = target
  openForm()
})

async function onSent(comment: SentComment) {
  // Neues Array statt push: so stimmt es auch, falls die Liste einmal ein shallowRef wird.
  sentComments.value = [...sentComments.value, comment]
  formOpen.value = false
  replyTo.value = null

  // Fokus auf den Prüfschein: Das Formular verschwindet, und ohne Ziel fiele der Fokus
  // an den Seitenanfang.
  await nextTick()
  receipts.value?.focus({ preventScroll: true })
  receipts.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
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
      <button type="button" class="comments__link" @click="refresh()">
        Erneut versuchen
      </button>
    </p>

    <template v-else-if="threads.length">
      <ul class="comments__list">
        <BlogCommentItem v-for="comment in threads" :key="comment.id" :comment="comment" />
      </ul>

      <p v-if="truncated" class="comments__note">
        Dieser Beitrag hat mehr Kommentare, als sich auf einmal laden lassen. Zu sehen sind die
        ältesten {{ total }}.
      </p>
    </template>

    <p v-else class="comments__note comments__note--empty">
      Noch kein Kommentar zu diesem Beitrag.
    </p>

    <!-- Prüfscheine: was in diesem Besuch gesendet wurde. Text stammt aus der eigenen
         Eingabe und wird per v-text gerendert. -->
    <ol
      v-if="sentComments.length"
      ref="receipts"
      class="receipts"
      tabindex="-1"
      aria-label="Gesendete Kommentare"
    >
      <li
        v-for="sent in sentComments"
        :key="sent.id"
        class="receipt"
        :class="sent.status === 'approved' ? 'receipt--approved' : 'receipt--hold'"
      >
        <p class="receipt__stamp" role="status">
          <Icon v-if="sent.status === 'approved'" name="lucide:check" class="size-3.5" />
          <Icon v-else name="lucide:clock" class="size-3.5" />
          {{ sent.status === 'approved' ? 'Veröffentlicht' : 'Wartet auf Freigabe' }}
        </p>

        <p class="receipt__meta">
          <span class="receipt__name" v-text="sent.authorName" />
          <template v-if="sent.replyToName">
            <span class="receipt__sep" aria-hidden="true" />
            <span>Antwort an <span v-text="sent.replyToName" /></span>
          </template>
        </p>

        <p
          v-for="(paragraph, index) in sent.paragraphs"
          :key="index"
          class="receipt__text"
          v-text="paragraph"
        />

        <p class="receipt__note">
          <template v-if="sent.status === 'approved'">
            Gespeichert und öffentlich. In der Liste oben steht der Kommentar nach dem nächsten
            Laden der Seite.
          </template>
          <template v-else>
            Angekommen. Der Kommentar erscheint hier, sobald er freigegeben ist.
          </template>
        </p>
      </li>
    </ol>

    <button
      type="button"
      class="comments__cta"
      :aria-expanded="formOpen"
      @click="toggleForm"
    >
      <Icon v-if="formOpen" name="lucide:x" class="size-4" />
      <Icon v-else name="lucide:pen-line" class="size-4" />
      {{ formOpen ? 'Formular schließen' : sentComments.length ? 'Weiteren Kommentar schreiben' : 'Kommentar schreiben' }}
    </button>

    <BlogCommentForm
      v-if="formMounted"
      v-show="formOpen"
      ref="form"
      :post-id="postId"
      :reply-to="replyTo"
      @sent="onSent"
      @clear-reply="replyTo = null"
    />
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
  margin-left: 0.25rem;
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

/*
 * Prüfschein für einen gerade gesendeten Kommentar. Der Stempel sagt, was mit ihm
 * geschehen ist: Teal für veröffentlicht, Messing für die Warteschlange.
 */
.receipts {
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}
.receipts:focus-visible {
  outline-offset: 6px;
}

.receipt {
  --receipt-tone: var(--color-brass-400);
  position: relative;
  padding: 1.25rem clamp(1rem, 4vw, 1.5rem) 1.25rem clamp(1.25rem, 5vw, 2rem);
  border: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-900);
}
.receipt--approved {
  --receipt-tone: var(--color-accent-300);
}
/* Senkrechte Strichreihe am linken Rand, wie die Minuterie eines Zifferblatts. */
.receipt::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.4rem;
  background-image: repeating-linear-gradient(
    to bottom,
    var(--receipt-tone) 0 1px,
    transparent 1px 8px
  );
  opacity: 0.7;
}

.receipt__stamp {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--receipt-tone);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--receipt-tone);
  transform-origin: left center;
  animation: receipt-stamp 420ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
@keyframes receipt-stamp {
  from { opacity: 0; transform: scale(1.35) rotate(-3deg); }
  to { opacity: 1; transform: none; }
}

.receipt__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin: 0.9rem 0 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-steel-500);
  overflow-wrap: anywhere;
}
.receipt__name {
  color: var(--color-steel-200);
}
.receipt__sep {
  width: 0.75rem;
  height: 1px;
  background: var(--color-graphite-600);
}

.receipt__text {
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-steel-300);
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.receipt__text + .receipt__text {
  margin-top: 0.85em;
}

.receipt__note {
  margin-top: 0.9rem;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-steel-500);
}

@media (prefers-reduced-motion: reduce) {
  .receipt__stamp { animation: none; }
}
</style>
