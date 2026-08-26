<script setup lang="ts">
/**
 * 1:1 aus trusted-blogs übernommen (tb26-code/frontend/app/components/home/ServiceCategories.vue,
 * auf Eddys Wunsch inklusive Teal/Cream-Optik statt Anpassung an das dunkle
 * Taschenmesser-Konzept dieser Seite — bewusste Design-Entscheidung, kein Versehen).
 * Inhalte sind Platzhalter, echter Text folgt.
 */
const services = [
  {
    id: 'platzhalter-1',
    icon: 'lucide:sparkles',
    title: 'Platzhalter-Titel 1',
    description: 'Platzhaltertext — echter Inhalt folgt.',
    color: 'from-[#21A4A3] to-[#1B9488]',
    bgColor: 'bg-[#e8f9f8]',
  },
  {
    id: 'platzhalter-2',
    icon: 'lucide:layers',
    title: 'Platzhalter-Titel 2',
    description: 'Platzhaltertext — echter Inhalt folgt.',
    color: 'from-[#58C5BB] to-[#63CDAB]',
    bgColor: 'bg-[#d1f5f4]',
  },
  {
    id: 'platzhalter-3',
    icon: 'lucide:target',
    title: 'Platzhalter-Titel 3',
    description: 'Platzhaltertext — echter Inhalt folgt.',
    color: 'from-[#077E6F] to-[#6AA79B]',
    bgColor: 'bg-[#c8ede8]',
  },
]
</script>

<template>
  <section class="border-y border-[#dcd7ca] bg-[#f5efe0]">
    <UContainer class="py-20 lg:py-32">
      <div class="mb-16 text-center">
        <h2 class="mb-6 text-4xl font-bold text-neutral-900 lg:text-5xl">
          Platzhalter-Überschrift
        </h2>
        <p class="mx-auto max-w-2xl text-xl text-neutral-600">
          Platzhalter-Unterzeile — echter Inhalt folgt.
        </p>
      </div>

      <div class="grid gap-10 sm:grid-cols-3">
        <div
          v-for="service in services"
          :key="service.id"
          :class="service.bgColor"
          class="group rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl"
        >
          <div class="mb-6 flex justify-center">
            <div class="relative">
              <div :class="['absolute inset-0 rounded-2xl bg-gradient-to-br opacity-30 blur-2xl transition-opacity group-hover:opacity-50', service.color]" />
              <div :class="['relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-xl transition-all duration-300 group-hover:scale-110', service.color]">
                <Icon :name="service.icon" class="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          <h3 class="mb-4 text-center text-2xl font-bold text-neutral-900">
            {{ service.title }}
          </h3>

          <p class="text-center text-base leading-relaxed text-neutral-600">
            {{ service.description }}
          </p>
        </div>
      </div>
    </UContainer>
  </section>
</template>
