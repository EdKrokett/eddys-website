import type {
  WerkbankBuild,
  WerkbankLesson,
  WerkbankMetric,
  WerkbankScenario,
  WerkbankTool,
} from '#shared/types/werkbank'

/**
 * Inhalte der Werkbank-Seite. Quellen, Herleitung und die Begründung für jede Zahl
 * stehen in `docs/werkbank.md`.
 *
 * ── Warum Konstanten und nicht aus git/API? ────────────────────────────────────
 * Die trusted-blogs-Zahlen stammen aus einem anderen, privaten Repo, das beim
 * Vercel-Build nicht existiert; die Make-Zahlen kämen aus einer API, die einen Token
 * bräuchte. Beides zur Laufzeit zu holen hieße, ein Geheimnis ins Deployment zu legen,
 * um eine Zahl anzuzeigen, die sich monatlich kaum ändert.
 *
 * Dafür gilt: JEDE Zahl hier hat einen Stichtag, und der steht sichtbar auf der Seite.
 * Beim Aktualisieren den Stichtag MITZIEHEN — sonst behauptet die Seite eine
 * Aktualität, die sie nicht hat.
 */

/** Stichtag aller Kennzahlen auf dieser Seite. Als Anzeigeform, nicht als Date-Objekt. */
export const WERKBANK_STICHTAG = '12. September 2026'

// ── Das Buch ───────────────────────────────────────────────────────────────────
/**
 * Das Zitat aus Anhang F „Dank". Kurzzitat als Beleg mit voller Quellenangabe
 * (§ 51 UrhG). Wortlaut NICHT anpassen oder kürzen — ein Zitat, das geglättet wird,
 * ist keines mehr.
 */
export const WERKBANK_ZITAT = {
  heading: 'Für den Beweis, dass es geht.',
  body:
    'Eduard Andrae, der seine Plattform trusted blogs 2025 und 2026 vollständig neu gebaut '
    + 'hat, ausschließlich mit KI. Er hat mir Anfang Mai 2026 gezeigt, dass auch fachlich '
    + 'komplexe Anwendungen so entstehen können.',
  author: 'Manfred Wolff',
  work: 'Software mit KI entwickeln',
  detail: 'Version 1.5, August 2026 — Anhang F, Seite 175',
  url: 'https://mwolff.org/whitepapers/Softwareentwicklung-mit-ki-buch-v1.5.pdf',
} as const

/** Wolffs Beschreibung der fachlichen Komplexität, Seite 6 desselben Buches. */
export const WERKBANK_KOMPLEXITAET = {
  quote:
    'Das ist kein Webauftritt mit ein paar Unterseiten. Es ist ein zweiseitiger Marktplatz: '
    + 'zwei Nutzergruppen mit eigenen Rollen und Rechten, ein durchsuchbarer Katalog mit '
    + 'Filtern, Buchungs- und Freigabestrecken, Honorarlogik, Zahlung erst nach '
    + 'Veröffentlichung, dazu ein redaktioneller Bereich.',
  page: 'Seite 6',
} as const

// ── Der Neubau ─────────────────────────────────────────────────────────────────
/**
 * Altsystem gegen Neubau. Die Balkenlängen werden aus `commits` gerechnet, nicht
 * gepflegt — sonst laufen Zahl und Balken auseinander.
 *
 * Der zweite Eintrag heißt bewusst „Das neue System" und nicht „Der Neubau": Der
 * eigentliche Neubau war im Mai 2026 fertig, die Commits laufen aber bis heute weiter,
 * weil seitdem Funktionen dazukommen. „Der Neubau … in 7 Monaten" würde eine Bauzeit
 * behaupten, die so nicht stimmt.
 */
export const WERKBANK_BUILDS: WerkbankBuild[] = [
  {
    label: 'Das gewachsene System',
    period: 'Februar 2015 — August 2025',
    commits: 7296,
    months: 126,
  },
  {
    label: 'Das neue System, mit KI gebaut',
    period: 'Februar 2026 — September 2026',
    commits: 2562,
    months: 7,
    current: true,
  },
]

export const WERKBANK_NEUBAU_METRIKEN: WerkbankMetric[] = [
  { value: '2.562', label: 'Commits, davon 2.450 von mir' },
  { value: '1.477', label: 'Dateien' },
  { value: '333', label: 'zusammengeführte Zweige' },
  { value: '103', label: 'Markdown-Dokumente', accent: true },
]

// ── Die Maschinen ──────────────────────────────────────────────────────────────
/**
 * Fünf der neunzehn Szenarien, nach Modulzahl absteigend. Eine vollständige Tabelle
 * wäre eine Inventarliste, keine Aussage.
 *
 * Bewusst NICHT „die fünf größten“: Auf Platz drei nach Modulzahl stünde
 * „Pinterest: Multi-PIN-Erstellung“ (56 Module, 0 Läufe). Ein gebautes, aber nie
 * gestartetes Szenario in einer Tabelle, die zeigen soll, was läuft, wirft beim Lesen
 * mehr Fragen auf, als es beantwortet. Stattdessen steht dort eines der Publer-
 * Szenarien mit echten Laufzahlen.
 */
export const WERKBANK_SZENARIEN: WerkbankScenario[] = [
  { name: 'Promotion erstellen', modules: 115, runs: 482, operations: 13321 },
  { name: 'KI-Blogpost erstellen', modules: 87, runs: 49, operations: 1437 },
  { name: 'Publer-API: Pinterest', modules: 41, runs: 161, operations: 1629 },
  { name: 'Promos: Kacheln + Mail', modules: 26, runs: 152, operations: 3515 },
  { name: 'Content-Versand', modules: 26, runs: 160, operations: 3327 },
]

export const WERKBANK_MAKE_METRIKEN: WerkbankMetric[] = [
  { value: '19', label: 'Szenarien, alle aktiv' },
  { value: '115', label: 'Module im größten davon', accent: true },
  { value: '20', label: 'angebundene Dienste' },
  { value: '29.110', label: 'Operationen gelaufen' },
]

export const WERKBANK_WERKZEUGE: WerkbankTool[] = [
  {
    name: 'Claude Code',
    role: 'Schreibt, prüft und erklärt den Code, direkt im Editor und mit Blick auf das ganze Projekt.',
  },
  {
    name: 'Make',
    role: 'Verbindet zwanzig Dienste zu Ketten, die ohne eine Zeile Code laufen.',
  },
  {
    name: 'ChatGPT',
    role: 'Steckt in den Szenarien selbst und formuliert dort, wo eine Maschine Text braucht.',
  },
  {
    name: 'GitLab & VS Code',
    role: 'Der Tresor und die Werkstatt. Jede Änderung bleibt nachvollziehbar und umkehrbar.',
  },
  {
    name: 'Placid & Cloudinary',
    role: 'Erzeugen die Bilder, die sonst jedes Mal jemand von Hand bauen müsste.',
  },
]

// ── Wo es klemmte ──────────────────────────────────────────────────────────────
/**
 * Vier Lektionen aus `tb26-code/docs/ai-lessons.md` — dem fortlaufenden
 * Lessons-Learned des Neubaus. Für Lesende ohne Entwicklerhintergrund übersetzt,
 * aber nicht verwässert: Jede beschreibt einen echten Fehlschlag, keine Binsenweisheit.
 */
export const WERKBANK_LEKTIONEN: WerkbankLesson[] = [
  {
    title: 'Die KI übertreibt, wenn sie sich selbst prüft',
    text:
      'Ein Prüflauf meldete 30 bis 40 Prozent überflüssigen Text in meinen eigenen Regeln. '
      + 'Nachgezählt waren es zehn Zeilen. Seitdem gilt: Jeder Befund wird gegen die Datei '
      + 'gehalten, bevor irgendetwas daraufhin geändert wird.',
  },
  {
    title: 'Zu viele Regeln heben sich gegenseitig auf',
    text:
      'Ab etwa zehn Anweisungen fängt ein Modell an, einzelne zu übergehen. Ich hatte das '
      + 'Wort „Pflicht" achtmal in einer Datei stehen. Jedes weitere Mal hat die sieben davor '
      + 'geschwächt. Heute stehen dort höchstens drei.',
  },
  {
    title: 'Was auf meinem Rechner wirkt, muss auf dem Server nicht wirken',
    text:
      'Meine Schutzregeln verwiesen auf Pfade, die es nur auf meinem Mac gibt. Auf dem '
      + 'Linux-Server liefen sie monatelang ins Leere, ohne eine einzige Fehlermeldung. Von '
      + 'allein wäre mir das nie aufgefallen.',
  },
  {
    title: 'Prüfen muss die Maschine',
    text:
      'Am Anfang standen meine wichtigsten Regeln als Text in der Anleitung. Sobald es eilig '
      + 'wurde, hat die KI sie übergangen, und ich habe es erst hinterher gemerkt. Heute hängt '
      + 'alles Wichtige an einem Skript, das den Build abbricht. Ein Skript kann man nicht '
      + 'überlesen.',
  },
]

// ── Diese Website ──────────────────────────────────────────────────────────────
export const WERKBANK_SITE_METRIKEN: WerkbankMetric[] = [
  { value: '42', label: 'Commits' },
  { value: '4', label: 'Wochen' },
  { value: '8.955', label: 'Zeilen Vue und TypeScript' },
  { value: '0', label: 'Zeilen Vue, die ich selbst schreiben kann', accent: true },
]

/**
 * Öffentliche, entpersonalisierte Fassung der Setup-Anleitung.
 *
 * Bewusst frei verlinkt statt hinter einem Formular: Der Werkzeugkasten ist ein
 * weiterer Beleg, kein Produkt. Begründung in `docs/werkbank.md`.
 */
export const WERKBANK_WERKZEUGKASTEN_URL
  = 'https://claude.ai/code/artifact/d767a008-a24c-47ef-8125-83b20d5e55e3'

/**
 * Screenshot des Szenarios „Promotion erstellen".
 *
 * `null` bedeutet: Die Vitrine wird gar nicht gerendert, statt eine 404-Lücke im Layout
 * zu hinterlassen. Vor dem Einsetzen eines neuen Bildes IMMER prüfen, ob Verbindungs-
 * namen, Webhook-Adressen oder Kundendaten darauf lesbar sind — ein Screenshot im Repo
 * bleibt in der Git-Historie, auch wenn er später ersetzt wird.
 */
export const WERKBANK_SCREENSHOT: { src: string, width: number, height: number, alt: string } | null = {
  src: '/images/werkbank/promotion-erstellen.png',
  width: 1606,
  height: 1242,
  alt:
    'Das Make-Szenario „Promotion erstellen" in der Bearbeitungsansicht: eine Kette aus '
    + 'über hundert Modulen, die sich mehrfach in parallel laufende Stränge verzweigt.',
}

// ── Logik ──────────────────────────────────────────────────────────────────────
/** Kürzester sichtbarer Balken in Prozent — ein 0%-Balken wäre unsichtbar. */
export const MIN_BAR_PERCENT = 4

/**
 * Balkenbreite in Prozent, proportional zum größten Wert der Reihe.
 *
 * PRE:  value >= 0, max > 0
 * POST: Ergebnis liegt in [MIN_BAR_PERCENT, 100]
 * INV:  value === max  ⇒  Ergebnis === 100
 *
 * Verletzte Precondition (max <= 0, negativer Wert, NaN) → MIN_BAR_PERCENT. Bewusst
 * ein definierter Wert statt eines stillen NaN: Ein NaN landet als ungültiges `width`
 * im Stylesheet und der Balken verschwindet kommentarlos.
 */
export function barWidth(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0 || value <= 0) {
    return MIN_BAR_PERCENT
  }

  const percent = (value / max) * 100

  return Math.min(100, Math.max(MIN_BAR_PERCENT, percent))
}
