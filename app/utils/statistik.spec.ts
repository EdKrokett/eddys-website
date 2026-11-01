import type { Lauf } from '#shared/types/statistik'
import { describe, expect, it } from 'vitest'
import {
  baueZeitPlot,
  baueZeitstrahl,
  berechneKennzahlen,
  filterLaeufe,
  formatDauer,
  formatDistanz,
  formatGanzzahl,
  formatPace,
  formatTagMonat,
  gruppiereNachJahr,
  halbmarathonReihe,
  internerBlogPfad,
  istMarathon,
  marathonReihe,
  sortiereLaeufe,
} from './statistik'

let naechsteId = 1

function lauf(overrides: Partial<Lauf> = {}): Lauf {
  const datum = overrides.datum ?? '2011-09-25'
  return {
    id: naechsteId++,
    titel: 'BMW Marathon Berlin',
    datum,
    jahr: Number(datum.slice(0, 4)),
    distanzKm: 42.2,
    sekunden: 14204,
    art: 'wettkampf',
    ergebnis: 'finish',
    wertung: 'einzel',
    notiz: null,
    links: [],
    ...overrides,
  }
}

/** Ein Ausschnitt aus Eddys echter Statistik, mit allen Sonderfällen. */
const STATISTIK: Lauf[] = [
  lauf({ titel: 'Halloween Run Bremen (Monsterthon)', datum: '2026-10-31', distanzKm: 25, sekunden: 8610 }),
  lauf({ titel: 'AOK Halbmarathon Bremen', datum: '2026-09-13', distanzKm: 21.1, sekunden: 7426 }),
  lauf({ titel: 'Trainingslauf', datum: '2024-05-18', distanzKm: 21.1, sekunden: 10490, art: 'training' }),
  lauf({ titel: 'WEIR Venloop', datum: '2021-09-19', distanzKm: 21.1, sekunden: null, ergebnis: 'dns', notiz: 'ausgefallen (Corona)' }),
  lauf({ titel: 'RWE Hunsrück-Marathon', datum: '2016-08-28', sekunden: 17639 }),
  lauf({ titel: 'E.ON Supermarathon Rennsteiglauf', datum: '2012-05-12', distanzKm: 72.7, sekunden: 34217 }),
  lauf({ titel: 'Rhein-Energie Staffel-Marathon Köln', datum: '2011-10-02', sekunden: 13691, wertung: 'staffel' }),
  lauf({ titel: 'Executive Sports Halbmarathon Cuxhaven', datum: '2011-04-10', distanzKm: 21.1, sekunden: 6505 }),
  lauf({ titel: 'Waterfront Triathlon Bremen', datum: '2010-09-12', distanzKm: 5, sekunden: 1411, wertung: 'triathlon' }),
  lauf({ titel: 'Karstadt Marathon Oberhausen-Essen', datum: '2008-05-18', sekunden: 13349 }),
  lauf({ titel: 'Lauf-Start mit der Laufgruppe', datum: '2006-01-28', distanzKm: null, sekunden: null, art: 'meilenstein' }),
]

describe('istMarathon', () => {
  it('zählt die Staffel nicht als Marathon, obwohl sie 42,2 km hat', () => {
    expect(istMarathon(STATISTIK[6]!)).toBe(false)
    expect(istMarathon(STATISTIK[4]!)).toBe(true)
  })

  it('zählt einen nicht gestarteten Marathon nicht', () => {
    expect(istMarathon(lauf({ ergebnis: 'dns', sekunden: null }))).toBe(false)
  })
})

describe('berechneKennzahlen', () => {
  const k = berechneKennzahlen(STATISTIK)

  it('zählt die Marathons ohne Staffel', () => {
    expect(k.marathons).toBe(2)
  })

  it('findet die Marathon-Bestzeit über die ganze Liste', () => {
    expect(k.bestzeitMarathon?.titel).toBe('Karstadt Marathon Oberhausen-Essen')
    expect(k.bestzeitMarathon?.sekunden).toBe(13349)
  })

  it('nimmt die schnellere Staffel nicht als Marathon-Bestzeit', () => {
    // Die Staffel (3:48:11) ist schneller als der Hunsrück, aber langsamer als Essen.
    // Ohne Essen in der Liste dürfte trotzdem nicht die Staffel gewinnen.
    const ohneEssen = STATISTIK.filter(l => l.titel !== 'Karstadt Marathon Oberhausen-Essen')
    expect(berechneKennzahlen(ohneEssen).bestzeitMarathon?.titel).toBe('RWE Hunsrück-Marathon')
  })

  it('findet die Halbmarathon-Bestzeit', () => {
    expect(k.bestzeitHalbmarathon?.datum).toBe('2011-04-10')
  })

  it('zählt Wettkämpfe ohne Training, DNS und Meilensteine', () => {
    // Monsterthon, AOK HM, Hunsrück, Rennsteig, Staffel, Cuxhaven, Triathlon, Essen
    expect(k.wettkaempfe).toBe(8)
    expect(k.wettkampfKm).toBe(Math.round(25 + 21.1 + 42.2 + 72.7 + 42.2 + 21.1 + 5 + 42.2))
  })

  it('nimmt den Rennsteig als längsten Lauf und 2006 als Startjahr', () => {
    expect(k.laengsterLauf?.distanzKm).toBe(72.7)
    expect(k.seitJahr).toBe(2006)
  })

  it('liefert leere Werte statt 0:00:00 für eine leere Liste', () => {
    expect(berechneKennzahlen([])).toEqual({
      seitJahr: null,
      wettkaempfe: 0,
      wettkampfKm: 0,
      marathons: 0,
      bestzeitMarathon: null,
      bestzeitHalbmarathon: null,
      laengsterLauf: null,
    })
  })

  it('wählt bei gleicher Zeit den früheren Lauf', () => {
    const gleich = [lauf({ datum: '2015-04-26', sekunden: 13349 }), lauf({ datum: '2008-05-18', sekunden: 13349 })]
    expect(berechneKennzahlen(gleich).bestzeitMarathon?.datum).toBe('2008-05-18')
  })
})

describe('Reihen', () => {
  it('ordnet die Marathons chronologisch und markiert genau eine Bestzeit', () => {
    const reihe = marathonReihe(STATISTIK)
    expect(reihe.map(p => p.lauf.datum)).toEqual(['2008-05-18', '2016-08-28'])
    expect(reihe.filter(p => p.bestzeit).map(p => p.lauf.datum)).toEqual(['2008-05-18'])
  })

  it('nimmt Trainings-Halbmarathons mit, aber keinen DNS', () => {
    const reihe = halbmarathonReihe(STATISTIK)
    expect(reihe.map(p => p.lauf.datum)).toEqual(['2011-04-10', '2024-05-18', '2026-09-13'])
  })

  it('ist leer, wenn es keine passenden Läufe gibt', () => {
    expect(marathonReihe([])).toEqual([])
  })
})

describe('baueZeitstrahl', () => {
  const modell = baueZeitstrahl(STATISTIK, 2026)!

  it('spannt die Achse vom ersten Eintrag bis zum Referenzjahr', () => {
    expect(modell.vonJahr).toBe(2006)
    expect(modell.bisJahr).toBe(2026)
    expect(modell.ticks).toHaveLength(21)
    expect(modell.ticks[0]).toEqual({ jahr: 2006, offsetPct: 0, major: false })
    expect(modell.ticks.find(t => t.jahr === 2010)?.major).toBe(true)
  })

  it('gibt dem längsten Lauf die volle Höhe und kurzen Läufen eine Mindesthöhe', () => {
    const rennsteig = modell.marken.find(m => m.lauf.distanzKm === 72.7)!
    const triathlon = modell.marken.find(m => m.lauf.wertung === 'triathlon')!
    expect(rennsteig.hoehePct).toBe(100)
    expect(triathlon.hoehePct).toBe(26)
  })

  it('unterscheidet Lauf, Ausfall und Meilenstein', () => {
    const typen = Object.fromEntries(modell.marken.map(m => [m.lauf.datum, m.typ]))
    expect(typen['2021-09-19']).toBe('ausfall')
    expect(typen['2006-01-28']).toBe('meilenstein')
    expect(typen['2026-10-31']).toBe('lauf')
  })

  it('liegt mit allen Marken innerhalb der Achse', () => {
    expect(modell.marken.every(m => m.offsetPct >= 0 && m.offsetPct < 100)).toBe(true)
  })

  it('verlängert die Achse, wenn ein Lauf nach dem Referenzjahr liegt', () => {
    expect(baueZeitstrahl([lauf({ datum: '2027-01-01' })], 2026)?.bisJahr).toBe(2027)
  })

  it('gibt jedem Eintrag gleich viel Platz, nach Einträgen statt nach Tagen', () => {
    // 21 Jahre: 9 mit zusammen 11 Einträgen (je Eintrag 1 + Rand 1), 12 leere zu je 0,5
    // → 11 + 9 + 6 = 26 Einheiten
    expect(new Set(modell.marken.map(m => m.slotPct))).toEqual(new Set([3.85]))
  })

  it('setzt Einträge desselben Jahres nebeneinander statt übereinander', () => {
    const jahr2026 = modell.marken.filter(m => m.lauf.jahr === 2026).map(m => m.offsetPct)
    expect(jahr2026).toHaveLength(2)
    expect(jahr2026[1]! - jahr2026[0]!).toBeCloseTo(3.85, 1)
  })

  it('macht leere Jahre schmal und lässt die Bänder lückenlos aneinanderstoßen', () => {
    const band = (jahr: number) => modell.baender.find(b => b.jahr === jahr)!
    expect(band(2007).anzahl).toBe(0)
    expect(band(2007).breitePct).toBeLessThan(band(2008).breitePct)
    expect(band(2011).breitePct).toBeGreaterThan(band(2008).breitePct)
    const letztes = modell.baender.at(-1)!
    expect(letztes.startPct + letztes.breitePct).toBeCloseTo(100, 0)
  })

  it('fasst ruhige Phasen zu einem Label zusammen', () => {
    expect(modell.labels.map(l => l.text)).toEqual(['2006–2010', '2011', '2012–2025', '2026'])
    expect(modell.labels.find(l => l.text === '2026')?.haupt).toBe(true)
    expect(modell.labels.find(l => l.text === '2011')?.haupt).toBe(false)
  })

  it('hat für schmale Bildschirme eine Kurzform', () => {
    expect(modell.labels.map(l => l.kurz)).toEqual(['’06–’10', '’11', '’12–’25', '’26'])
  })

  it('liefert null für eine leere Liste', () => {
    expect(baueZeitstrahl([], 2026)).toBeNull()
  })
})

describe('baueZeitPlot', () => {
  const modell = baueZeitPlot(halbmarathonReihe(STATISTIK), 2026)!

  it('rastert die Zeitachse auf Viertelstunden um alle Punkte und die Referenz', () => {
    // Schnellster 1:48:25, langsamster 2:54:50 → 1:45 bis 3:00
    expect(modell.yTicks.map(t => t.label)).toEqual(['1:45:00', '2:00:00', '2:15:00', '2:30:00', '2:45:00', '3:00:00'])
    expect(modell.yTicks[0]?.pct).toBe(0)
    expect(modell.yTicks.at(-1)?.pct).toBe(100)
  })

  it('setzt die Zwei-Stunden-Linie an die richtige Höhe', () => {
    expect(modell.referenzPct).toBe(20)
  })

  it('setzt die Punkte nach Datum und Zeit', () => {
    const cux = modell.punkte.find(p => p.lauf.datum === '2011-04-10')!
    // 99 Tage nach dem 01.01.2011, Achse 2011 bis Ende 2026 = 5844 Tage
    expect(cux.xPct).toBe(1.69)
    expect(cux.yPct).toBeCloseTo(((6505 - 6300) / 4500) * 100, 1)
    expect(cux.bestzeit).toBe(true)
  })

  it('beschriftet das Startjahr und jedes fünfte Jahr', () => {
    expect(modell.xTicks.map(t => t.jahr)).toEqual([2011, 2015, 2020, 2025])
  })

  it('lässt das Startjahr weg, wenn ein Fünferjahr zu dicht folgt', () => {
    // Eddys echte Reihe beginnt 2007: „2007“ neben „2010“ stieß bei 390 px zusammen.
    const ab2007 = baueZeitPlot([{ lauf: lauf({ datum: '2007-07-12' }), sekunden: 7271, bestzeit: true }], 2026)!
    expect(ab2007.xTicks.map(t => t.jahr)).toEqual([2010, 2015, 2020, 2025])
  })

  it('nimmt die Referenz in den Bereich auf, auch wenn alle Zeiten darüber liegen', () => {
    const langsam = baueZeitPlot([{ lauf: lauf({ datum: '2024-05-18' }), sekunden: 10490, bestzeit: true }], 2026)!
    expect(langsam.yTicks[0]?.sekunden).toBe(7200)
    expect(langsam.referenzPct).toBe(0)
  })

  it('liefert null ohne Punkte', () => {
    expect(baueZeitPlot([], 2026)).toBeNull()
  })
})

describe('filterLaeufe', () => {
  it('zeigt unter Marathon auch die Staffel', () => {
    const titel = filterLaeufe(STATISTIK, 'marathon', '').map(l => l.titel)
    expect(titel).toContain('Rhein-Energie Staffel-Marathon Köln')
    expect(titel).not.toContain('E.ON Supermarathon Rennsteiglauf')
  })

  it('findet Notizen und Jahre, ohne Groß-/Kleinschreibung', () => {
    expect(filterLaeufe(STATISTIK, 'alle', 'CORONA').map(l => l.datum)).toEqual(['2021-09-19'])
    expect(filterLaeufe(STATISTIK, 'alle', ' 2016 ').map(l => l.datum)).toEqual(['2016-08-28'])
  })

  it('kombiniert Kategorie und Suche', () => {
    expect(filterLaeufe(STATISTIK, 'halbmarathon', 'bremen').map(l => l.datum)).toEqual(['2026-09-13'])
  })

  it('liefert eine leere Liste ohne Treffer', () => {
    expect(filterLaeufe(STATISTIK, 'meilensteine', 'marathon')).toEqual([])
  })
})

describe('Filter „Andere Distanzen“', () => {
  it('nimmt alles mit Distanz außer Halbmarathon und Marathon', () => {
    expect(filterLaeufe(STATISTIK, 'andere', '').map(l => l.distanzKm)).toEqual([25, 72.7, 5])
  })

  it('lässt Meilensteine ohne Distanz weg', () => {
    expect(filterLaeufe(STATISTIK, 'andere', '').some(l => l.art === 'meilenstein')).toBe(false)
  })
})

describe('sortiereLaeufe', () => {
  it('sortiert nach Zeit aufsteigend, Einträge ohne Zeit ans Ende', () => {
    const liste = sortiereLaeufe(STATISTIK, 'zeit', 'auf')
    expect(liste[0]?.titel).toBe('Waterfront Triathlon Bremen')
    expect(liste.slice(-2).map(l => l.sekunden)).toEqual([null, null])
  })

  it('sortiert nach Zeit absteigend, Einträge ohne Zeit trotzdem am Ende', () => {
    const liste = sortiereLaeufe(STATISTIK, 'zeit', 'ab')
    expect(liste[0]?.titel).toBe('E.ON Supermarathon Rennsteiglauf')
    expect(liste.at(-1)?.sekunden).toBeNull()
  })

  it('sortiert nach Datum in beide Richtungen', () => {
    expect(sortiereLaeufe(STATISTIK, 'datum', 'auf')[0]?.datum).toBe('2006-01-28')
    expect(sortiereLaeufe(STATISTIK, 'datum', 'ab')[0]?.datum).toBe('2026-10-31')
  })

  it('verändert die Eingabe nicht', () => {
    const vorher = STATISTIK.map(l => l.id)
    sortiereLaeufe(STATISTIK, 'zeit', 'auf')
    expect(STATISTIK.map(l => l.id)).toEqual(vorher)
  })
})

describe('gruppiereNachJahr', () => {
  it('gruppiert aufsteigend, wenn gewünscht', () => {
    const gruppen = gruppiereNachJahr(sortiereLaeufe(STATISTIK, 'datum', 'auf'), 'auf')
    expect(gruppen[0]?.jahr).toBe(2006)
    expect(gruppen.at(-1)?.jahr).toBe(2026)
  })

  it('gruppiert absteigend nach Jahr', () => {
    const gruppen = gruppiereNachJahr(STATISTIK)
    expect(gruppen[0]?.jahr).toBe(2026)
    expect(gruppen[0]?.laeufe).toHaveLength(2)
    expect(gruppen.at(-1)?.jahr).toBe(2006)
  })
})

describe('Formate', () => {
  it('formatiert Dauer mit und ohne Stunden', () => {
    expect(formatDauer(13349)).toBe('3:42:29')
    expect(formatDauer(1411)).toBe('23:31')
    expect(formatDauer(null)).toBe('–')
    expect(formatDauer(0)).toBe('–')
  })

  it('formatiert Kilometer mit Komma und einer Stelle', () => {
    expect(formatDistanz(21.1)).toBe('21,1')
    expect(formatDistanz(25)).toBe('25,0')
    expect(formatDistanz(null)).toBe('–')
  })

  it('setzt Tausenderpunkte ohne toLocaleString', () => {
    expect(formatGanzzahl(1234)).toBe('1.234')
    expect(formatGanzzahl(1234567)).toBe('1.234.567')
    expect(formatGanzzahl(999)).toBe('999')
    expect(formatGanzzahl(0)).toBe('0')
  })

  it('rechnet das Tempo', () => {
    expect(formatPace(8610, 25)).toBe('5:44')
    expect(formatPace(null, 25)).toBeNull()
    expect(formatPace(8610, null)).toBeNull()
  })

  it('kürzt das Datum ohne Zeitzonenfehler', () => {
    expect(formatTagMonat('2026-01-01')).toBe('01.01.')
  })
})

describe('internerBlogPfad', () => {
  it('macht aus einem Blogbeitrag einen internen Pfad', () => {
    expect(internerBlogPfad('https://blog.eduard-andrae.de/projekt-marathon-mit-60-jetzt-wirds-ernst/'))
      .toBe('/blog/projekt-marathon-mit-60-jetzt-wirds-ernst')
    expect(internerBlogPfad('https://www.eduard-andrae.de/berlin-marathon-2011/')).toBe('/blog/berlin-marathon-2011')
  })

  it('erkennt Beitragslinks auf diese Seite, wie Eddy sie für neue Läufe einträgt', () => {
    expect(internerBlogPfad('https://eduard-andrae.de/blog/halloween-run-bremen-der-letzte-kilometer-ist-immer-der-laengste'))
      .toBe('/blog/halloween-run-bremen-der-letzte-kilometer-ist-immer-der-laengste')
  })

  it('hält eine Seite dieser Website nicht für einen Beitrag', () => {
    expect(internerBlogPfad('https://eduard-andrae.de/statistik')).toBeNull()
  })

  it('lässt fremde und tiefere Links extern', () => {
    expect(internerBlogPfad('https://drive.google.com/file/d/abc/view')).toBeNull()
    expect(internerBlogPfad('https://blog.eduard-andrae.de/category/laufen/')).toBeNull()
    expect(internerBlogPfad('https://blog.eduard-andrae.de/wp-content/uploads/2012/01/x.png')).toBeNull()
    expect(internerBlogPfad(null)).toBeNull()
  })
})
