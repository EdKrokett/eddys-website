// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // ── Code-Quality Rules ────────────────────────────
  {
    rules: {
      // Console/Debugger
      'no-console': 'warn',
      'no-debugger': 'error',

      // Unused vars: warn, but allow _prefixed intentional ignores
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // No explicit any — keep types meaningful
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // ── Vue Rules ─────────────────────────────────────
  {
    rules: {
      // Nuxt pages are single-word (index.vue, kontakt.vue)
      'vue/multi-word-component-names': 'off',

      // v-html is sometimes needed (WordPress-Content), warn but don't block
      'vue/no-v-html': 'warn',

      // Catch real template bugs
      'vue/no-unused-refs': 'warn',
      'vue/no-ref-as-operand': 'error',
      'vue/valid-v-for': 'error',
      'vue/require-v-for-key': 'error',

      // ── Formatting opinions OFF ───────────────────
      // These are style preferences, not bugs.
      // AI-generated code is readable without enforcing these.
      'vue/singleline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },

  // ── Stylistic overrides ───────────────────────────
  {
    rules: {
      // Multiline operator placement is a style choice, not a bug
      '@stylistic/operator-linebreak': 'off',
    },
  },
)
