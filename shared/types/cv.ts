export interface CvStation {
  /** Anzeigeform des Zeitraums, z. B. "2016" oder "1991—1999". */
  period: string
  /** Für die Sortierung/Gruppierung; Jahr des Beginns. */
  startYear: number
  /**
   * Jahr des Endes; `undefined` heißt "läuft noch".
   *
   * Steht ausdrücklich im Datenmodell, statt aus der Folgestation abgeleitet zu werden:
   * Die Stationen ÜBERLAPPEN (trusted blogs seit 2016 und team neusta seit 2018 laufen
   * parallel), eine Ableitung wäre also schlicht falsch. Einzige Quelle für die
   * Balkenlänge auf der Jahresachse und für die Dauerangabe in der Timeline.
   */
  endYear?: number
  role: string
  company: string
  location?: string
  description: string
  /** Läuft die Station aktuell noch? Steuert die Markierung auf der Timeline. */
  current?: boolean
}

export interface CvEducation {
  period: string
  qualification: string
  institution: string
}

export interface CvCertificate {
  year: string
  name: string
  issuer: string
}

export interface CvSkill {
  name: string
  /** Selbsteinschätzung 1—5 aus dem team-neusta-Kompetenzprofil. */
  level: 1 | 2 | 3 | 4 | 5
}

export interface CvSkillGroup {
  title: string
  skills: CvSkill[]
}

export interface CvProject {
  name: string
  period: string
  role: string
  description: string
  /** Projekt ist unter dieser Adresse erreichbar — speist die Kennzahl "davon online". */
  url?: string
  /**
   * Weiterführender Beitrag im eigenen Blog, als interne Route.
   *
   * Bewusst NICHT über `url` gelöst: `url` heißt "läuft noch und ist dort erreichbar"
   * und wird extern im neuen Tab geöffnet. Ein geschlossenes Projekt darf in der
   * Kennzahl "davon online" nicht mitzählen, hat aber trotzdem eine Geschichte.
   */
  story?: {
    /** Interne Route, z. B. "/blog/mein-beitrag". */
    to: string
    /** Linktext — der Titel des Beitrags, nicht "hier klicken". */
    label: string
  }
}

export interface CvLanguage {
  name: string
  level: string
  /** Augenzwinkernder Eintrag — wird optisch abgesetzt dargestellt. */
  playful?: boolean
}

export interface CvFact {
  value: string
  label: string
}

/**
 * Ein Kapitel der "Über mich"-Seite — dieselbe Datenquelle für die Übersicht oben
 * (CvChapters) und die Sticky-Leiste beim Scrollen (CvChapterBar).
 */
export interface CvChapter {
  /** Muss der `id` der zugehörigen <section> entsprechen; Ziel des Ankersprungs. */
  id: string
  /** Laufende Nummer als Anzeigeform, z. B. "01". */
  num: string
  /** Kurzform für die schmale Sticky-Leiste. */
  label: string
  /** Volle Überschrift für die Übersicht. */
  title: string
  /** Ein Satz dazu, was das Kapitel enthält. */
  teaser: string
  /**
   * Kennzahlen wie "8 Stationen". Werden IMMER aus den Datenlängen berechnet, nie von
   * Hand gezählt — sonst veralten sie beim nächsten Eintrag in app/utils/cv.ts still.
   */
  metrics: string[]
}
