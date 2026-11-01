import { resolve } from 'node:path'

import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    solid({ hot: false }),
    {
      // Route consumers supply metadata fixtures through vi.mock in component tests.
      name: 'test-route-metadata',
      resolveId: (id) => (id === 'virtual:routes' ? '\0virtual:routes' : undefined),
      load: (id) => (id === '\0virtual:routes' ? 'export const fileRoutes = []' : undefined),
    },
  ],
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '#': resolve(import.meta.dirname, 'src'),
    },
  },
})
