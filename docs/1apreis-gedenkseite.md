# Gedenkseite 1Apreis.de (`/1apreis`)

Statische Seite über Eddys erstes Startup, übernommen aus der WordPress-Seite
`blog.eduard-andrae.de/1apreis/`. Reine Inhaltsseite ohne Datenanbindung.

## Warum genau der Pfad `/1apreis`

Die Domain `1apreis.de` gehört Eddy und zeigt seit dem Rückkauf 2019 auf die Gedenkseite.
Gemessen am 11.09.2026 sah die Kette so aus:

```
1apreis.de                    302 → www.eduard-andrae.de/1apreis/
www.eduard-andrae.de/1apreis/ 308 → eduard-andrae.de/1apreis/      (Vercel, www→apex)
eduard-andrae.de/1apreis/     301 → blog.eduard-andrae.de/1apreis/ (app/pages/[...slug].vue)
blog.eduard-andrae.de/1apreis/ 200  WordPress
```

Der Pfad war also bereits das Ziel echter Anfragen und wurde vom Catch-all an WordPress
weitergereicht. Mit einer echten Seite unter `/1apreis` greift der Catch-all nicht mehr
(er läuft nur, wenn der Vue-Router nichts gefunden hat) und die Kette endet nach zwei Hops
auf dieser Seite.

**Folge für spätere Änderungen:** Dieser Pfad darf nicht umbenannt werden, ohne die
IONOS-Weiterleitung von `1apreis.de` mitzuziehen. Sonst landet die Domain wieder im
Catch-all und damit bei WordPress.

## Warum keine Verlinkung im Footer

Der Footer trägt Pflichtangaben und Orientierung. Eine Gedenkseite ist Inhalt, kein
Verwaltungslink. Sie hängt stattdessen dort, wo jemand sie sucht: am Projekt-Eintrag
in `CV_PROJECTS` (`app/utils/cv.ts`) über das vorhandene `story`-Feld, das genau für
diesen Fall gebaut ist (geschlossenes Projekt, das trotzdem eine Geschichte hat).

Damit ist die Seite auf drei Wegen erreichbar: über die Domain `1apreis.de`, über
`/ueber-mich#projekte` und über die Suchmaschine.

## Warum die Screenshots im Repo liegen

Die vier Wayback-Ansichten (2000, 2003, 2006, 2012) liegen als PNG unter
`public/images/1apreis/` statt als Hotlink auf `blog.eduard-andrae.de/wp-content/`.

Gründe: Es sind unveränderliche Archivbilder, und die Seite soll nicht davon abhängen,
dass die WordPress-Instanz erreichbar bleibt. Genau von dieser Abhängigkeit will die
Migration ja weg. Zusammen rund 1,9 MB im Repo, ausgeliefert wird über `NuxtImg`
deutlich weniger.

Originalgrößen: 2000 → 1105×797, 2003 → 909×874, 2006 → 803×1169, 2012 → 965×1102.

**`width`/`height` in `ONEPREIS_EXHIBITS` sind bewusst NICHT diese Originalmaße**, sondern
die Anzeigemaße bei 640 px Spaltenbreite (640×462, 640×615, 640×932, 640×731). Grund:
`width` ist für `NuxtImg` zugleich die angeforderte Breite. Mit den Originalbreiten würde
der Vercel-Provider auf 1280 aufrunden (siehe `screens` in `nuxt.config.ts`) und die Bilder
über ihre eigene Auflösung hinaus hochrechnen. Das Seitenverhältnis ist identisch, der
Schutz vor Layout-Sprüngen bleibt also erhalten.

### Bildgewicht, und was `format="webp"` wirklich tut

Alles am 11.09.2026 gemessen, jeweils die vier Screenshots zusammen in Anzeigegröße:

| Umgebung           | Auslieferung                 | 1x      | 2x      |
|--------------------|------------------------------|---------|---------|
| lokal (IPX)        | PNG, also ohne `format`      | 1428 KB | —       |
| lokal (IPX)        | WebP, `quality="80"`         |  259 KB |  432 KB |
| Produktion (Vercel)| AVIF, per Accept ausgehandelt|  157 KB |  226 KB |

**Wichtig für das Verständnis der beiden Provider:** `format="webp"` wirkt nur lokal.
IPX liefert ohne diesen Prop das Quellformat aus, hier also PNG. Der Vercel-Optimizer
ignoriert den Prop dagegen und wählt das Format selbst über den Accept-Header des
Browsers — modern kommt AVIF an, als Fallback PNG. In Produktion hinge das Gewicht also
nicht am Prop; er bleibt gesetzt, damit die Entwicklungsansicht nicht um ein Vielfaches
schwerer ist als die ausgelieferte Seite.

Nachmessen, lokal — das `&amp;` aus dem HTML-Attribut muss dabei zu `&` dekodiert werden,
sonst misst man eine andere Variante als die, die der Browser lädt:

```bash
node .output/server/index.mjs &
curl -s localhost:3000/1apreis | grep -o 'srcset="[^"]*1apreis/2006[^"]*"'
curl -s -o /dev/null -w "%{content_type} %{size_download}\n" \
  "localhost:3000/_ipx/f_webp&q_80&s_640x932/images/1apreis/2006.png"
```

Nachmessen, Produktion — ohne `Accept`-Header misst man den PNG-Fallback, nicht das,
was ein Browser bekommt:

```bash
curl -s -o /dev/null -w "%{content_type} %{size_download}\n" \
  -H "Accept: image/avif,image/webp,image/*,*/*" \
  "https://eduard-andrae.de/_vercel/image?url=%2Fimages%2F1apreis%2F2006.png&w=640&q=80"
```

## Inhaltliche Abweichungen zur WordPress-Fassung

Der Text wurde vollständig übernommen, mit drei bewussten Eingriffen:

1. **Meta-Absatz umgeschrieben.** Das Original endete mit „Darum habe ich den Inhalt für
   diese Infotafel als eigene Seite in meinem Laufblog publiziert und 1Apreis.de hierhin
   umgeleitet." Das beschreibt die alte Mechanik und stimmt hier nicht mehr.
2. **Otto-Konzern ergänzt.** Dass das Konzept als Discount24.de nachgebaut wurde, steht
   in `docs/content-sammlung.md` und in `CV_STATIONS`, fehlte aber ausgerechnet auf der
   Gedenkseite. Es ist die stärkste Zeile der Geschichte.
3. **Bildunterschriften neu geschrieben.** Das Original beschriftete die Screenshots nur
   mit dem Jahr. Die Beschreibungen hier benennen, was auf der jeweiligen Ansicht
   tatsächlich zu sehen ist.

## Datierung: 2000—2012 vs. 1999—2006

Beide Angaben stehen nebeneinander auf der Seite und meinen Verschiedenes:

- **2000—2012** ist die Laufzeit des Shops, über zwei Eigentümer hinweg. So datiert es
  auch der Fuß des 2006er-Screenshots: „© 1Apreis.de GmbH 2000 - 2006".
- **1999—2006** ist Eddys eigene Zeit, von der Gründung der GmbH im November 1999 bis
  zum Ausstieg. So steht es in `CV_STATIONS` und auf LinkedIn.

Die Abweichung ist in `docs/content-sammlung.md` als bekannte Unschärfe vermerkt
(LinkedIn: „Nov. 1999", die alte Projektliste: „Jan. 2000"). Die Seite macht den
Unterschied durch die Beschriftung der Eckdaten explizit, statt ihn zu glätten.

## Einbindung in den Lebenslauf

Die Seite hängt an zwei Stellen in `/ueber-mich`, beide über das Feld `story` (Typ `CvLink`
in `shared/types/cv.ts`):

- **Projekt „1Apreis.de"** in `CV_PROJECTS` — das Feld gab es schon und stand hier leer.
- **Station 1999—2006** in `CV_STATIONS` — dafür wurde `story` neu an `CvStation` ergänzt
  und in `CvTimeline.vue` gerendert.

Der Link in der Timeline sitzt im aufklappbaren Panel und trägt im geschlossenen Zustand
`tabindex="-1"`. Das ist kein Feinschliff: Das Panel klappt über `grid-template-rows: 0fr`
plus `overflow: hidden` zu und versteckt seinen Inhalt damit nur optisch — ohne das hier
würde die Tab-Taste auf einen unsichtbaren Link springen. Bewusst kein `inert` am Panel,
weil das auch die Stationsbeschreibung aus dem Accessibility-Tree nähme, die dort laut
Komponenten-Kommentar gerade immer lesbar bleiben soll.

**Für künftige Stationen:** `story` ist für Ausnahmen gedacht. Die Timeline ist die
Übersicht, nicht der Ort für acht Links.

## Offen (außerhalb des Repos)

- [ ] WordPress-Seite `blog.eduard-andrae.de/1apreis/` per 301 auf
      `https://eduard-andrae.de/1apreis` weiterleiten. Sonst steht derselbe Text zweimal
      im Netz und die beiden Seiten konkurrieren bei Google.
- [ ] Optional bei IONOS: `1apreis.de` direkt auf `https://eduard-andrae.de/1apreis`
      zeigen lassen statt auf `www.eduard-andrae.de`. Spart zwei Weiterleitungen.
