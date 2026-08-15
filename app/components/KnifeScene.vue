<script setup lang="ts">
import * as THREE from 'three'
import { Environment, ContactShadows, Html, OrbitControls } from '@tresjs/cientos'
import { useLoop } from '@tresjs/core'
import { createHandleGeometry, createBladeGeometry, easeOutBack } from '#imports'

interface Skill {
  id: string
  label: string
  icon: string
  /** Ziel-Winkel im geöffneten Zustand, Grad von "oben" (0°) aus. */
  angleDeg: number
}

const skills: Skill[] = [
  { id: 'strategie', label: 'Strategie', icon: 'lucide:compass', angleDeg: -75 },
  { id: 'code', label: 'Entwicklung', icon: 'lucide:terminal', angleDeg: -45 },
  { id: 'design', label: 'Design', icon: 'lucide:pen-tool', angleDeg: -15 },
  { id: 'content', label: 'Content', icon: 'lucide:feather', angleDeg: 15 },
  { id: 'daten', label: 'Automatisierung', icon: 'lucide:workflow', angleDeg: 45 },
  { id: 'kommunikation', label: 'Kommunikation', icon: 'lucide:megaphone', angleDeg: 75 },
]

// ── Maße ──────────────────────────────────────────────────────────────────
const HANDLE_W = 0.85
const HANDLE_H = 2.5
const HANDLE_D = 0.36
const BLADE_LEN = 1.9
const BLADE_W = 0.32
const BLADE_D = 0.05
const HINGE_Y = HANDLE_H / 2
const RIVET_Y = HINGE_Y - HANDLE_H * 0.22

const handleGeometry = createHandleGeometry(HANDLE_W, HANDLE_H, HANDLE_D, 0.4)
const bladeGeometry = createBladeGeometry(BLADE_LEN, BLADE_W, BLADE_D)
const bladeTip: [number, number, number] = [0, BLADE_LEN * 1.08, BLADE_D]

// TresJS-Grundelemente (TresGroup/TresMesh/TresPerspectiveCamera/TresDirectionalLight,
// OrbitControls' target) verlangen echte THREE.Vector3-Instanzen für :position — anders
// als Html/ContactShadows nehmen sie kein [x,y,z]-Array-Shorthand ab.
// Auf schmalen Viewports mehr Abstand, sonst laufen die äußeren Label-Chips
// (Kommunikation/Strategie) über den Bildschirmrand hinaus.
const isNarrowViewport = import.meta.client && window.innerWidth < 640
const cameraPosition = new THREE.Vector3(0, 0.5, isNarrowViewport ? 16 : 12.5)
const orbitTarget = new THREE.Vector3(0, 0.45, 0)
const keyLightPosition = new THREE.Vector3(3, 5, 4)
const rimLightPosition = new THREE.Vector3(-4, 1.5, -2)
const knifeGroupPosition = new THREE.Vector3(0, -0.55, 0)
const rivetTopPosition = new THREE.Vector3(0, RIVET_Y, HANDLE_D / 2 + 0.01)
const rivetBottomPosition = new THREE.Vector3(0, -RIVET_Y, HANDLE_D / 2 + 0.01)
function bladeSlotPosition(i: number): THREE.Vector3 {
  return new THREE.Vector3(0, HINGE_Y, (i - (skills.length - 1) / 2) * 0.012)
}

const handleMaterial = new THREE.MeshPhysicalMaterial({
  color: '#c8102e',
  roughness: 0.28,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.15,
})

function steelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#dde0e6',
    roughness: 0.32,
    metalness: 0.9,
  })
}
const bladeMaterials = skills.map(() => steelMaterial())
const rivetMaterial = steelMaterial()

// ── Öffnen-Animation ─────────────────────────────────────────────────────
const CLOSED_Z = Math.PI // Klinge liegt eingeklappt am Heft an
const DURATION = 1100
const STAGGER = 90

const bladeGroups: (THREE.Group | null)[] = skills.map(() => null)
function setBladeGroup(i: number, el: unknown) {
  bladeGroups[i] = (el as THREE.Group) ?? null
}

const activeId = ref<string | null>(null)
let mountedAt: number | null = null

onMounted(() => {
  mountedAt = performance.now()
})

const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  if (mountedAt === null) return
  const elapsed = performance.now() - mountedAt

  skills.forEach((skill, i) => {
    const group = bladeGroups[i]
    if (!group) return

    const localElapsed = elapsed - i * STAGGER
    const progress = Math.min(Math.max(localElapsed / DURATION, 0), 1)
    const eased = progress <= 0 ? 0 : easeOutBack(progress)

    const openZ = (skill.angleDeg * Math.PI) / 180
    group.rotation.z = CLOSED_Z + (openZ - CLOSED_Z) * eased
  })
})
</script>

<template>
  <TresPerspectiveCamera :position="cameraPosition" :fov="26" :make-default="true" />
  <OrbitControls
    :target="orbitTarget"
    :enable-zoom="false"
    :enable-pan="false"
    :min-polar-angle="Math.PI / 2.4"
    :max-polar-angle="Math.PI / 2.05"
    :min-azimuth-angle="-Math.PI / 10"
    :max-azimuth-angle="Math.PI / 10"
    :auto-rotate="true"
    :auto-rotate-speed="0.5"
    :enable-damping="true"
  />

  <TresAmbientLight :intensity="0.45" />
  <TresDirectionalLight :position="keyLightPosition" :intensity="2" color="#fff4e8" :cast-shadow="true" />
  <TresDirectionalLight :position="rimLightPosition" :intensity="0.7" color="#8fb8ff" />
  <Suspense>
    <Environment preset="studio" />
  </Suspense>

  <TresGroup :position="knifeGroupPosition">
    <!-- Heft -->
    <TresMesh :geometry="handleGeometry" :material="handleMaterial" :cast-shadow="true" :receive-shadow="true" />
    <TresMesh :position="rivetTopPosition" :material="rivetMaterial">
      <TresSphereGeometry :args="[0.055, 16, 16]" />
    </TresMesh>
    <TresMesh :position="rivetBottomPosition" :material="rivetMaterial">
      <TresSphereGeometry :args="[0.055, 16, 16]" />
    </TresMesh>

    <!-- Klingen -->
    <TresGroup
      v-for="(skill, i) in skills"
      :key="skill.id"
      :ref="(el) => setBladeGroup(i, el)"
      :position="bladeSlotPosition(i)"
      :rotation="[0, 0, CLOSED_Z]"
    >
      <TresMesh
        :geometry="bladeGeometry"
        :material="bladeMaterials[i]"
        :cast-shadow="true"
        @pointer-enter="activeId = skill.id"
        @pointer-leave="activeId = null"
      />
      <Html :position="bladeTip" center :transform="false" class="pointer-events-none">
        <button
          type="button"
          class="pointer-events-auto flex items-center gap-1 rounded-full border border-graphite-600 bg-graphite-900/90 px-2 py-1 font-mono text-[10px] tracking-wide whitespace-nowrap backdrop-blur transition sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
          :class="activeId === skill.id ? 'border-swiss-500 text-white' : 'text-steel-300'"
          @mouseenter="activeId = skill.id"
          @mouseleave="activeId = null"
          @focus="activeId = skill.id"
          @blur="activeId = null"
        >
          <Icon :name="skill.icon" class="size-3.5" />
          {{ skill.label }}
        </button>
      </Html>
    </TresGroup>
  </TresGroup>

  <ContactShadows :position="[0, -1.35, 0]" :opacity="0.55" :blur="2.6" :far="2" :width="6" :height="6" />
</template>
