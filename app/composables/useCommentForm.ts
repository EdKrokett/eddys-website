import type { InjectionKey } from 'vue'
import type {
  CommentDraft,
  CommentFieldErrors,
  CommentReceiptStatus,
} from '#shared/utils/comment-submit'
import {
  buildCommentPayload,
  commentErrorMessage,
  draftToParagraphs,
  parseCommentReceipt,
  readCommentFailure,
  validateCommentDraft,
} from '#shared/utils/comment-submit'

/** Der Kommentar, auf den geantwortet wird. */
export interface CommentReplyTarget {
  id: number
  authorName: string
}

/** Ein gerade gesendeter Kommentar, wie ihn der Prüfschein anzeigt. */
export interface SentComment {
  id: number
  status: CommentReceiptStatus
  authorName: string
  /** Aus der eigenen Eingabe, nicht aus der WordPress-Antwort. Rendern per `v-text`. */
  paragraphs: string[]
  replyToName?: string
}

/**
 * `BlogComments` stellt die Funktion bereit, jeder `BlogCommentItem` ruft sie über seinen
 * „Antworten“-Knopf auf. Provide/Inject statt Events, weil die Kommentare rekursiv
 * verschachtelt sind und jede Ebene das Ereignis sonst durchreichen müsste.
 */
export const COMMENT_REPLY_KEY: InjectionKey<(target: CommentReplyTarget) => void> = Symbol('comment-reply')

/** WordPress darf sich Zeit lassen (Akismet fragt einen fremden Dienst), aber nicht ewig. */
const SUBMIT_TIMEOUT_MS = 30_000

/**
 * Zustand und Versand des Kommentarformulars.
 *
 * Sendet direkt an die Route des Plugins `eddy-headless-redirect`, nicht über eine
 * Nitro-Route: Akismet und die Flood-Prüfung brauchen die IP-Adresse des Absenders.
 * Begründung und Ablauf: docs/blog-kommentare.md.
 *
 * PRE:  `postId` ist die WordPress-ID des Beitrags
 * POST: nach `submit()` ist `status` entweder 'success' (dann ist der Text geleert und
 *       das Ergebnis zurückgegeben) oder 'error' (dann steht `errorMessage`, und die
 *       Eingabe ist unverändert)
 * INV:  Name, E-Mail und Website bleiben nach dem Senden stehen, für einen zweiten
 *       Kommentar im selben Besuch. Gespeichert wird nichts (kein Cookie, kein Storage).
 */
export function useCommentForm(postId: MaybeRefOrGetter<number>) {
  const config = useRuntimeConfig()

  /**
   * Wann das Formular geöffnet wurde. Die Komponente entsteht erst nach dem Klick auf
   * „Kommentar schreiben“ und nur im Browser; der Wert belegt gegenüber Akismet, dass
   * JavaScript lief (dort Feld `ak_js`).
   */
  const openedAt = Date.now()

  const draft = reactive<CommentDraft>({ name: '', email: '', url: '', content: '' })
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const fieldErrors = ref<CommentFieldErrors>({})
  const errorMessage = ref('')

  /** Nimmt die Meldung am Feld weg, sobald der Leser es korrigiert. */
  function clearFieldError(field: keyof CommentDraft) {
    if (!fieldErrors.value[field]) return
    const { [field]: _removed, ...rest } = fieldErrors.value
    fieldErrors.value = rest
  }

  /**
   * @returns den gesendeten Kommentar, oder `null`, wenn nichts gesendet wurde
   * (Eingabefehler, Fehlschlag, oder es läuft bereits ein Versand).
   */
  async function submit(replyTo: CommentReplyTarget | null): Promise<SentComment | null> {
    if (status.value === 'pending') return null

    const errors = validateCommentDraft(draft)
    fieldErrors.value = errors
    errorMessage.value = ''

    if (Object.keys(errors).length > 0) {
      status.value = 'error'
      return null
    }

    status.value = 'pending'

    try {
      const response = await $fetch<unknown>(
        `${config.public.wordpressUrl}/wp-json/eddy-headless/v1/kommentare`,
        {
          method: 'POST',
          body: buildCommentPayload(draft, toValue(postId), replyTo?.id ?? 0, openedAt),
          // Volle Adresse des Beitrags als verweisende Seite. Die Voreinstellung der Browser
          // kürzt sie über Domain-Grenzen auf „https://eduard-andrae.de/“; Akismet sah dann
          // ein Formular, das nicht auf der Seite des Beitrags steht (Spam am 28.11.2026).
          referrerPolicy: 'no-referrer-when-downgrade',
          // Nie Cookies mitschicken: Der Absender ist für WordPress immer ein Gast, auch
          // wenn im selben Browser jemand in WP-Admin angemeldet ist.
          credentials: 'omit',
          timeout: SUBMIT_TIMEOUT_MS,
        },
      )

      const receipt = parseCommentReceipt(response)

      // 2xx ohne brauchbare id: Es hat nicht die erwartete Route geantwortet.
      if (!receipt) {
        status.value = 'error'
        errorMessage.value = commentErrorMessage({ status: 502 })
        return null
      }

      const sent: SentComment = {
        ...receipt,
        authorName: draft.name.trim(),
        paragraphs: draftToParagraphs(draft.content),
        replyToName: replyTo?.authorName,
      }

      draft.content = ''
      status.value = 'success'
      return sent
    } catch (error) {
      status.value = 'error'
      errorMessage.value = commentErrorMessage(readCommentFailure(error))
      return null
    }
  }

  return { draft, status, fieldErrors, errorMessage, clearFieldError, submit }
}
