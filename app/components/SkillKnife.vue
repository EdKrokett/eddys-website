<script setup lang="ts">
/**
 * Hero-Zentrum: ein Schweizer Taschenmesser, dessen Klingen aufklappen — Eddys
 * eigene Metapher für vielseitige Skills. Platzhalter-Skillnamen, echte Inhalte
 * folgen (siehe CLAUDE.md, Design-Priorität).
 */
interface Skill {
  id: string
  label: string
  icon: string
  /** Ziel-Rotation im geöffneten Zustand (Klinge zeigt standardmäßig nach unten = 0deg). */
  angle: number
}

const skills: Skill[] = [
  { id: 'strategie', label: 'Strategie', icon: 'lucide:compass', angle: 105 },
  { id: 'code', label: 'Entwicklung', icon: 'lucide:terminal', angle: 135 },
  { id: 'design', label: 'Design', icon: 'lucide:pen-tool', angle: 165 },
  { id: 'content', label: 'Content', icon: 'lucide:feather', angle: 195 },
  { id: 'daten', label: 'Automatisierung', icon: 'lucide:workflow', angle: 225 },
  { id: 'kommunikation', label: 'Kommunikation', icon: 'lucide:megaphone', angle: 255 },
]

const opened = ref(false)
const activeId = ref<string | null>(null)

onMounted(() => {
  setTimeout(() => {
    opened.value = true
  }, 300)
})
</script>

<template>
  <div class="knife-stage" role="img" aria-label="Schweizer Taschenmesser, Sinnbild für vielseitige Fähigkeiten">
    <div class="knife-pivot">
      <button
        v-for="(skill, i) in skills"
        :key="skill.id"
        type="button"
        class="knife-blade"
        :class="{ 'is-open': opened, 'is-active': activeId === skill.id }"
        :style="{ '--open': `${skill.angle}deg`, '--delay': `${i * 90}ms` }"
        @mouseenter="activeId = skill.id"
        @mouseleave="activeId = null"
        @focus="activeId = skill.id"
        @blur="activeId = null"
      >
        <span class="knife-blade__shape" />
        <span class="knife-blade__label">
          <Icon :name="skill.icon" class="size-4" />
          {{ skill.label }}
        </span>
      </button>
    </div>
    <div class="knife-handle">
      <span class="knife-handle__rivet" />
      <span class="knife-handle__rivet knife-handle__rivet--low" />
    </div>
  </div>
</template>

<style scoped>
.knife-stage {
  position: relative;
  width: 100%;
  height: 30rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.knife-pivot {
  transform-origin: bottom center;
}

/* Schmale Viewports: Fächer verkleinern, sonst laufen die äußeren Label-Texte
   (Strategie/Kommunikation) über den Bildschirmrand hinaus. */
@media (max-width: 640px) {
  .knife-pivot {
    transform: scale(0.68);
  }
}

.knife-handle {
  position: relative;
  width: 3.5rem;
  height: 12.5rem;
  border-radius: 1.75rem;
  background: linear-gradient(155deg, var(--color-swiss-400) 0%, var(--color-swiss-600) 55%, var(--color-swiss-800) 100%);
  box-shadow:
    inset 0 2px 6px rgb(255 255 255 / 25%),
    inset 0 -8px 16px rgb(0 0 0 / 35%),
    0 20px 40px -12px rgb(0 0 0 / 60%);
  z-index: 10;
}

.knife-handle__rivet {
  position: absolute;
  left: 50%;
  top: 1.75rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  transform: translateX(-50%);
  background: radial-gradient(circle at 35% 35%, var(--color-steel-200), var(--color-steel-500));
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 40%);
}

.knife-handle__rivet--low {
  top: auto;
  bottom: 1.75rem;
}

.knife-pivot {
  position: absolute;
  bottom: 12.5rem;
  left: 50%;
  width: 0;
  height: 0;
}

.knife-blade {
  position: absolute;
  top: 0;
  left: -0.5rem;
  width: 1rem;
  height: 9.5rem;
  transform-origin: top center;
  transform: rotate(0deg);
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay);
  background: none;
  border: none;
  padding: 0;
  z-index: 5;
}

.knife-blade.is-open {
  transform: rotate(var(--open));
}

.knife-blade__shape {
  position: absolute;
  inset: 0;
  display: block;
  clip-path: polygon(38% 0%, 62% 0%, 100% 90%, 50% 100%, 0% 90%);
  background: linear-gradient(180deg, var(--color-steel-200) 0%, var(--color-steel-300) 45%, var(--color-steel-500) 100%);
  box-shadow: 0 8px 18px -6px rgb(0 0 0 / 55%);
  transition: filter 300ms ease, box-shadow 300ms ease;
}

.knife-blade.is-active .knife-blade__shape {
  filter: brightness(1.15);
  box-shadow: 0 0 0 1px var(--color-swiss-400), 0 10px 24px -4px rgb(200 16 46 / 45%);
}

.knife-blade__label {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
  transform: translateX(-50%) rotate(calc(-1 * var(--open)));
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: var(--color-steel-300);
  opacity: 0;
  transition: opacity 400ms ease 700ms, color 200ms ease;
  pointer-events: none;
}

.knife-blade.is-open .knife-blade__label {
  opacity: 1;
}

.knife-blade.is-active .knife-blade__label {
  color: #f3f1ec;
}

@media (prefers-reduced-motion: reduce) {
  .knife-blade {
    transition-duration: 1ms;
  }
}
</style>
