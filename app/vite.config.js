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
  build: {
    assetsInlineLimit: process.env.PREVIEW ? 100_000_000 : 4096,
    ...(process.env.PREVIEW ? { rolldownOptions: { output: { inlineDynamicImports: true } } } : {}),
  },
})
