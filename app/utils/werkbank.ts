import type {
  WerkbankBuild,
  WerkbankLesson,
  WerkbankMetric,
  WerkbankPart,
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

/**
 * Zweiter Stichtag, nur für das, was sich mit dem Umbau von „Promotion erstellen“
 * geändert hat: die Szenarienzahl und die Modulzahl dieses Ablaufs. Alle übrigen Zahlen
 * (Läufe, Operationen, Commits) stehen weiter auf `WERKBANK_STICHTAG`. Die Seite nennt
 * beide Daten, damit keine Zahl einen Stand behauptet, den sie nicht hat.
 */
export const WERKBANK_UMBAU_STICHTAG = '13. November 2026'

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
/** Aktive Szenarien laut Make am 13.11.2026, die fünf Unterszenarien eingeschlossen. */
const SZENARIEN_AKTIV = '25'
const OPERATIONEN_GELAUFEN = '29.110'

export const WERKBANK_NEUBAU_METRIKEN: WerkbankMetric[] = [
  { value: COMMITS_NEUBAU, label: 'Commits, davon 2.450 von mir' },
  { value: '1.477', label: 'Dateien' },
  { value: '333', label: 'zusammengeführte Zweige' },
  { value: '103', label: 'Markdown-Dokumente', accent: true },
]

// ── Die Maschinen ──────────────────────────────────────────────────────────────
/**
 * Stückliste zu „Promotion erstellen“ seit dem Umbau am 13.11.2026: ein Orchestrator,
 * fünf Unterszenarien und an Position 03 ein Mensch. Die Positionsnummern sind die der
 * Explosionszeichnung (`WERKBANK_SCREENSHOT`).
 *
 * Die Modulzahlen sind die EINZIGE Quelle für die Gesamtzahl: Summenzeile und Kennzahl
 * rechnen daraus (`WERKBANK_PROMOTION_MODULE`), statt eine 129 ein zweites Mal zu
 * pflegen. Vor dem Umbau war es ein einziges Szenario mit 116 Modulen; die Summe ist
 * gestiegen, weil Prüfungen dazukamen.
 */
export const WERKBANK_PROMOTION_TEILE: WerkbankPart[] = [
  {
    pos: '01',
    name: 'Orchestrator',
    text: 'Nimmt meinen Auftrag an und entscheidet, was als Nächstes läuft.',
    modules: 22,
  },
  {
    pos: '02',
    name: 'Vorschau erstellen',
    text: 'Claude liest den Artikel, schreibt Titel und Posts und prüft, ob das Artikelbild taugt.',
    modules: 31,
  },
  {
    pos: '03',
    name: 'Freigabe',
    text: 'Ich lese die Vorschau, ändere bei Bedarf und gebe frei. Ohne diesen Schritt geht nichts raus.',
  },
  {
    pos: '04',
    name: 'Bilder erstellen',
    text: 'Aus dem Artikelfoto oder einem KI-Bild entstehen Kacheln im Quadrat- und Hochformat.',
    modules: 18,
  },
  {
    pos: '05',
    name: 'Kanäle veröffentlichen',
    text: 'Je ein Post für Pinterest, X, Facebook und LinkedIn.',
    modules: 27,
  },
  {
    pos: '06',
    name: 'Abschluss',
    text: 'Eine Vorschau der Posts geht als Mail an den Blogger.',
    modules: 18,
  },
  {
    pos: '07',
    name: 'Status melden',
    text: 'Jeder Schritt meldet sich bei trusted blogs zurück. So sehe ich im Admin, wo eine Promotion gerade steht.',
    modules: 13,
  },
]

/**
 * Summe der Module und Zahl der Szenarien, gerechnet aus der Stückliste.
 *
 * PRE:  `modules` ist, wo gesetzt, eine ganze Zahl > 0
 * POST: `modules` = Summe aller gesetzten `modules`; `scenarios` = Anzahl Teile mit `modules`
 * INV:  Ein Teil ohne `modules` (die Freigabe) zählt in keiner der beiden Summen
 */
export function sumParts(parts: readonly WerkbankPart[]): { modules: number, scenarios: number } {
  return parts.reduce(
    (sum, part) => part.modules === undefined
      ? sum
      : { modules: sum.modules + part.modules, scenarios: sum.scenarios + 1 },
    { modules: 0, scenarios: 0 },
  )
}

export const WERKBANK_PROMOTION_SUMME = sumParts(WERKBANK_PROMOTION_TEILE)

export const WERKBANK_MAKE_METRIKEN: WerkbankMetric[] = [
  { value: SZENARIEN_AKTIV, label: 'Szenarien, alle aktiv' },
  {
    value: String(WERKBANK_PROMOTION_SUMME.modules),
    label: 'Module in „Promotion erstellen“, verteilt auf sechs Szenarien',
    accent: true,
  },
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
 * Explosionszeichnung von „Promotion erstellen“ (seit 13.11.2026, ersetzt den
 * Make-Screenshot des alten Szenarios mit 116 Modulen). Name der Konstante bleibt, weil
 * die Vitrine und der Anker `#szenario` daran hängen.
 *
 * `null` bedeutet: Die Vitrine wird gar nicht gerendert, statt eine 404-Lücke im Layout
 * zu hinterlassen. Vor dem Einsetzen eines neuen Bildes IMMER prüfen, ob Szenario-IDs,
 * Webhook-Adressen, Datenspeicher- oder Tabellennamen darauf lesbar sind — ein Bild im
 * Repo bleibt in der Git-Historie, auch wenn es später ersetzt wird. Diese Zeichnung
 * nennt nur Baugruppen und Netzwerke.
 *
 * Ohne `href`, also mit Lightbox: Die Beschriftungen sind bei Seitenbreite zu klein.
 */
export const WERKBANK_SCREENSHOT: WerkbankShot | null = {
  src: '/images/werkbank/promotion-erstellen-explosionszeichnung.webp',
  width: 3200,
  height: 1800,
  alt:
    'Technische Explosionszeichnung im Blaupausen-Stil: In der Mitte der Orchestrator '
    + '‚Promotion erstellen‘, um ihn herum die Baugruppen Vorschau erstellen, menschliche '
    + 'Freigabe, Bilder erstellen, Kanäle veröffentlichen (Pinterest, X, Facebook, LinkedIn) '
    + 'und Abschluss mit Kachel und Mail. Eine Rückleitung meldet jeden Schritt an trusted blogs.',
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
 * Als JPEG und nicht als PNG: Die Startseite ist zu großen Teilen ein Mosaik aus Fotos,
 * und die bläht PNG auf das Siebenfache auf.
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
