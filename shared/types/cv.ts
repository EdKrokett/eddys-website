export interface CvStation {
  /** Anzeigeform des Zeitraums, z. B. "2016" oder "1991—1999". */
  period: string
  /** Für die Sortierung/Gruppierung; Jahr des Beginns. */
  startYear: number
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
  url?: string
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
