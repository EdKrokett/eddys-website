<script setup lang="ts">
/**
 * Kein Kontaktformular: ohne eigenes Backend müsste der Versand über einen
 * Drittanbieter laufen (zusätzliche Auftragsverarbeitung, Spam-Schutz, Consent).
 * Direkter Mail-Link plus Terminbuchung erfüllen denselben Zweck ohne diesen Aufwand.
 *
 * `CALENDLY_URL` ist noch nicht gepflegt (app/utils/site.ts) — der Terminblock
 * erscheint erst, wenn der Link eingetragen ist.
 */
const socials = activeSocialProfiles()

useSeoMeta({
  title: 'Kontakt — Eduard Andrae',
  description:
    'Kontakt zu Eduard Andrae: per E-Mail, über LinkedIn oder direkt einen Termin buchen.',
})
</script>

<template>
  <div>
    <section class="head">
      <UContainer>
        <p class="kicker">
          <span class="head__mark" aria-hidden="true" />Kontakt
        </p>

        <h1 class="head__title">
          Reden wir.
        </h1>

        <p class="head__lead">
          Ob Blog-Kooperation, agile Fragen oder eine gemeinsame Laufrunde in
          Bremen — schreib mir einfach.
        </p>
      </UContainer>
    </section>

    <section class="body">
      <UContainer>
        <div class="channels">
          <!-- E-Mail -->
          <a :href="`mailto:${CONTACT_EMAIL}`" class="channel">
            <span class="channel__num">01</span>
            <div class="channel__main">
              <h2 class="channel__title">
                E-Mail
              </h2>
              <p class="channel__value">{{ CONTACT_EMAIL }}</p>
              <p class="channel__hint">
                Der direkteste Weg. Ich antworte meist innerhalb von ein, zwei Tagen.
              </p>
            </div>
            <Icon name="lucide:arrow-up-right" class="channel__icon size-5" />
          </a>

          <!-- Termin (nur wenn Calendly-Link gepflegt ist) -->
          <a
            v-if="CALENDLY_URL"
            :href="CALENDLY_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="channel"
          >
            <span class="channel__num">02</span>
            <div class="channel__main">
              <h2 class="channel__title">
                Termin buchen
              </h2>
              <p class="channel__value">
                Direkt einen Slot wählen
              </p>
              <p class="channel__hint">
                Für alles, was sich im Gespräch schneller klärt als per Mail.
              </p>
            </div>
            <Icon name="lucide:arrow-up-right" class="channel__icon size-5" />
          </a>

          <!-- Profile -->
          <div v-if="socials.length" class="channel channel--static">
            <span class="channel__num">{{ CALENDLY_URL ? '03' : '02' }}</span>
            <div class="channel__main">
              <h2 class="channel__title">
                Profile
              </h2>
              <div class="channel__socials">
                <a
                  v-for="social in socials"
                  :key="social.name"
                  :href="social.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="social"
                >
                  <Icon :name="social.icon" class="size-4" />
                  {{ social.name }}
                  <Icon name="lucide:arrow-up-right" class="social__icon size-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Standort -->
        <aside class="place">
          <p class="place__label">
            Standort
          </p>
          <p class="place__text">
            Bremen-Arsten. Läufer sind ausdrücklich eingeladen,
            vorbeizukommen und eine Runde mitzudrehen.
          </p>
        </aside>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.head {
  padding: clamp(3.5rem, 8vw, 5.5rem) 0 clamp(2.5rem, 5vw, 3.5rem);
  background:
    radial-gradient(80% 70% at 15% 0%, rgba(200, 16, 46, 0.07) 0%, transparent 55%),
    var(--color-graphite-950);
  border-bottom: 1px solid var(--color-graphite-700);
}

.head__mark {
  width: 1.75rem;
  height: 1px;
  background: var(--color-swiss-500);
}

.head__title {
  margin-top: 1.25rem;
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-steel-100);
}

.head__lead {
  margin-top: 1.25rem;
  max-width: 32rem;
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--color-steel-400);
}

.body {
  padding: clamp(3rem, 7vw, 5rem) 0 clamp(4rem, 9vw, 7rem);
}

/* ── Kanäle ─────────────────────────────────────────────────────────────── */
.channels {
  border-top: 1px solid var(--color-graphite-700);
}

.channel {
  position: relative;
  display: grid;
  grid-template-columns: 2.5rem 1fr auto;
  gap: 1.25rem;
  align-items: start;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--color-graphite-800);
  transition: background 250ms ease;
}
@media (min-width: 768px) {
  .channel {
    grid-template-columns: 4rem 1fr auto;
    gap: 2rem;
    padding: 2.25rem 1rem;
  }
  .channel:hover:not(.channel--static) {
    background: var(--color-graphite-850);
  }
}

.channel__num {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-steel-600);
  padding-top: 0.4rem;
  font-variant-numeric: tabular-nums;
}

.channel__title {
  font-size: 1.35rem;
  color: var(--color-steel-100);
}

.channel__value {
  margin-top: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-swiss-400);
  word-break: break-word;
}

.channel__hint {
  margin-top: 0.6rem;
  max-width: 30rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-steel-500);
}

.channel__icon {
  color: var(--color-steel-600);
  transition: color 200ms ease, translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.channel:hover .channel__icon {
  color: var(--color-swiss-400);
  translate: 0.2rem -0.2rem;
}

.channel__socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.social {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-graphite-700);
  padding: 0.5rem 0.9rem;
  font-size: 0.8rem;
  color: var(--color-steel-300);
  transition: color 200ms ease, border-color 200ms ease;
}
.social:hover {
  color: var(--color-steel-100);
  border-color: var(--color-swiss-500);
}
.social__icon {
  color: var(--color-steel-600);
}

/* ── Standort ───────────────────────────────────────────────────────────── */
.place {
  display: grid;
  gap: 0.75rem;
  margin-top: clamp(3rem, 6vw, 4.5rem);
  max-width: 32rem;
}
@media (min-width: 768px) {
  .place {
    grid-template-columns: 4rem 1fr;
    gap: 2rem;
    max-width: none;
    padding-inline: 1rem;
  }
}

.place__label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-steel-600);
  padding-top: 0.25rem;
}

.place__text {
  max-width: 30rem;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--color-steel-400);
}
</style>
