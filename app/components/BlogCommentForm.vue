<script setup lang="ts">
import type { CommentReplyTarget, SentComment } from '~/composables/useCommentForm'
import type { CommentField } from '#shared/utils/comment-submit'

/**
 * Kommentarformular unter einem Beitrag: ein „Eintrag ins Protokoll“.
 *
 * Gestaltung im Präzisionswerk-Motiv: Haarlinien statt Kästen, jedes Feld trägt eine
 * Indexziffer in Mono, Teal nur für Fokus und Absenden, Messing für Fehlermeldungen (die
 * Palette hat bewusst kein Rot).
 *
 * Versand und Prüfung liegen in `useCommentForm` und `shared/utils/comment-submit.ts`,
 * hier steht nur die Darstellung. Weg eines Kommentars: docs/blog-kommentare.md.
 */
const props = defineProps<{
  postId: number
  replyTo: CommentReplyTarget | null
}>()

const emit = defineEmits<{
  sent: [comment: SentComment]
  clearReply: []
}>()

const { draft, status, fieldErrors, errorMessage, clearFieldError, submit } = useCommentForm(() => props.postId)

const uid = useId()
const fieldId = (field: CommentField) => `${uid}-${field}`
const errorId = (field: CommentField) => `${uid}-${field}-error`

const contentField = useTemplateRef<HTMLTextAreaElement>('contentField')
const formElement = useTemplateRef<HTMLFormElement>('formElement')

/** Reihenfolge der Felder im Formular, für den Sprung zum ersten fehlerhaften. */
const FIELD_ORDER: CommentField[] = ['content', 'name', 'email', 'url']

async function onSubmit() {
  const sent = await submit(props.replyTo)

  if (sent) {
    emit('sent', sent)
    return
  }

  // Erstes fehlerhaftes Feld fokussieren, damit die Meldung nicht übersehen wird.
  const firstInvalid = FIELD_ORDER.find(field => fieldErrors.value[field])
  if (firstInvalid) {
    await nextTick()
    formElement.value?.querySelector<HTMLElement>(`#${CSS.escape(fieldId(firstInvalid))}`)?.focus()
  }
}

/** Von `BlogComments` aufgerufen, wenn das Formular geöffnet oder eine Antwort begonnen wird. */
function focus() {
  contentField.value?.focus({ preventScroll: true })
  formElement.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

defineExpose({ focus })
</script>

<template>
  <form
    ref="formElement"
    class="cform"
    novalidate
    :aria-busy="status === 'pending'"
    @submit.prevent="onSubmit"
  >
    <span class="cform__rail index-rail" aria-hidden="true" />

    <header class="cform__head">
      <p class="cform__title">
        {{ replyTo ? 'Antwort schreiben' : 'Kommentar schreiben' }}
      </p>

      <p v-if="replyTo" class="cform__reply">
        <Icon name="lucide:corner-down-right" class="size-3.5 shrink-0" />
        <span class="cform__reply-label">an</span>
        <!-- Fremder Anzeigename: Interpolation escaped. -->
        <span class="cform__reply-name">{{ replyTo.authorName }}</span>
        <button type="button" class="cform__reply-clear" @click="emit('clearReply')">
          <Icon name="lucide:x" class="size-3.5" />
          <span class="sr-only">Antwort verwerfen, stattdessen allgemein kommentieren</span>
        </button>
      </p>
    </header>

    <!-- 01 · Kommentar -->
    <div class="cform__field" :class="{ 'cform__field--invalid': fieldErrors.content }">
      <label :for="fieldId('content')" class="cform__label">
        <span class="cform__index" aria-hidden="true">01</span>
        Kommentar
      </label>
      <textarea
        :id="fieldId('content')"
        ref="contentField"
        v-model="draft.content"
        class="cform__control cform__control--area"
        rows="6"
        required
        :aria-invalid="fieldErrors.content ? 'true' : undefined"
        :aria-describedby="fieldErrors.content ? errorId('content') : undefined"
        @input="clearFieldError('content')"
      />
      <p v-if="fieldErrors.content" :id="errorId('content')" class="cform__error" v-text="fieldErrors.content" />
    </div>

    <div class="cform__row">
      <!-- 02 · Name -->
      <div class="cform__field" :class="{ 'cform__field--invalid': fieldErrors.name }">
        <label :for="fieldId('name')" class="cform__label">
          <span class="cform__index" aria-hidden="true">02</span>
          Name
        </label>
        <input
          :id="fieldId('name')"
          v-model="draft.name"
          type="text"
          class="cform__control"
          autocomplete="name"
          required
          :aria-invalid="fieldErrors.name ? 'true' : undefined"
          :aria-describedby="fieldErrors.name ? errorId('name') : undefined"
          @input="clearFieldError('name')"
        >
        <p v-if="fieldErrors.name" :id="errorId('name')" class="cform__error" v-text="fieldErrors.name" />
      </div>

      <!-- 03 · E-Mail -->
      <div class="cform__field" :class="{ 'cform__field--invalid': fieldErrors.email }">
        <label :for="fieldId('email')" class="cform__label">
          <span class="cform__index" aria-hidden="true">03</span>
          E-Mail
          <span class="cform__aside">nicht öffentlich</span>
        </label>
        <input
          :id="fieldId('email')"
          v-model="draft.email"
          type="email"
          class="cform__control"
          autocomplete="email"
          inputmode="email"
          required
          :aria-invalid="fieldErrors.email ? 'true' : undefined"
          :aria-describedby="fieldErrors.email ? errorId('email') : undefined"
          @input="clearFieldError('email')"
        >
        <p v-if="fieldErrors.email" :id="errorId('email')" class="cform__error" v-text="fieldErrors.email" />
      </div>
    </div>

    <!-- 04 · Website -->
    <div class="cform__field" :class="{ 'cform__field--invalid': fieldErrors.url }">
      <label :for="fieldId('url')" class="cform__label">
        <span class="cform__index" aria-hidden="true">04</span>
        Website
        <span class="cform__aside">freiwillig</span>
      </label>
      <input
        :id="fieldId('url')"
        v-model="draft.url"
        type="text"
        class="cform__control"
        autocomplete="url"
        inputmode="url"
        autocapitalize="off"
        spellcheck="false"
        :aria-invalid="fieldErrors.url ? 'true' : undefined"
        :aria-describedby="fieldErrors.url ? errorId('url') : undefined"
        @input="clearFieldError('url')"
      >
      <p v-if="fieldErrors.url" :id="errorId('url')" class="cform__error" v-text="fieldErrors.url" />
    </div>

    <!-- Meldung zum Versand. role="alert", damit ein Screenreader sie ohne Fokuswechsel liest. -->
    <p v-if="errorMessage" class="cform__alert" role="alert" v-text="errorMessage" />

    <footer class="cform__foot">
      <p class="cform__privacy">
        Name, Website und Kommentar erscheinen öffentlich, die E-Mail-Adresse nicht.
        Gespeichert wird im Blog, geprüft von Akismet.
        <NuxtLink to="/datenschutz#kommentare" class="cform__privacy-link">Datenschutz</NuxtLink>
      </p>

      <button type="submit" class="cform__submit" :disabled="status === 'pending'">
        <template v-if="status === 'pending'">
          <Icon name="lucide:loader-circle" class="cform__spinner size-4" />
          Wird gesendet
        </template>
        <template v-else>
          Absenden
          <Icon name="lucide:arrow-right" class="size-4" />
        </template>
      </button>
    </footer>
  </form>
</template>

<style scoped>
.cform {
  position: relative;
  margin-top: 2rem;
  padding: clamp(1.5rem, 4vw, 2.25rem) clamp(1.125rem, 4vw, 2.25rem) clamp(1.5rem, 4vw, 2rem);
  border: 1px solid var(--color-graphite-700);
  background:
    radial-gradient(90% 60% at 100% 0%, rgba(33, 164, 163, 0.06) 0%, transparent 70%),
    var(--color-graphite-900);
  animation: cform-in 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

@keyframes cform-in {
  from { opacity: 0; transform: translateY(0.5rem); }
  to { opacity: 1; transform: none; }
}

/* Indexraster an der Oberkante: dieselbe Strichreihe wie an Sektionsköpfen. */
.cform__rail {
  position: absolute;
  top: -1px;
  left: clamp(1.125rem, 4vw, 2.25rem);
  width: 4.5rem;
  height: 0.5rem;
  background-image: repeating-linear-gradient(
    to right,
    var(--color-accent-500) 0 1px,
    transparent 1px 8px
  );
}

.cform__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1.25rem;
  margin-bottom: 1.75rem;
}

.cform__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: 1.2;
  color: var(--color-steel-100);
}

.cform__reply {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-300);
}
.cform__reply-label {
  color: var(--color-steel-500);
}
.cform__reply-name {
  /* Fremder Name ohne Leerzeichen darf die Kopfzeile nicht sprengen. */
  overflow-wrap: anywhere;
}
.cform__reply-clear {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-graphite-600);
  color: var(--color-steel-400);
  transition: color 200ms ease, border-color 200ms ease;
}
.cform__reply-clear:hover {
  color: var(--color-steel-100);
  border-color: var(--color-steel-500);
}

.cform__row {
  display: grid;
  gap: 0 clamp(1.25rem, 4vw, 2.25rem);
}
@media (min-width: 40rem) {
  .cform__row {
    grid-template-columns: 1fr 1fr;
  }
}

.cform__field {
  margin-bottom: 1.5rem;
}

.cform__label {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-300);
}

/* Indexziffer wie auf einem Zifferblatt: klein, Teal, Tabularziffern. */
.cform__index {
  color: var(--color-accent-400);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.cform__aside {
  margin-left: auto;
  /* Bricht der Zusatz um, stehen Name und E-Mail nicht mehr auf einer Linie. */
  white-space: nowrap;
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  color: var(--color-steel-500);
}

/*
 * Eingabe als Linie statt Kasten. 17px Schrift: lesbar, und iOS zoomt bei Feldern unter
 * 16px beim Fokus in die Seite hinein.
 */
.cform__control {
  display: block;
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.6rem 0;
  border: 0;
  border-bottom: 1px solid var(--color-graphite-600);
  border-radius: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-steel-100);
  caret-color: var(--color-accent-300);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.cform__control:hover {
  border-bottom-color: var(--color-steel-600);
}
/* Fokus als zweite Linie in Teal statt des globalen Umrisses: Das Feld ist nur eine Linie. */
.cform__control:focus-visible {
  outline: none;
  border-bottom-color: var(--color-accent-400);
  box-shadow: 0 1px 0 0 var(--color-accent-400);
}

.cform__control--area {
  min-height: 9rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--color-graphite-600);
  background: var(--color-graphite-950);
  resize: vertical;
}
.cform__control--area:hover {
  border-color: var(--color-steel-600);
}
.cform__control--area:focus-visible {
  border-color: var(--color-accent-400);
  box-shadow: 0 0 0 1px var(--color-accent-400);
}

.cform__field--invalid .cform__control {
  border-color: var(--color-brass-400);
}
.cform__field--invalid .cform__index {
  color: var(--color-brass-400);
}

.cform__error {
  margin-top: 0.5rem;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--color-brass-300);
}

.cform__alert {
  margin-bottom: 1.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-brass-500);
  border-left-width: 3px;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-brass-300);
}

.cform__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-graphite-700);
}

.cform__privacy {
  flex: 1 1 18rem;
  max-width: 30rem;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-steel-500);
}
.cform__privacy-link {
  color: var(--color-accent-300);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}
.cform__privacy-link:hover {
  color: var(--color-accent-200);
}

/* Auf der Teal-Fläche steht dunkle Schrift (6,30:1), nie weiße (3,04:1). */
.cform__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-width: 11.5rem;
  padding: 0.875rem 1.5rem;
  border: 1px solid var(--color-accent-500);
  background: var(--color-accent-500);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-graphite-950);
  transition: background-color 200ms ease, border-color 200ms ease, gap 200ms ease;
}
/* Am Handy über die volle Breite: ein Ziel, das der Daumen nicht verfehlt. */
@media (max-width: 39.99rem) {
  .cform__submit {
    width: 100%;
  }
}
.cform__submit:hover:not(:disabled) {
  background: var(--color-accent-300);
  border-color: var(--color-accent-300);
  gap: 0.9rem;
}
.cform__submit:disabled {
  cursor: progress;
  border-color: var(--color-graphite-600);
  background: transparent;
  color: var(--color-steel-400);
}

.cform__spinner {
  animation: cform-spin 900ms linear infinite;
}
@keyframes cform-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .cform { animation: none; }
  .cform__spinner { animation-duration: 2.4s; }
  .cform__submit { transition: none; }
}
</style>
