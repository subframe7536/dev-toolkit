import unocss from '@unocss/vite'
import { fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'
import { VitePWA as pwa } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'
import tsconfig from 'vite-tsconfig-paths'

const base = '/dev-toolkit'

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
        category: 'string',
        icon: 'string',
        tags: 'string[]',
      },
    }),
    pwa({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
        type: 'module',
      },
      manifest: {
        name: 'Dev Toolkit',
        short_name: 'DevTools',
        description: 'Tools for developers',
        start_url: `${base}/`,
        display: 'standalone',
        background_color: '#0000',
        theme_color: '#0000',
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
