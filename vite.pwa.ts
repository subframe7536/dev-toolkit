import type { Plugin, ResolvedConfig } from 'vite'

interface ManualPwaOptions {
  name: string
  shortName: string
  description: string
}

const PUBLIC_ASSETS = [
  'manifest.webmanifest',
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-maskable-192x192.png',
  'pwa-maskable-512x512.png',
]

export function manualPwa(options: ManualPwaOptions): Plugin {
  let config: ResolvedConfig

  return {
    name: 'manual-pwa',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== getManifestPath(config.base)) {
          next()
          return
        }

        response.setHeader('Content-Type', 'application/manifest+json')
        response.end(serializeManifest(createManifest(options)))
      })
    },
    generateBundle(_, bundle) {
      const manifest = createManifest(options)
      const bundleAssets = getBundleAssets(bundle)
      const precacheUrls = unique(['.', ...PUBLIC_ASSETS, ...bundleAssets])
      const buildId = new Date().toISOString()

      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: serializeManifest(manifest),
      })

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: createServiceWorker({
          buildId,
          cachePrefix: config.root.split('/').at(-1) ?? 'app',
          precacheUrls,
        }),
      })
    },
  }
}

function serializeManifest(manifest: ReturnType<typeof createManifest>) {
  return `${JSON.stringify(manifest, null, 2)}\n`
}

function getManifestPath(base: string) {
  const normalizedBase = base === '' || base === './' ? '/' : base

  return new URL('manifest.webmanifest', `http://localhost${normalizedBase}`).pathname
}

function createManifest(options: ManualPwaOptions) {
  return {
    name: options.name,
    short_name: options.shortName,
    description: options.description,
    start_url: '.',
    scope: '.',
    display: 'standalone',
    background_color: '#00000000',
    theme_color: '#00000000',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}

function getBundleAssets(bundle: Record<string, unknown>) {
  return Object.values(bundle)
    .flatMap((output) => (hasFileName(output) ? [output.fileName] : []))
    .filter((fileName) => !fileName.endsWith('.map') && fileName !== 'sw.js')
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function hasFileName(output: unknown): output is { fileName: string } {
  return (
    typeof output === 'object' &&
    output !== null &&
    'fileName' in output &&
    typeof output.fileName === 'string'
  )
}

function createServiceWorker(options: {
  buildId: string
  cachePrefix: string
  precacheUrls: string[]
}) {
  const cacheName = `${options.cachePrefix}-precache-${options.buildId}`

  return `const CACHE_NAME = ${JSON.stringify(cacheName)}
const PRECACHE_URLS = ${JSON.stringify(options.precacheUrls, null, 2)}

const resolveUrl = url => new URL(url, self.registration.scope).toString()

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache =>
        cache.addAll(PRECACHE_URLS.map(url => new Request(resolveUrl(url), { cache: 'reload' }))),
      ),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', event => {
  const { request } = event
  const requestUrl = new URL(request.url)

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)

    if (response.ok) {
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    return (await caches.match(request)) ?? (await caches.match(resolveUrl('.'))) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }

  return response
}
`
}
