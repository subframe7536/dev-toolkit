# Dev Toolkit - Agent Documentation

## Project Overview

Dev Toolkit is a comprehensive web-based developer toolset providing 22+ essential utilities for common development tasks. It's built with SolidJS and uses a file-based routing system via `solid-file-router`. The project emphasizes privacy-first design with all processing happening client-side, enabling offline functionality after initial load.

## Current Development Status (dev-tool-clone spec)

The project is actively implementing a full suite of developer tools organized into categories:

**Key Implementation Pattern:**
Every tool page MUST define metadata in the route's `info` property. Both the homepage and sidebar automatically generate their content by reading `fileRoutes` via `src/utils/routes.ts`:

```typescript
export default createRoute({
  info: {
    title: 'Tool Name',              // Required: Display name
    description: 'Brief description', // Required: Tool description
    category: 'Category Name',        // Required: JSON, Encoding, Crypto, Text, Color, SQL
    icon: 'lucide:icon-name',        // Optional: Lucide icon name
    tags: ['tag1', 'tag2'],          // Optional: Search/filter tags
  },
  component: ToolComponent,
})
```

The `getCategories()` function in `src/utils/routes.ts` automatically:
- Flattens the route tree from `fileRoutes`
- Extracts all routes with `info.title` and `info.category`
- Groups tools by category
- Provides the total tool count

**Architecture Principles:**
- All computation logic separated into utility modules under `src/utils/`
- Page components are thin wrappers managing UI state and user interactions
- Client-side only processing - no server communication for privacy
- Utility functions are pure and testable independently from UI
- UI components in `src/components/ui/` do not require tests (Kobalte primitives)

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
    index.tsx         # Home page (auto-generates from fileRoutes)
    404.tsx           # Not found page
    (tools)/          # Tools section (route group)
      _layout.tsx     # Layout for all tools
      (utilities)/    # Normal tools
        color.tsx
        uuid.tsx
      (encode)/       # Encoding tools
        base64.tsx
        hex.tsx
        html.tsx
        unicode.tsx
        url.tsx
      (json)/         # JSON tools
        json-converter.tsx
        json-formatter.tsx
        json-schema-generator.tsx
  components/         # Reusable components
    ui/               # UI component library (Kobalte-based)
    card.tsx          # Tool card component
  utils/              # Pure utility functions
    json/             # JSON processing utilities
      converter.ts
      formatter.ts
      key-converter.ts
      schema-generator.ts
    color.ts          # Color conversion utilities
    download.ts       # File download helper
    routes.ts         # Route extraction and categorization
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
bun run lint   # Lint code with ESLint
```

### Adding New Tool Pages

1. Create a new file in `src/pages/(tools)/` directory
2. Export a default route using `createRoute()` with required `info` metadata
3. Implement the tool logic in a separate utility file under `src/utils/`
4. The route is automatically available and appears on the homepage
5. Types are auto-generated in `src/routes.d.ts`

Example structure:
```tsx
// src/pages/(tools)/my-tool.tsx
import { createRoute } from 'solid-file-router'
import { myToolFunction } from '#/utils/my-tool'

export default createRoute({
  info: {
    title: 'My Tool',
    description: 'Does something useful',
    category: 'Text',
    icon: 'lucide:wrench',
  },
  component: MyTool,
})

function MyTool() {
  // UI logic here, calling myToolFunction from utils
}
```

```ts
// src/utils/my-tool.ts
export function myToolFunction(input: string): string {
  // Pure computation logic
  return input.toUpperCase()
}
```

## UI Components

Always reuse existing components before creating new ones.

The project uses a shadcn-like UI library built on Kobalte Core, located in `src/components/ui/`:

- `accordion.tsx` - Collapsible content sections
- `button.tsx` - Button component with variants (default, destructive, outline, ghost, link)
- `checkbox.tsx` - Checkbox input
- `combobox.tsx` - Searchable select dropdown
- `dialog.tsx` - Modal dialogs
- `dropdown.tsx` - Dropdown menu component
- `icon.tsx` - Icon component (uses Iconify with Lucide icons)
- `label.tsx` - Form labels
- `select.tsx` - Select dropdown component
- `separator.tsx` - Visual dividers
- `sheet.tsx` - Slide-out panels
- `sidebar.tsx` - Navigation sidebar
- `skeleton.tsx` - Loading placeholders
- `slider.tsx` - Range input slider
- `sonner.tsx` - Toast notifications (solid-sonner)
- `switch.tsx` - Toggle switch
- `tabs.tsx` - Tabbed interface
- `text-field.tsx` - Text input with label support
- `tooltip.tsx` - Hover tooltips

Additional components:
- `card.tsx` - Tool card component for displaying tool info on homepage

### Toast Notifications

Show messages or notifications using `solid-sonner` (SolidJS port of `sonner`):

```tsx
import { toast } from 'solid-sonner'

// Basic toast
toast('Event has been created.')

// Success toast
toast.success('Operation completed!')

// Error toast
toast.error('Something went wrong.')

// With description
toast('Event Created', {
  description: 'Your event has been scheduled.',
})
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
