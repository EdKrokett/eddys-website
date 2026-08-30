import type {
  CvCertificate,
  CvEducation,
  CvFact,
  CvLanguage,
  CvProject,
  CvSkillGroup,
  CvStation,
} from '#shared/types/cv'

/**
 * Statische Inhalte der "Über mich"-Seite. Quellen und Rohmaterial (inkl. der
 * vollständigen ~70 Einzelskills) liegen in docs/content-sammlung.md — hier steht
 * bewusst nur die kuratierte Auswahl, die auf der Seite erscheint.
 *
 * Reine Daten, keine Logik: deshalb ohne eigene *.spec.ts.
 */

export const CV_FACTS: CvFact[] = [
  { value: '1966', label: 'geboren in Nettetal' },
  { value: '40', label: 'Jahre alt beim ersten Lauf' },
  { value: '9', label: 'Monate später: Berlin-Marathon' },
  { value: '2006', label: 'Blog seit' },
  { value: '2', label: 'Unternehmen gegründet' },
]

export const CV_STATIONS: CvStation[] = [
  {
    period: 'seit 2016',
    startYear: 2016,
    role: 'Gründer & Geschäftsführer',
    company: 'trusted blogs GmbH',
    location: 'Bremen',
    description:
      'Die führende Plattform für Kooperationen mit Blogs. Wir verbinden Marken mit Blogs, die thematisch wirklich passen — und machen ihre Inhalte bei Google und in KI-Overviews sichtbar.',
    current: true,
  },
  {
    period: 'seit 2018',
    startYear: 2018,
    role: 'Scrum Master & Agile Coach',
    company: 'team neusta',
    location: 'Bremen',
    description:
      'Scrum Master für Kundenprojekte. Mitwirkung in den Dienstleistungskreisen Personal, Akademie, Organisationsentwicklung und virtuelles Arbeiten.',
    current: true,
  },
  {
    period: '2015—2016',
    startYear: 2015,
    endYear: 2016,
    role: 'Product Owner trusted-blogs.com',
    company: 'team neusta',
    location: 'Bremen',
    description:
      'Carsten Meyer-Heder hat 2015 an meine Idee geglaubt und investiert. Innerhalb eines Jahres haben wir das Projekt von der Idee bis zum Launch entwickelt — 2016 als gemeinsames Startup ausgegründet.',
  },
  {
    period: '2010—2014',
    startYear: 2010,
    endYear: 2014,
    role: 'Project Manager',
    company: 'hmmh multimediahaus AG',
    location: 'Bremen',
    description:
      'Internationales Projektmanagement, E-Commerce-Betreuung und Beratung für Mittelstand und Konzerne.',
  },
  {
    period: '2008—2010',
    startYear: 2008,
    endYear: 2010,
    role: 'Projektleiter',
    company: 'Ströer Digital Media',
    location: 'Hamburg',
    description:
      'Projektleitung bei der Entwicklung von Online-Portalen, darunter getestet.de, rabattschlacht.de und orangedirect.de.',
  },
  {
    period: '2006—2008',
    startYear: 2006,
    endYear: 2008,
    role: 'Projektleiter E-Commerce',
    company: 'Haltermann & Schulte GmbH',
    location: 'Asendorf',
    description:
      'Aufbau und Leitung des Online-Vertriebs im B2B- und B2C-Großhandel.',
  },
  {
    period: '1999—2006',
    startYear: 1999,
    endYear: 2006,
    role: 'Gründer & Geschäftsführer',
    company: '1Apreis.de GmbH',
    location: 'Gütersloh',
    description:
      'Mein erstes Startup. „Markenartikel zu Hammerpreisen“ — radikal reduzierte Schnäppchen. Das damals völlig neuartige Konzept wurde vom Otto-Konzern als Discount24.de nachgebaut.',
  },
  {
    period: '1991—1999',
    startYear: 1991,
    endYear: 1999,
    role: 'Uhrmachermeister & Inhaber',
    company: 'Juwelier Andrae',
    location: 'Nettetal',
    description:
      'Im familiengeführten Fachgeschäft für Uhren & Schmuck zunächst angestellt, ab 1996 in der Geschäftsführung. Wegen der rasanten Entwicklung von Internet und E-Commerce habe ich das Geschäft schweren Herzens verkauft und mich neu orientiert.',
  },
]

export const CV_EDUCATION: CvEducation[] = [
  { period: '1990—1991', qualification: 'Meister, Uhrmacherei und Schmuckfertigung', institution: 'BBZ Hildesheim' },
  { period: '1986—1988', qualification: 'Berufskolleg II (BKFH)', institution: 'Hochschule Furtwangen' },
  { period: '1982—1985', qualification: 'Geselle, Uhrmacher', institution: 'Robert-Gerwig-Schule Furtwangen' },
]

export const CV_CERTIFICATES: CvCertificate[] = [
  { year: '2025', name: 'Make Advanced', issuer: 'Make' },
  { year: '2020', name: 'Professional Scrum Master', issuer: 'Scrum.org' },
  { year: '2014', name: 'Professional Scrum Product Owner', issuer: 'Scrum.org' },
  { year: '2011', name: 'PRINCE2 Foundation', issuer: 'APMG International' },
  { year: '1991', name: 'Uhrmachermeister', issuer: 'Handwerkskammer Hildesheim-Südniedersachsen' },
]

export const CV_SKILL_GROUPS: CvSkillGroup[] = [
  {
    title: 'Blog & Content',
    skills: [
      { name: 'Blog-Marketing', level: 5 },
      { name: 'Content Marketing', level: 5 },
      { name: 'Social Media Marketing', level: 4 },
      { name: 'E-Commerce', level: 4 },
    ],
  },
  {
    title: 'Agile & Zusammenarbeit',
    skills: [
      { name: 'Scrum', level: 5 },
      { name: 'Agile Methoden', level: 5 },
      { name: 'Konfliktmanagement', level: 5 },
      { name: 'Product Owner', level: 4 },
      { name: 'Moderation', level: 4 },
    ],
  },
  {
    title: 'Projekt & Steuerung',
    skills: [
      { name: 'Projektmanagement', level: 5 },
      { name: 'PRINCE2', level: 4 },
      { name: 'KANBAN', level: 4 },
      { name: 'ITIL', level: 4 },
    ],
  },
]

export const CV_PROJECTS: CvProject[] = [
  {
    name: 'trusted blogs',
    period: 'seit 2015',
    role: 'Gründer, Product Owner',
    description:
      'Blog-Suchmaschine, Marktplatz für Blog-Marketing und Blog-Magazin mit Statistik- und KI-Unterstützung.',
    url: 'https://www.trusted-blogs.com',
  },
  {
    name: 'Eddys Laufblog',
    period: 'seit 2006',
    role: 'Autor',
    description:
      'Seit dem ersten Lauf dokumentiert: Wettkämpfe, Wanderungen und alles, was beim Bloggen dazugehört.',
    url: 'https://blog.eduard-andrae.de',
  },
  {
    name: 'Manni Dein Finanzcoach',
    period: '2019—2021',
    role: 'Scrum Master',
    description:
      'App-Entwicklung für die ÜberseeHub GmbH — agile Begleitung von der Idee bis zum Release.',
  },
  {
    name: 'nasenspraysucht.info',
    period: 'seit 2008',
    role: 'Gründer',
    description:
      'Hilfsforum für Betroffene — aus eigener Erfahrung entstanden, seither eine Anlaufstelle.',
  },
  {
    name: '1Apreis.de',
    period: '1999—2006',
    role: 'Gründer & Geschäftsführer',
    description:
      'Mein erstes Startup und Schnäppchenportal. Das Konzept wurde vom Otto-Konzern als Discount24.de nachgebaut.',
  },
]

export const CV_LANGUAGES: CvLanguage[] = [
  { name: 'Deutsch', level: 'Muttersprache' },
  { name: 'Englisch', level: 'Verhandlungssicher' },
  { name: 'Niederländisch', level: 'Gut' },
  { name: 'Tacheles', level: 'Fließend', playful: true },
]
