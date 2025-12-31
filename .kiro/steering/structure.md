# Project Structure

## Directory Organization

```
src/
  pages/              # File-based routes (auto-generates routing)
    _app.tsx          # Root layout
    index.tsx         # Homepage (auto-generates from route metadata)
    404.tsx           # Not found page
    (tools)/          # Tools section (route group)
      _layout.tsx     # Shared layout for all tools
      (utilities)/    # Utility tools category
      (encode)/       # Encoding/decoding tools category
      (json)/         # JSON tools category
  
  components/         # Reusable components
    ui/               # UI component library (Kobalte-based, ShadCN like)
    [feature]/        # Feature-specific component folders
      index.ts        # Re-exports all components for the feature
      *.tsx           # Individual component files
    [shared].tsx      # Shared components (card, copy-button, etc.)
  
  contexts/           # SolidJS contexts for global state management
    [feature]-context.tsx  # Feature-specific context providers
  
  utils/              # Pure utility functions (business logic)
    [feature]/        # Feature-specific utilities
      *.test.ts       # Unit tests for utilities
```

### Feature Component Organization

Complex features should organize components in dedicated folders:

```
components/
  regex-tester/       # Regex tester feature components
    index.ts          # Re-exports: DetailsPanel, ExplanationPanel, etc.
    details-panel.tsx
    explanation-panel.tsx
    help-panel.tsx
    pattern-input.tsx
    pattern-library.tsx
    testing-panel.tsx
  table-editor/       # Table editor feature components
    index.ts
    export-dialog.tsx
    input-section.tsx
    table-actions.tsx
  image-converter/    # Image converter feature components
    ...
```

Import pattern for feature components:
```tsx
import { DetailsPanel, PatternInput } from '#/components/regex-tester'
```

## Architecture Patterns

### Separation of Concerns

- **Pages**: Thin UI wrappers managing state and user interactions
- **Contexts**: Global state management using SolidJS contexts and stores
- **Utils**: Pure, testable computation logic separated from UI
- **Components**: Reusable UI elements

### Route Metadata Pattern

Every tool page MUST define metadata in `createRoute()`:

```tsx
export default createRoute({
  info: { title: string },                // Optional: @solidjs/router's `RouteDefinition['info']` for metadata
  matchFilters: {...}                     // Optional: @solidjs/router's `RouteDefinition['matchFilters']` for custom route matching
  preload: async (params) => data,        // Optional: @solidjs/router's `RouteDefinition['preload']` for data fetching
  component: (props) => JSX.Element,      // Required: Route component
  loadingComponent: () => JSX.Element,    // Optional: Loading state
  errorComponent: (props) => JSX.Element, // Optional: Error boundary
})
```

The homepage and sidebar auto-generate content by reading `fileRoutes` via `src/utils/routes.ts`.

### Type-Safe Navigation

```tsx
import { useNavigate } from '@solidjs/router'
import { generatePath } from 'solid-file-router'

// TypeScript validates paths and parameters
const path = generatePath('/blog/:id', { $id: '123' })
navigate(path)
```

### Naming Conventions

- File name: kebab-case
- Test files: `*.test.ts` alongside the file being tested
- Global constant: UPPER_SNAKE_CASE
- Variable: camelCase
- Function Component and Class: PascalCase

### Import Patterns

- Use `#/` alias for imports: `import { foo } from '#/utils/bar'`
- Virtual routes: `import { fileRoutes, Root } from 'virtual:routes'`

## Key Directories

- `.kiro/` - Kiro IDE configuration and steering rules
- `public/` - Static assets (icons, PWA assets)
- `dist/` - Production build output
- `dev-dist/` - Development build output
