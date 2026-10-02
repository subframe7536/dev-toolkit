import { resolve } from 'node:path'

import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '#': resolve(import.meta.dirname, 'src'),
    },
  },
})
