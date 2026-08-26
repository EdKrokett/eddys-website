/**
 * Zentrale Kontakt- und Profil-Daten.
 *
 * OFFEN (von Eddy zu liefern): `CALENDLY_URL` und die noch leeren Social-Profile.
 * Bewusst leer statt geraten — die UI blendet nicht gepflegte Einträge aus, damit
 * nirgends ein toter Link steht.
 */

export const CONTACT_EMAIL = 'info@eduard-andrae.de'

/** Sobald der Calendly-Link vorliegt: hier eintragen, die Kontaktseite zeigt ihn dann an. */
export const CALENDLY_URL: string | null = null

export interface SocialProfile {
  name: string
  /** Leer lassen, solange die URL nicht bestätigt ist — der Eintrag wird dann ausgeblendet. */
  url: string | null
  icon: string
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/eduard-andrae/', icon: 'lucide:linkedin' },
  { name: 'Blog', url: 'https://blog.eduard-andrae.de', icon: 'lucide:rss' },
  { name: 'trusted blogs', url: 'https://www.trusted-blogs.com', icon: 'lucide:globe' },
  { name: 'YouTube', url: null, icon: 'lucide:youtube' },
  { name: 'Instagram', url: null, icon: 'lucide:instagram' },
]

/** Nur Profile mit bestätigter URL — verhindert tote Links im Footer. */
export function activeSocialProfiles(): Array<SocialProfile & { url: string }> {
  return SOCIAL_PROFILES.filter(
    (profile): profile is SocialProfile & { url: string } =>
      typeof profile.url === 'string' && profile.url.length > 0,
  )
}

/** Blog-Kategorien für die Filterleiste — Reihenfolge bewusst, nicht alphabetisch. */
export const BLOG_CATEGORIES = [
  { slug: 'laufen', label: 'Laufen' },
  { slug: 'wandern', label: 'Wandern' },
  { slug: 'bloggen', label: 'Bloggen' },
] as const
