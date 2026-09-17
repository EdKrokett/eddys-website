import type {
  WerkbankBuild,
  WerkbankLesson,
  WerkbankMetric,
  WerkbankScenario,
  WerkbankShot,
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

/**
 * Die drei Zahlen, die doppelt stehen: einmal in den Kennzahlenleisten dieser Seite,
 * einmal im Startseiten-Band (`HomeWerkbank.vue`). Als benannte Konstanten statt als
 * zwei Literale, weil sonst beim Aktualisieren zuverlässig eine der beiden Stellen
 * stehen bleibt — die Startseite behauptete dann einen Stand, den es nicht mehr gibt.
 */
const COMMITS_NEUBAU = '2.562'
const SZENARIEN_AKTIV = '19'
const OPERATIONEN_GELAUFEN = '29.110'

export const WERKBANK_NEUBAU_METRIKEN: WerkbankMetric[] = [
  { value: COMMITS_NEUBAU, label: 'Commits, davon 2.450 von mir' },
  { value: '1.477', label: 'Dateien' },
  { value: '333', label: 'zusammengeführte Zweige' },
  { value: '103', label: 'Markdown-Dokumente', accent: true },
]

// ── Die Maschinen ──────────────────────────────────────────────────────────────
/**
 * Drei der neunzehn Szenarien (Eddys Auswahl, 12.09.2026). Eine vollständige Tabelle
 * wäre eine Inventarliste, keine Aussage.
 *
 * Bewusst NICHT „die drei größten“: Auf Platz drei nach Modulzahl stünde
 * „Pinterest: Multi-PIN-Erstellung“ (56 Module, 0 Läufe). Ein gebautes, aber nie
 * gestartetes Szenario in einer Tabelle, die zeigen soll, was läuft, wirft beim Lesen
 * mehr Fragen auf, als es beantwortet.
 *
 * Die Reihenfolge ist die der Aufzählung, nicht sortiert. Dass sie trotzdem von lang
 * nach kurz läuft, ist Zufall der Auswahl: Der Balken hinter dem Namen rechnet gegen
 * die größte Modulzahl DIESER Liste, nicht gegen alle neunzehn.
 */
export const WERKBANK_SZENARIEN: WerkbankScenario[] = [
  { name: 'Promotion erstellen', modules: 115, runs: 482, operations: 13321 },
  { name: 'KI-Blogpost erstellen', modules: 87, runs: 49, operations: 1437 },
  { name: 'Content-Versand', modules: 26, runs: 160, operations: 3327 },
]

export const WERKBANK_MAKE_METRIKEN: WerkbankMetric[] = [
  { value: SZENARIEN_AKTIV, label: 'Szenarien, alle aktiv' },
  { value: '115', label: 'Module im größten davon', accent: true },
  { value: '20', label: 'angebundene Dienste' },
  { value: OPERATIONEN_GELAUFEN, label: 'Operationen gelaufen' },
]

/**
 * Die Kennzahlen des Startseiten-Bands — dieselben Werte wie oben, aber mit kurzen
 * Labels: Im Band stehen drei Zahlen nebeneinander in einer schmalen Spalte, dort passt
 * „Commits, davon 2.450 von mir" nicht in eine Zeile. Die Auswahl deckt beide Hälften
 * der Werkbank ab (Neubau und Automatisierung), damit das Band nicht nur einen Teil
 * der Seite ankündigt.
 */
export const WERKBANK_STARTSEITE_METRIKEN: WerkbankMetric[] = [
  { value: COMMITS_NEUBAU, label: 'Commits im Neubau' },
  { value: SZENARIEN_AKTIV, label: 'Make-Szenarien, alle aktiv', accent: true },
  { value: OPERATIONEN_GELAUFEN, label: 'Operationen gelaufen' },
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
    role: 'Steckt in den Szenarien und generiert passende Bilder.',
  },
  {
    name: 'GitLab & VS Code',
    role: 'Der Tresor und die Werkstatt. Jede Änderung bleibt nachvollziehbar und umkehrbar.',
  },
  {
    name: 'Placid & Cloudinary',
    role:
      'Ergänzen Wasserzeichen und Texte in den Bildern, die sonst jedes Mal jemand von '
      + 'Hand einsetzen müsste.',
  },
]

// ── Wo es klemmte ──────────────────────────────────────────────────────────────
/**
 * Drei Lektionen aus `tb26-code/docs/ai-lessons.md` — dem fortlaufenden
 * Lessons-Learned des Neubaus. Für Lesende ohne Entwicklerhintergrund übersetzt,
 * aber nicht verwässert: Jede beschreibt einen echten Fehlschlag, keine Binsenweisheit.
 *
 * Die dritte schließt den Bogen zu Hardy Kutzer aus Kapitel 01: Die Prüfungen, von
 * denen sie handelt, sind genau die, die er im Februar eingerichtet hat.
 */
export const WERKBANK_LEKTIONEN: WerkbankLesson[] = [
  {
    title: 'Die KI übertreibt, wenn sie sich selbst prüft',
    text:
      'Ich habe die KI ihre eigenen Anweisungsdateien durchsehen lassen. Das Urteil klang '
      + 'nach Messung: 30 bis 40 Prozent davon seien überflüssig. Nachgezählt waren es zehn '
      + 'Zeilen von mehreren hundert. Eine Prozentzahl wirkt genau, auch wenn sie geraten '
      + 'ist. Heute sehe ich mir jeden Befund erst in der Datei selbst an.',
  },
  {
    title: 'Zu viele Regeln heben sich gegenseitig auf',
    text:
      'Meine Anweisungsdatei war auf 187 Zeilen gewachsen, weil ich nach jedem Fehler eine '
      + 'weitere Regel angehängt habe. Je länger sie wurde, desto mehr davon hat die KI '
      + 'übergangen. Ab etwa zehn Anweisungen fängt das an. Ich habe auf 135 Zeilen gekürzt, '
      + 'und seitdem hält sie sich an mehr, als sie es mit der langen Fassung tat.',
  },
  {
    title: 'Prüfen muss die Maschine',
    text:
      'Anfangs standen meine wichtigsten Regeln als Text in der Anleitung. Sobald es eilig '
      + 'wurde, hat die KI sie übergangen, und ich habe es erst hinterher gemerkt. Heute '
      + 'hängen sie an Prüfungen, die den Build abbrechen, wenn etwas dagegen verstößt. '
      + 'Genau die hat Hardy im Februar eingerichtet. Ein Skript kann man nicht überlesen.',
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
 *
 * Ohne `href`, also mit Lightbox: 115 Module sind bei Seitenbreite nicht zu erkennen.
 */
export const WERKBANK_SCREENSHOT: WerkbankShot | null = {
  src: '/images/werkbank/promotion-erstellen.png',
  width: 1606,
  height: 1242,
  alt:
    'Das Make-Szenario „Promotion erstellen" in der Bearbeitungsansicht: eine Kette aus '
    + 'über hundert Modulen, die sich mehrfach in parallel laufende Stränge verzweigt.',
}

/**
 * Die Startseite von trusted blogs — das Beweisstück zu Kapitel 01.
 *
 * Mit `href` statt Lightbox: Auf einer Seite, die nur aus Belegen besteht, ist „sieh
 * selbst nach" die stärkste Fassung des Links. Das Original ist die Vergrößerung.
 *
 * Aufgenommen am 17.09.2026, Chrome headless, Viewport 1600×1000 bei doppelter
 * Pixeldichte, Cookie-Banner vorher abgelehnt (nicht akzeptiert, sonst löst der
 * Screenshot Conversion-Tracking aus). Hergang und Befehl: `docs/werkbank.md`.
 *
 * Als JPEG und nicht als PNG wie der Make-Screenshot: Die Startseite ist zu großen
 * Teilen ein Mosaik aus Fotos, und die bläht PNG auf das Siebenfache auf.
 *
 * ACHTUNG beim Austausch: Das Bild zeigt die Blog-Titelbilder, die zum Aufnahmezeitpunkt
 * auf der Startseite lagen. Öffentlich sichtbare Inhalte, aber trotzdem fremde — vor dem
 * Ersetzen prüfen, ob auf dem neuen Stand etwas zu sehen ist, das dort nicht hingehört.
 */
export const WERKBANK_STARTSEITE_SHOT: WerkbankShot | null = {
  src: '/images/werkbank/trusted-blogs-startseite.jpg',
  width: 2000,
  height: 1250,
  alt:
    'Die Startseite von trusted-blogs.com: Über einem Mosaik aus Blog-Titelbildern steht '
    + '„Blog-Marketing mit Langzeitwirkung", darunter ein Suchfeld mit Themenfiltern und '
    + 'zwei Einstiege für Unternehmen und für Bloggerinnen und Blogger.',
  href: 'https://trusted-blogs.com/',
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
