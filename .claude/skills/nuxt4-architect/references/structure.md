# Nuxt 4 Directory Structure

## Project Layout

```
project-root/
├── app/                     # ALL Vue source code
│   ├── app.vue              # Root component (must contain <UApp>)
│   ├── app.config.ts        # App-level config (UI colors, etc.)
│   ├── error.vue            # Error page
│   ├── assets/               # Processed assets (CSS, images)
│   │   └── css/main.css      # Tailwind entry + @theme
│   ├── components/           # Auto-imported components
│   ├── composables/          # Auto-imported composables
│   ├── layouts/               # Page layouts
│   ├── middleware/            # Route middleware
│   ├── pages/                 # File-based routing
│   ├── plugins/                # Nuxt plugins
│   └── utils/                  # Auto-imported utilities
├── server/                  # Nitro server (stays at project root!)
│   ├── api/                 # API routes (/api/*)
│   ├── routes/               # Server routes (no /api prefix)
│   └── middleware/            # Server middleware
├── shared/                  # Code shared between app & server
│   └── types/                # Shared TypeScript types
├── public/                  # Static assets (served as-is)
├── nuxt.config.ts           # Nuxt configuration
├── package.json
└── tsconfig.json
```

## Key Rules

### Auto-Import Scope
Nuxt 4 scans ONLY `app/` for auto-imports. Files in `components/` at the project root are invisible to the auto-import system.

### Component Naming
Components in subdirectories use path-based names:
- `app/components/base/Button.vue` → `<BaseButton />`
- `app/components/ui/Card.vue` → `<UiCard />`
- Avoid `index.vue` for components; prefer explicit names.

### Server Code
Server code NEVER goes into `app/`. The `server/` directory stays at the project root.
- Use `#server` alias for server-only imports
- Use `shared/` for code shared between app and server

Import aliases and `<UApp>` wrapper requirement → see SKILL.md.
