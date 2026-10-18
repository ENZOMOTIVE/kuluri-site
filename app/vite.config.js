import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// base './' so the build works from a sub-path and inside the Capacitor Android WebView.
// PREVIEW=1 inlines all assets (icon fonts) for single-file previews.
export default defineConfig({
  base: './',
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar(),
  ],
  resolve: {
    // @vue/devtools-api is an optional peer dep not installed in production;
    // stub it so Privy/viem don't generate a bare browser import for it.
    alias: {
      '@vue/devtools-api': fileURLToPath(new URL('./src/stubs/devtools-api.js', import.meta.url)),
    },
  },
  build: {
    assetsInlineLimit: process.env.PREVIEW ? 100_000_000 : 4096,
    ...(process.env.PREVIEW ? { rolldownOptions: { output: { inlineDynamicImports: true } } } : {}),
  },
})
