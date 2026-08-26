<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * Eigene Fehlerseite statt der Nuxt-Standardseite: Ein 404 ist hier wahrscheinlich —
 * alte WordPress-Adressen leiten zwar per Middleware auf blog.eduard-andrae.de um
 * (server/middleware/legacy-wp-redirect.ts), aber Tippfehler und tote Links bleiben.
 *
 * `error.vue` liegt außerhalb von <NuxtPage>, deshalb bringt sie ihren eigenen
 * Rahmen mit — Header und Footer aus app.vue greifen hier nicht.
 */
const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)
</script>

<template>
  <UApp>
    <div class="err">
      <UContainer class="err__inner">
        <p class="err__code">
          {{ error?.statusCode ?? 500 }}
        </p>

        <h1 class="err__title">
          {{ isNotFound ? 'Hier ist nichts.' : 'Da ist etwas schiefgelaufen.' }}
        </h1>

        <p class="err__text">
          <template v-if="isNotFound">
            Diese Seite gibt es nicht — vielleicht ein alter Link oder ein Tippfehler.
            Der Blog und der Werdegang sind aber genau da, wo sie hingehören.
          </template>
          <template v-else>
            Ein unerwarteter Fehler. Probier es gleich noch einmal — oder geh zurück
            zur Startseite.
          </template>
        </p>

        <div class="err__actions">
          <!-- clearError({ redirect }) statt NuxtLink: die Fehlerseite muss den
               Fehlerzustand aktiv verwerfen, sonst bleibt sie beim Navigieren stehen. -->
          <button type="button" class="err__link" @click="clearError({ redirect: '/' })">
            Zur Startseite
            <Icon name="lucide:arrow-right" class="size-4" />
          </button>
          <button
            type="button"
            class="err__link err__link--muted"
            @click="clearError({ redirect: '/blog' })"
          >
            Zum Blog
          </button>
        </div>
      </UContainer>
    </div>
  </UApp>
</template>

<style scoped>
.err {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  background:
    radial-gradient(70% 60% at 50% 0%, rgba(200, 16, 46, 0.09) 0%, transparent 60%),
    var(--color-graphite-950);
  text-align: center;
}

.err__inner {
  padding-block: 4rem;
}

.err__code {
  font-family: var(--font-mono);
  font-size: clamp(4rem, 18vw, 9rem);
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--color-graphite-700);
  font-variant-numeric: tabular-nums;
}

.err__title {
  margin-top: 1rem;
  font-size: clamp(1.75rem, 5vw, 3rem);
  line-height: 1.1;
  color: var(--color-steel-100);
}

.err__text {
  margin: 1.25rem auto 0;
  max-width: 32rem;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-steel-400);
}

.err__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem 2.5rem;
  margin-top: 2.5rem;
}

.err__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-steel-100);
  border-bottom: 1px solid var(--color-swiss-500);
  padding-bottom: 0.35rem;
  transition: color 200ms ease;
}
.err__link:hover {
  color: var(--color-swiss-400);
}

.err__link--muted {
  color: var(--color-steel-400);
  border-color: var(--color-graphite-600);
}
</style>
