import unocss from '@unocss/vite'
import { fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'
import { meta } from 'vite-plugin-meta-tags'
import { VitePWA as pwa } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'
import tsconfig from 'vite-tsconfig-paths'

// const base = '/dev-toolkit'
const base = ''

const title = 'Dev Toolkit'
const description = 'Tools for developers, just in browser'
const url = 'https://tool.subf.dev'
export default defineConfig({
  base,
  plugins: [
    tsconfig(),
    unocss({ inspector: false }),
    solid(),
    fileRouter({
      infoDts: {
        title: 'string',
        description: 'string',
        category: '"Encoding" | "JSON" | "Utilities"',
        // eslint-disable-next-line no-template-curly-in-string
        icon: '`lucide:${string}`',
        tags: 'string[]',
      },
    }),
    meta({
      title,
      description,
      url,
      img: `${url}/og-image.jpg`,
    }),
    pwa({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
        type: 'module',
      },
      workbox: {
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: title,
        short_name: title.replaceAll(' ', ''),
        description,
        start_url: `${base}/`,
        display: 'standalone',
        background_color: '#00000000',
        theme_color: '#00000000',
        icons: [
          {
            src: `${base}/pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}/pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}/pwa-maskable-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${base}/pwa-maskable-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
