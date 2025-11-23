# Dev Toolkit - Agent Documentation

## Project Overview

Dev Toolkit is a web-based developer toolset providing various utilities for common development tasks. It's built with SolidJS and uses a file-based routing system via `solid-file-router`.

## Tech Stack

- **Framework**: SolidJS 1.9.10
- **Router**: solid-file-router (custom file-based routing)
- **Build Tool**: Vite 7.2.2
- **Package Manager**: Bun
- **Styling**: UnoCSS with animations and Tailwind reset
- **UI Components**: Kobalte Core (accessible component primitives)
- **TypeScript**: 5.9.3

## Project Structure

```
src/
  pages/              # File-based routes (see Routing section)
    _app.tsx          # App root and layout
    index.tsx         # Home page
    data.tsx          # Data utilities page
    (tools)/          # Tools section (route group)
      _layout.tsx     # Layout for all tools
      (encode)/       # Encoding utilities
        base64.tsx
      (generation)/   # Generation utilities
        uuid.tsx
      (json)/         # JSON utilities
        formatter.tsx
        converter.tsx
  components/         # Reusable components
    ui/               # UI component library
    card.tsx
  index.ts            # App entry point
  routes.d.ts         # Auto-generated route types
```

## Routing System

This project uses `solid-file-router`, a type-safe file-based routing system for SolidJS.

### Key Concepts

1. **File-based Routes**: Files in `src/pages/` automatically become routes
   - `pages/index.tsx` → `/`
   - `pages/about.tsx` → `/about`
   - `pages/blog/[id].tsx` → `/blog/:id`

2. **Route Definition**: All page files MUST export a default route created with `createRoute()`:
   ```tsx
   import { createRoute } from 'solid-file-router'

   export default createRoute({
     component: () => <div>Page content</div>,
   })
   ```

3. **Layouts**: Use `_layout.tsx` files to wrap nested routes
   - Example: `pages/blog/_layout.tsx` wraps all routes under `/blog`

4. **Dynamic Routes**: Use bracket notation for parameters
   - `[id].tsx` → `:id` parameter
   - `-[lang]/` → Optional `:lang?` parameter

5. **Special Files**:
   - `_app.tsx` - Root layout for entire app
   - `404.tsx` - Fallback for unmatched routes
   - `+modal.tsx` - Modal route (special prefix)

6. **Note**

`fileRoutes` is `@solidjs/router` 's `RouteDefinition`, which is a tree of the route

```tsx
import { Router } from '@solidjs/router'
import { render } from 'solid-js/web'
import { fileRoutes, Root } from 'virtual:routes'

render(() => (
  <Router root={<Root />} preload={true}>
    {fileRoutes}
  </Router>
), document.getElementById('app')!)
```

Type definition:

```ts
export type RouteDefinition<S extends string | string[] = any, T = unknown> = {
  path?: S
  matchFilters?: MatchFilters<S>
  preload?: RoutePreloadFunc<T>
  children?: RouteDefinition | RouteDefinition[]
  component?: Component<RouteSectionProps<T>>
  info?: Record<string, any>
}
```

### Route Configuration Options

```tsx
createRoute({
  info: { title: string },                // Optional: @solidjs/router's `RouteDefinition['info']` for metadata
  matchFilters: {...}                     // Optional: @solidjs/router's `RouteDefinition['matchFilters']` for custom route matching
  preload: async (params) => data,        // Optional: @solidjs/router's `RouteDefinition['preload']` for data fetching
  component: (props) => JSX.Element,      // Required: Route component
  loadingComponent: () => JSX.Element,    // Optional: Loading state
  errorComponent: (props) => JSX.Element, // Optional: Error boundary
})
```

### Type-Safe Navigation

```tsx
import { useNavigate } from '@solidjs/router'
import { generatePath } from 'solid-file-router'

// TypeScript validates paths and parameters
const path = generatePath('/blog/:id', { $id: '123' })
navigate(path)
```

## Development Workflow

### Running the Project

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run preview  # Preview production build
bun run format   # Format code with ESLint
```

### Adding New Routes

1. Create a new file in `src/pages/` directory
2. Export a default route using `createRoute()`
3. The route is automatically available based on file path
4. Types are auto-generated in `src/routes.d.ts`

### Adding New Features

The project roadmap includes:
- JSON utilities (formatter, validator, converter)
- Encoding/decoding tools (Base64, Hex, URL, etc.)
- Cryptography utilities (AES, RSA, MD5)
- Developer tools (Regex tester, color utils, QR codes, UUID generator)
- Text comparison and SQL utilities

## UI Components

You should always try to reuse these components

The project uses a shadcn-like ui lib built on Kobalte Core, located in `src/components/ui/`:

- `accordion.tsx` - Collapsible content sections
- `button.tsx` - Button component
- `checkbox.tsx` - Checkbox input
- `combobox.tsx` - Searchable select
- `dialog.tsx` - Modal dialogs
- `icon.tsx` - Icon component (uses Iconify)
- `label.tsx` - Form labels
- `separator.tsx` - Visual dividers
- `sheet.tsx` - Slide-out panels
- `sidebar.tsx` - Navigation sidebar
- `skeleton.tsx` - Loading placeholders
- `slider.tsx` - Range input
- `switch.tsx` - Toggle switch
- `tabs.tsx` - Tabbed interface
- `text-field.tsx` - Text input
- `tooltip.tsx` - Hover tooltips

### Toast

Show messages or notifications, using `solid-sonner` (solidjs port of `sonner`)

```tsx
import { toast } from "solid-sonner"
toast("Event has been created.")
```

## Styling

- **UnoCSS**: Atomic CSS engine with Tailwind-compatible utilities
- **Animations**: Custom animation presets via `unocss-preset-animations`
- **Theme**: Custom theme preset in `unocss-preset-theme.ts`
- **Icons**: Lucide icons via Iconify and `src/components/ui/icon.tsx` with icon set name and icon name. e.g. `<Icon name="lucide:alert-circle" />`

## Important Notes for Agents

1. **Always use `createRoute()`**: Every page file must export a default route using `createRoute()`
2. **Path parameters**: Use `$` prefix for path params in `generatePath()` (e.g., `$id`)
3. **Base path**: The app is deployed at `/dev-toolkit` base path (see `src/index.ts`)
4. **Virtual module**: Routes are imported from `virtual:routes` (Vite plugin)
5. **Type safety**: Route types are auto-generated - don't manually edit `routes.d.ts`
6. **Component props**: Route components receive `props.children`, `props.data`, etc.
7. **Preloading**: Use `preload` function for data fetching before render
8. **Error handling**: Use `errorComponent` for route-level error boundaries

## Configuration Files

- `vite.config.ts` - Vite configuration with solid-file-router plugin
- `tsconfig.json` - TypeScript configuration
- `unocss.config.ts` - UnoCSS styling configuration
- `eslint.config.ts` - ESLint rules
- `index.html` - HTML entry point

## PWA Support

The project includes PWA capabilities via `vite-plugin-pwa`:
- Service worker for offline support
- App icons in various sizes
- Manifest configuration

## References

- SolidJS docs: https://www.solidjs.com/
- Kobalte UI: https://kobalte.dev/
- UnoCSS: https://unocss.dev/
