import type {
  KooperationKriterium,
  KooperationMediakit,
  KooperationReferenz,
  KooperationVorteil,
} from '#shared/types/kooperationen'

/**
 * Inhalte der Kooperationen-Seite, übernommen von blog.eduard-andrae.de/kooperationen/
 * (Stand 30.09.2026). Herkunft und Entscheidungen: `docs/kooperationen.md`.
 */

export const KOOPERATION_KRITERIEN: KooperationKriterium[] = [
  {
    label: 'Thematischer Fit',
    detail: 'Das Thema passt zum Blog und zu den Menschen, die ihn lesen.',
  },
  {
    label: 'Vergütung',
    detail: 'Das Angebot passt zum Aufwand, den ein guter Beitrag macht.',
  },
  {
    label: 'Rechtlich sauber',
    detail: 'Bezahlte Beiträge kennzeichne ich als „Werbung“, Links bekommen das Nofollow-Attribut.',
  },
]

/**
 * Die drei Beiträge der alten Seite, in derselben Reihenfolge (neueste zuerst).
 * Kuratiert statt live aus der Kategorie `werbung` geholt, Begründung in der Doku.
 */
export const KOOPERATION_REFERENZEN: KooperationReferenz[] = [
  {
    slug: 'koasa-trail-weitwandern-in-tirol',
    title: 'Koasa Trail: Weitwandern in Tirol',
    year: 2019,
    excerpt:
      'Kann man mir ansehen, wie wunderbar eine Wanderung in den Kitzbüheler Alpen ist, wenn man sich das Titelbild anschaut? Ganz ehrlich: es ist noch viel besser!',
    image: 'https://blog.eduard-andrae.de/wp-content/uploads/2019/06/koasatrail-titelbild.jpg',
  },
  {
    slug: 'tchibo-hat-das-zeug-zum-laufen-sponsored',
    title: 'Tchibo hat das Zeug zum Laufen',
    year: 2015,
    excerpt:
      'Rechtzeitig mit dem ersten Frost ist die neue Tchibo-Laufkollektion für den Winter erhältlich. Ist das Preis-Leistungs-Verhältnis überzeugend?',
    image: 'https://blog.eduard-andrae.de/wp-content/uploads/2015/10/IMG_2301-Kopie1.jpg',
  },
  {
    slug: 'sponsored-das-erste-bitburger-laufblogger-event',
    title: 'Das erste BITburger Laufblogger-Event',
    year: 2015,
    excerpt:
      'Wenn auf der Flasche „alkoholfrei“ steht, aber im Kleingedruckten etwas anderes, dann bekommt der Hersteller mit dem Blogger ein Problem …',
    image: 'https://blog.eduard-andrae.de/wp-content/uploads/2015/07/bit1.jpg',
  },
]

/** Schlagwort-Archiv aller gekennzeichneten Beiträge. Auf `/blog` gibt es keinen Schlagwort-Filter. */
export const KOOPERATION_WERBUNG_ARCHIV = 'https://blog.eduard-andrae.de/tag/werbung/'

/**
 * Direkt auf blog.eduard-andrae.de, nicht über www.eduard-andrae.de wie auf der alten
 * Seite: Das ginge inzwischen über zwei Weiterleitungen (siehe Doku).
 */
export const KOOPERATION_MEDIAKIT: KooperationMediakit = {
  url: 'https://blog.eduard-andrae.de/wp-content/uploads/2025/05/EduardAndrae_MediaKit.pdf',
  fileName: 'EduardAndrae_MediaKit.pdf',
  pages: 1,
  sizeKb: 240,
  stand: '10.04.2025',
}

/** Katalog-Nr. 76 ist Eddys Blog auf trusted blogs. */
export const TRUSTED_BLOGS_KATALOG_NR = 76

/** `ref=0000002D` ist Eddys Partner-Referral-ID und muss in der URL bleiben. */
export const TRUSTED_BLOGS_BOOKING_URL
  = `https://www.trusted-blogs.com/marktplatz/katalog/${TRUSTED_BLOGS_KATALOG_NR}?ref=0000002D`

export const KOOPERATION_VORTEILE: KooperationVorteil[] = [
  {
    title: 'Vollständiges Briefing in wenigen Minuten',
    text: 'Der interaktive Kampagnen-Konfigurator von trusted blogs führt dich Schritt für Schritt ganz easy durch die Konfiguration deines Briefings.',
  },
  {
    title: 'Verlässliche Unterlagen',
    text: 'Dein Briefing wird gespeichert und dient als verbindliche Grundlage für unsere Zusammenarbeit: Missverständnisse ausgeschlossen.',
  },
  {
    title: 'Kampagnen-Archiv',
    text: 'Abgeschlossene Kampagnen bleiben in deinem Account dauerhaft verfügbar und können dich auch für zukünftige Briefings inspirieren.',
  },
  {
    title: 'Kostenlose Nutzung der Plattform',
    text: 'Das Beste: Dir entstehen keine zusätzlichen Kosten, wenn du eine Kooperation mit mir über die Plattform von trusted blogs abwickelst!',
  },
]
