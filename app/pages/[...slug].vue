<script setup lang="ts">
/**
 * 301 auf blog.eduard-andrae.de für alles, was hier keine Seite ist.
 *
 * Hintergrund: WordPress lief bis Phase B der Domain-Migration direkt auf
 * eduard-andrae.de. Alte Backlinks und Suchmaschinen-Einträge zeigen deshalb auf
 * Pfade wie /mein-alter-beitrag/, die es in dieser Nuxt-App nicht gibt. Ohne
 * Weiterleitung wären das nach der DNS-Umschaltung (Phase C) lauter 404er.
 *
 * WARUM als Catch-all-Route und nicht als Server-Middleware:
 * Die erste Fassung war eine Nitro-Middleware mit einer handgepflegten Liste
 * bekannter Pfade — die war beim Anlegen der ersten neuen Seite sofort falsch
 * (/ueber-mich, /kontakt und /datenschutz landeten bei WordPress). Eine
 * Catch-all-Route kann diesen Fehler baulich nicht machen: Sie greift nur, wenn
 * der Router keine echte Seite gefunden hat. Neue Seiten müssen nirgends
 * nachgetragen werden.
 *
 * Nitro-Routen (/api/*), statische Dateien (/robots.txt, /sitemap.xml, /_nuxt/*)
 * werden vor dem Vue-Router bedient und sind hier ebenfalls nicht betroffen.
 *
 * Bewusste Abwägung: Auch Tippfehler landen so bei WordPress statt auf der eigenen
 * 404-Seite. Der Anteil echter Alt-URLs ist nach 20 Jahren Blog aber ungleich
 * größer, und WordPress hat seinerseits eine 404-Seite. app/error.vue bleibt für
 * Fehler zuständig, die eine Seite aktiv wirft (z. B. unbekannter Blog-Slug).
 */
const route = useRoute()

await navigateTo(`https://blog.eduard-andrae.de${route.fullPath}`, {
  external: true,
  redirectCode: 301,
})
</script>

<template>
  <div />
</template>
