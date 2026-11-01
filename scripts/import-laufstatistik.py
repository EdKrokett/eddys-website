#!/usr/bin/env python3
"""
Einmaliger Umzug der Laufstatistik aus TablePress in das Plugin eddy-laufstatistik.

Liest die Tabelle aus dem veröffentlichten HTML von blog.eduard-andrae.de/statistik/,
übersetzt jede Zeile ins neue Modell (docs/statistik.md, Abschnitt „Umzug aus TablePress“)
und legt sie über wp/v2/laeufe an.

    python3 -I scripts/import-laufstatistik.py            # Probelauf: zeigt nur, was passieren würde
    python3 -I scripts/import-laufstatistik.py --write    # legt die Läufe an

Zugangsdaten aus .env (WP_URL, WP_USER, WP_APP_PASSWORD). Läufe, die es mit gleichem Datum
und Titel schon gibt, werden übersprungen. Ein zweiter Lauf des Skripts legt also nichts doppelt an.
"""
import base64
import html
import json
import re
import socket
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Nur IPv4. blog.eduard-andrae.de hat einen AAAA-Eintrag, über den keine Verbindung zustande
# kommt; Python probiert ihn zuerst und wartet bei jeder Anfrage den Timeout ab (gemessen
# 01.11.2026: 20,7 s statt 0,6 s). curl fällt sofort zurück und zeigt das Problem nicht.
_getaddrinfo = socket.getaddrinfo
socket.getaddrinfo = lambda host, port, family=0, *args, **kwargs: _getaddrinfo(host, port, socket.AF_INET, *args, **kwargs)

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = 'https://blog.eduard-andrae.de/statistik/'
BLOG = 'https://blog.eduard-andrae.de'

# Korrekturen und Ergänzungen beim Umzug, beide mit Eddy abgestimmt (01.11.2026).
LINK_FIXES = {
    # Die Zeile verlinkte als „Blogpost“ den Beitrag vom Oktober 2025.
    ('2026-09-13', 'Blogpost'): f'{BLOG}/projekt-marathon-mit-60-warum-es-in-bremen-der-halbe-wurde/',
}
TITLE_FIXES = {
    '2006-01-28': 'Lauf-Start mit der Laufgruppe „Von-0-Auf-42“',
}
EXTRA = [
    {
        'title': 'Halloween Run Bremen (Monsterthon)',
        'meta': {
            'datum': '2026-10-31',
            'distanz_km': 25.0,
            'zeit': '02:23:30',
            'art': 'wettkampf',
            'ergebnis': 'finish',
            'wertung': 'einzel',
            'notiz': '',
            'links': [{'label': 'Ergebnisliste', 'url': 'https://halloween-run-bremen.de/teilnehmerinfos/ergebnisse-urkunden-2026/'}],
        },
    },
]


def env():
    values = {}
    for line in (ROOT / '.env').read_text().splitlines():
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def text(fragment):
    fragment = re.sub(r'<br\s*/?>', ' ', fragment)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', fragment))).strip()


def parse_rows(page):
    table = page[page.find('tablepress-id-1'):]
    table = table[:table.find('</table>')]
    rows = re.findall(r'<tr class="row-\d+">(.*?)</tr>', table, re.S)
    for row in rows:
        cells = re.findall(r'<td class="column-\d">(.*?)</td>', row, re.S)
        if len(cells) == 5:
            yield cells


def translate(cells):
    datum_raw, distanz_raw, titel_raw, zeit_raw, notiz_raw = cells
    datum = text(datum_raw).replace('|', '-')
    titel = TITLE_FIXES.get(datum, text(titel_raw))
    zeit = text(zeit_raw)

    distanz_text = text(distanz_raw).replace('km', '').replace(',', '.').strip()
    distanz = round(float(distanz_text), 1) if distanz_text else None

    art = 'wettkampf'
    if distanz is None and zeit.lower() in ('n.a.', ''):
        art = 'meilenstein'
    elif titel.lower().startswith('trainingslauf'):
        art = 'training'

    ergebnis = {'DNS': 'dns', 'DNF': 'dnf'}.get(zeit.upper(), 'finish')
    if ergebnis != 'finish' or art == 'meilenstein':
        zeit = ''

    wertung = 'einzel'
    if 'staffel' in titel.lower():
        wertung = 'staffel'
    elif 'triathlon' in titel.lower():
        wertung = 'triathlon'

    links = []
    for href, label in re.findall(r'<a [^>]*href="([^"]*)"[^>]*>(.*?)</a>', notiz_raw, re.S):
        label = text(label)
        url = html.unescape(href).strip()
        if url.startswith('/') and not url.startswith('//'):
            url = BLOG + url
        links.append({'label': label, 'url': LINK_FIXES.get((datum, label), url)})
    notiz = text(re.sub(r'<a .*?</a>', '', notiz_raw, flags=re.S)).strip(' ,')

    if zeit and not re.fullmatch(r'\d{1,2}:[0-5]\d:[0-5]\d', zeit):
        raise ValueError(f'{datum} {titel}: Zeit „{zeit}“ nicht lesbar')

    return {
        'title': titel,
        'meta': {
            'datum': datum,
            'distanz_km': distanz,
            'zeit': zeit,
            'art': art,
            'ergebnis': ergebnis,
            'wertung': wertung,
            'notiz': notiz,
            'links': links,
        },
    }


def request(cfg, method, path, body=None):
    auth = base64.b64encode(f"{cfg['WP_USER']}:{cfg['WP_APP_PASSWORD']}".encode()).decode()
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        cfg['WP_URL'].rstrip('/') + path,
        data=data,
        method=method,
        headers={'Authorization': f'Basic {auth}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Ohne den Body steht nur „500“ da; WordPress nennt den Grund aber im JSON.
        sys.exit(f'Abbruch: {method} {path} → {error.code} {error.read().decode("utf-8", "replace")[:500]}\n'
                 f'Gesendet: {json.dumps(body, ensure_ascii=False)[:500] if body else "–"}')


def main():
    write = '--write' in sys.argv
    cfg = env()

    page = urllib.request.urlopen(SOURCE_URL, timeout=120).read().decode('utf-8')
    entries = [translate(cells) for cells in parse_rows(page)] + EXTRA
    print(f'{len(entries)} Läufe gelesen')

    # Abgleich über den ROHtitel aus wp/v2, nicht über die öffentliche Liste: Die setzt den
    # Titel durch wptexturize („Runner’s“ statt „Runner's“), und der Vergleich verfehlte ihn.
    # So entstand am 01.11.2026 ein Duplikat. Entwürfe zählen mit, damit nichts doppelt entsteht.
    existing = set()
    if write:
        for item in request(cfg, 'GET', '/wp-json/wp/v2/laeufe?context=edit&status=any&per_page=100&_fields=title,meta'):
            existing.add((item['meta'].get('datum'), item['title']['raw']))

    for entry in entries:
        meta = entry['meta']
        key = (meta['datum'], entry['title'])
        line = f"{meta['datum']}  {meta['distanz_km'] or '':>5}  {meta['zeit'] or '–':>8}  " \
               f"{meta['art'][:4]}/{meta['ergebnis']}/{meta['wertung'][:5]}  {entry['title'][:45]}" \
               f"  [{', '.join(link['label'] for link in meta['links'])}]{'  „' + meta['notiz'] + '“' if meta['notiz'] else ''}"

        if key in existing:
            print('  vorhanden ', line)
            continue
        if not write:
            print('  würde    ', line)
            continue

        payload_meta = dict(meta)
        if payload_meta['distanz_km'] is None:
            # Weglassen statt null: null heißt für die REST-API „löschen“, und das lehnt sie mit
            # rest_invalid_stored_value ab, sobald der Sanitizer schon 0 gespeichert hat.
            del payload_meta['distanz_km']
        created = request(cfg, 'POST', '/wp-json/wp/v2/laeufe', {
            'title': entry['title'],
            'status': 'publish',
            'meta': payload_meta,
        })

        # WordPress verwirft `meta` still, wenn der Inhaltstyp kein 'custom-fields' unterstützt
        # (Plugin 1.0.0). Die Antwort ist trotzdem 201. Deshalb das Echo prüfen, nicht den Status.
        echo = created.get('meta') or {}
        if echo.get('datum') != meta['datum'] or echo.get('zeit', '') != meta['zeit']:
            sys.exit(f"Abbruch: Lauf {created['id']} angelegt, aber Felder fehlen im Echo: {echo!r}")

        print(f"  angelegt {created['id']}", line, flush=True)


if __name__ == '__main__':
    main()
