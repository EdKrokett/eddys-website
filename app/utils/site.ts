/**
 * Zentrale Kontakt- und Profil-Daten. Stand 30.08.2026 vollständig gepflegt.
 *
 * `url: null` bleibt als Möglichkeit erhalten (siehe `activeSocialProfiles`), auch wenn
 * aktuell kein Eintrag sie nutzt: Ein Profil, dessen URL noch nicht bestätigt ist, soll
 * eintragbar sein, ohne dass ein toter Link auf der Seite landet.
 */

export const CONTACT_EMAIL = 'info@eduard-andrae.de'

/**
 * Terminbuchung. Bewusst nur als Link (neuer Tab), nicht als eingebettetes
 * Calendly-Popup: Das Widget verlangt Calendlys eigenes Skript im Seitenkopf und
 * wäre damit eine Drittanbieter-Einbindung mit eigener Datenverarbeitung — im
 * Widerspruch zur Datenschutzerklärung, die zusagt, dass nichts automatisch
 * eingebettet wird und eine Verbindung erst beim Klick entsteht.
 */
export const CALENDLY_URL: string | null = 'https://calendly.com/trustedblogs/besprechung'

export interface SocialProfile {
  name: string
  /** Leer lassen, solange die URL nicht bestätigt ist — der Eintrag wird dann ausgeblendet. */
  url: string | null
  icon: string
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/eduard-andrae/', icon: 'lucide:linkedin' },
  { name: 'Facebook', url: 'https://www.facebook.com/schweinehundbesieger', icon: 'lucide:facebook' },
  { name: 'trusted blogs', url: 'https://www.trusted-blogs.com/hilfe/das-team', icon: 'lucide:globe' },
]

/** Nur Profile mit bestätigter URL — verhindert tote Links im Footer. */
export function activeSocialProfiles(): Array<SocialProfile & { url: string }> {
  return SOCIAL_PROFILES.filter(
    (profile): profile is SocialProfile & { url: string } =>
      typeof profile.url === 'string' && profile.url.length > 0,
  )
}

// BLOG_CATEGORIES liegt in shared/utils/blog-categories.ts — die Server-Route
// braucht die WordPress-IDs für den Kategorie-Filter, shared/ ist auf beiden Seiten
// auto-importiert.
