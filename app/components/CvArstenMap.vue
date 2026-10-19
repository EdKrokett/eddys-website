<script setup lang="ts">
/**
 * Lageplan Bremen-Arsten: eigenes SVG aus OpenStreetMap-Daten statt des alten
 * Google-Maps-Screenshots (Rechte, und eine helle Straßenkarte passt nicht auf die
 * dunkle Seite). Konzept und Datenherkunft: docs/ueber-mich-einstieg.md.
 *
 * Aufbau in zwei Schichten in derselben Fläche (`.map__canvas`):
 * - SVG für die Geometrie; Linien mit `vector-effect: non-scaling-stroke`, damit sie
 *   bei jeder Breite Haarlinien bleiben. Nur die Weser skaliert mit, sie hat Breite.
 * - HTML für die Beschriftung, in Prozent positioniert. SVG-Text würde mitskalieren
 *   und auf dem Telefon unlesbar klein werden.
 *
 * Der Slot nimmt den Begleittext auf. Auf breiten Bildschirmen liegt er als Tafel
 * links unten auf der Karte, sonst steht er darunter.
 */
const map = ARSTEN_MAP

/** Indexring um das Fadenkreuz: 60 Striche wie auf dem Zifferblatt, jeder 5. betont. */
const RING_RADIUS = 24
const ringTicks = Array.from({ length: 60 }, (_, i) => {
  const angle = (i * 6 * Math.PI) / 180
  const major = i % 5 === 0
  const inner = RING_RADIUS - (major ? 5 : 2.5)
  return {
    x1: map.center.x + Math.sin(angle) * inner,
    y1: map.center.y - Math.cos(angle) * inner,
    x2: map.center.x + Math.sin(angle) * RING_RADIUS,
    y2: map.center.y - Math.cos(angle) * RING_RADIUS,
    major,
    accent: i === 0,
  }
})

const distance = formatKm(mapDistanceKm(map.center, ARSTEN_MARKTPLATZ, map))
/** Maß auf 40 % der Strecke ab Arsten, nicht mittig: Die Mitte fällt auf den Werdersee. */
const DISTANCE_LABEL_T = 0.4
const distanceAt = mapPercent(
  {
    x: map.center.x + (ARSTEN_MARKTPLATZ.x - map.center.x) * DISTANCE_LABEL_T,
    y: map.center.y + (ARSTEN_MARKTPLATZ.y - map.center.y) * DISTANCE_LABEL_T,
  },
  map,
)
/** Rechts neben dem Fadenkreuz, hinter dessen Armen (40 Einheiten). */
const arstenLabelAt = mapPercent({ x: map.center.x + 46, y: map.center.y }, map)

/** Maßstabsleiste über 2 km, unten rechts. */
const SCALE_KM = 2
const scaleUnits = (SCALE_KM * 1000) / map.metersPerUnit
const scaleEnd = { x: map.width - 24, y: map.height - 20 }
const scaleStart = { x: scaleEnd.x - scaleUnits, y: scaleEnd.y }
const scaleLabels = [0, 1, 2].map(km => ({
  km,
  at: mapPercent({ x: scaleStart.x + (km * 1000) / map.metersPerUnit, y: scaleEnd.y - 6 }, map),
}))

const places = ARSTEN_PLACES.map(place => ({ ...place, style: mapPercent(place.at, map) }))
const lonLabels = map.gridX.map((x, i) => ({ label: MAP_GRID_LON_LABELS[i], left: mapPercent({ x, y: 0 }, map).left }))
const latLabels = map.gridY.map((y, i) => ({ label: MAP_GRID_LAT_LABELS[i], top: mapPercent({ x: 0, y }, map).top }))
</script>

<template>
  <figure class="map">
    <div class="map__frame">
      <div class="map__canvas" :style="{ aspectRatio: `${map.width} / ${map.height}` }">
        <svg
          class="map__svg"
          :viewBox="`0 0 ${map.width} ${map.height}`"
          role="img"
          aria-labelledby="arsten-map-title"
          focusable="false"
        >
          <title id="arsten-map-title">
            Lageplan von Bremen: Arsten liegt am südlichen Stadtrand an der A1, westlich der
            Weser, {{ distance }} Luftlinie vom Marktplatz entfernt.
          </title>

          <defs>
            <!-- Schraffur wie auf einer technischen Zeichnung. -->
            <pattern
              id="arsten-hatch"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="5" class="map__hatch" />
            </pattern>
            <radialGradient id="arsten-glow">
              <stop offset="0" stop-color="var(--color-accent-500)" stop-opacity="0.16" />
              <stop offset="1" stop-color="var(--color-accent-500)" stop-opacity="0" />
            </radialGradient>
          </defs>

          <circle :cx="map.center.x" :cy="map.center.y" r="150" fill="url(#arsten-glow)" />

          <!-- Gradnetz -->
          <g class="map__grid">
            <line v-for="x in map.gridX" :key="`gx${x}`" :x1="x" :x2="x" y1="0" :y2="map.height" />
            <line v-for="y in map.gridY" :key="`gy${y}`" :y1="y" :y2="y" x1="0" :x2="map.width" />
          </g>

          <!-- Wasser -->
          <path :d="map.paths.lakes" class="map__lake" />
          <path :d="map.paths.rivers" class="map__river" />
          <path :d="map.paths.weser" class="map__weser" />

          <!-- Straßen -->
          <path :d="map.paths.feeders" class="map__feeder" />
          <path :d="map.paths.motorways" class="map__motorway" />

          <!-- Arsten -->
          <path :d="map.paths.arsten" class="map__arsten-fill" />
          <path :d="map.paths.arsten" fill="url(#arsten-hatch)" />
          <path :d="map.paths.arsten" class="map__arsten-edge" />

          <!-- Luftlinie zum Marktplatz -->
          <line
            :x1="map.center.x"
            :y1="map.center.y"
            :x2="ARSTEN_MARKTPLATZ.x"
            :y2="ARSTEN_MARKTPLATZ.y"
            class="map__distance"
          />

          <!-- Orte -->
          <circle
            v-for="place in ARSTEN_PLACES.filter(p => !p.water)"
            :key="place.label"
            :cx="place.at.x"
            :cy="place.at.y"
            r="2.6"
            :class="['map__dot', !place.primary && 'map__dot--minor']"
          />

          <!-- Fadenkreuz mit Indexring -->
          <g class="map__reticle">
            <line
              v-for="(tick, i) in ringTicks"
              :key="i"
              :x1="tick.x1"
              :y1="tick.y1"
              :x2="tick.x2"
              :y2="tick.y2"
              :class="[tick.major && 'map__tick--major', tick.accent && 'map__tick--accent']"
            />
            <line :x1="map.center.x - 40" :x2="map.center.x - 8" :y1="map.center.y" :y2="map.center.y" />
            <line :x1="map.center.x + 8" :x2="map.center.x + 40" :y1="map.center.y" :y2="map.center.y" />
            <line :y1="map.center.y - 40" :y2="map.center.y - 8" :x1="map.center.x" :x2="map.center.x" />
            <line :y1="map.center.y + 8" :y2="map.center.y + 40" :x1="map.center.x" :x2="map.center.x" />
            <circle :cx="map.center.x" :cy="map.center.y" r="2.8" class="map__pin" />
          </g>

          <!-- Maßstab -->
          <g class="map__scale">
            <line :x1="scaleStart.x" :x2="scaleEnd.x" :y1="scaleEnd.y" :y2="scaleEnd.y" />
            <line
              v-for="label in scaleLabels"
              :key="label.km"
              :x1="scaleStart.x + (label.km * 1000) / map.metersPerUnit"
              :x2="scaleStart.x + (label.km * 1000) / map.metersPerUnit"
              :y1="scaleEnd.y - 4"
              :y2="scaleEnd.y + 4"
            />
          </g>
        </svg>

        <!-- Beschriftung (HTML, skaliert nicht mit) -->
        <div class="map__labels" aria-hidden="true">
          <span v-for="lon in lonLabels" :key="lon.label" class="map__coord map__coord--lon" :style="{ left: lon.left }">
            {{ lon.label }}
          </span>
          <span v-for="lat in latLabels" :key="lat.label" class="map__coord map__coord--lat" :style="{ top: lat.top }">
            {{ lat.label }}
          </span>

          <span
            v-for="place in places"
            :key="place.label"
            class="map__place"
            :class="{ 'map__place--primary': place.primary, 'map__place--water': place.water }"
            :style="place.style"
          >
            {{ place.label }}
          </span>

          <span class="map__distance-label" :style="distanceAt">{{ distance }}</span>

          <span class="map__arsten" :style="arstenLabelAt">
            <span class="map__arsten-name">Arsten</span>
            <span class="map__arsten-coords">{{ ARSTEN_COORDS }}</span>
          </span>

          <span
            v-for="label in scaleLabels"
            :key="label.km"
            class="map__scale-label"
            :style="label.at"
          >
            {{ label.km }}<template v-if="label.km === 2"> km</template>
          </span>
        </div>
      </div>

      <div v-if="$slots.default" class="map__note">
        <slot />
      </div>
    </div>

    <figcaption class="map__caption">
      <span>Bremen-Arsten, am südlichen Stadtrand</span>
      <span class="map__credit">
        Kartendaten ©
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap-Mitwirkende
        </a>
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.map__frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-graphite-700);
  background:
    linear-gradient(180deg, var(--color-graphite-950), var(--color-graphite-900));
}

/*
 * Auf schmalen Bildschirmen ist die Zeichenfläche breiter als ihr Rahmen und so
 * verschoben, dass Arsten (bei 57 % der Breite) etwa mittig liegt. SVG und
 * Beschriftung stecken beide in dieser Fläche, die Prozentpositionen bleiben gültig.
 */
.map__canvas {
  position: relative;
  width: 210%;
  margin-left: -66%;
}
@media (min-width: 640px) {
  .map__canvas {
    width: 150%;
    margin-left: -33%;
  }
}
@media (min-width: 1024px) {
  .map__canvas {
    width: 100%;
    margin-left: 0;
  }
}

.map__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ── Geometrie ──────────────────────────────────────────────────────────── */
.map__grid line {
  stroke: var(--color-graphite-800);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.map__lake {
  fill: var(--color-accent-950);
  stroke: var(--color-accent-900);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  fill-rule: evenodd;
}
.map__river {
  fill: none;
  stroke: var(--color-accent-900);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.map__weser {
  fill: none;
  stroke: var(--color-accent-900);
  stroke-width: 7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map__feeder {
  fill: none;
  stroke: var(--color-graphite-500);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.map__motorway {
  fill: none;
  stroke: var(--color-steel-600);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.map__arsten-fill {
  fill: var(--color-accent-500);
  fill-opacity: 0.1;
}
.map__hatch {
  stroke: var(--color-accent-500);
  stroke-width: 0.6;
  stroke-opacity: 0.45;
}
.map__arsten-edge {
  fill: none;
  stroke: var(--color-accent-400);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.map__distance {
  stroke: var(--color-brass-400);
  stroke-width: 1;
  stroke-dasharray: 4 5;
  vector-effect: non-scaling-stroke;
}

.map__dot {
  fill: var(--color-steel-200);
}

.map__reticle line {
  stroke: var(--color-brass-300);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.map__reticle .map__tick--major {
  stroke-width: 1.5;
}
.map__reticle .map__tick--accent {
  stroke: var(--color-accent-300);
  stroke-width: 2.5;
}
.map__pin {
  fill: var(--color-brass-300);
}

.map__scale line {
  stroke: var(--color-steel-400);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* ── Beschriftung ───────────────────────────────────────────────────────── */
.map__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: var(--font-mono);
}

.map__coord {
  position: absolute;
  font-size: var(--text-2xs);
  letter-spacing: 0.06em;
  color: var(--color-steel-600);
  white-space: nowrap;
}
.map__coord--lon {
  top: 0.5rem;
  translate: 0.35rem 0;
}
/* Am rechten Rand: Links unten liegt auf breiten Bildschirmen die Texttafel. */
.map__coord--lat {
  right: 0.5rem;
  translate: 0 -120%;
}
/* Auf schmalen Bildschirmen liegen die Kartenränder außerhalb des Rahmens —
   die Breitengrade stünden dann im Nichts. */
@media (max-width: 1023px) {
  .map__coord--lat {
    display: none;
  }
}

.map__place {
  position: absolute;
  translate: 0.55rem -50%;
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--color-steel-400);
  text-shadow: 0 0 6px var(--color-graphite-950), 0 0 2px var(--color-graphite-950);
}
.map__place--primary {
  font-size: var(--text-xs);
  color: var(--color-steel-200);
}
.map__place--water {
  translate: -50% -50%;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-style: italic;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--color-accent-400);
}

/* Auf dem Telefon nur das Nötigste: Mitte, Weser, Arsten und das Maß. Alles
   andere stand dort übereinander. */
@media (max-width: 639px) {
  .map__place:not(.map__place--primary),
  .map__dot--minor,
  .map__arsten-coords {
    display: none;
  }
}

.map__distance-label {
  position: absolute;
  translate: -50% -50%;
  padding: 0.1rem 0.4rem;
  font-size: var(--text-2xs);
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--color-brass-300);
  background: var(--color-graphite-950);
  border: 1px solid var(--color-graphite-700);
}

.map__arsten {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  translate: 0 -50%;
  white-space: nowrap;
  text-shadow: 0 0 8px var(--color-graphite-950);
}
.map__arsten-name {
  font-family: var(--font-display);
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-steel-100);
}
.map__arsten-coords {
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  color: var(--color-accent-300);
}

.map__scale-label {
  position: absolute;
  translate: -50% -100%;
  font-size: var(--text-2xs);
  color: var(--color-steel-400);
}

/* ── Begleittext ────────────────────────────────────────────────────────── */
.map__note {
  padding: 1.5rem 1.25rem 1.75rem;
  border-top: 1px solid var(--color-graphite-700);
  background: var(--color-graphite-950);
}

/* Erst ab dieser Breite ist links unten auf der Karte genug Ruhe für die Tafel:
   Dort liegt nur die Ochtum-Niederung, Arsten bleibt frei. */
@media (min-width: 1200px) {
  .map__note {
    position: absolute;
    left: 1.5rem;
    bottom: 1.5rem;
    width: min(31rem, 40%);
    padding: 1.5rem 1.75rem;
    border: 1px solid var(--color-graphite-700);
    background: color-mix(in srgb, var(--color-graphite-950) 90%, transparent);
    backdrop-filter: blur(6px);
  }
}

/* ── Unterschrift ───────────────────────────────────────────────────────── */
.map__caption {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.875rem;
  margin-top: 0.875rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  line-height: 1.5;
  color: var(--color-steel-400);
}
.map__credit {
  margin-left: auto;
  color: var(--color-steel-600);
}
@media (max-width: 639px) {
  .map__credit {
    margin-left: 0;
  }
}
.map__credit a {
  color: var(--color-steel-400);
  border-bottom: 1px solid var(--color-graphite-600);
  transition: color 200ms ease;
}
.map__credit a:hover {
  color: var(--color-accent-300);
}
</style>
