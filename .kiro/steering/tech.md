# Tech Stack

# RULES FOR AGENT

- Fix lint error using `pnpm run format`
- Try to use ChromeDevTools MCP first

## Core Technologies

- **Framework**: SolidJS 1.9.10
- **Router**: solid-file-router (file-based routing with type generation)
- **Build Tool**: Vite 7.2.4
- **Package Manager**: pnpm
- **Language**: TypeScript 5.9.3

## UI & Styling

- **Component Library**: Kobalte Core (accessible primitives)
- **Styling**: UnoCSS with Variant Group Transformer (e.g. use `b-(1 red)` instead of `b-1 b-red`)
- **Icons**: Iconify with Lucide icon set
- **Notifications**: solid-sonner (toast notifications, port from `sonner`)

## Key Libraries

- **Table Processing**: @tanstack/solid-table, papaparse, xlsx
- **Data Parsing**: js-yaml, jsonrepair
- **Testing**: vitest

## Common Commands

```bash
# Development
pnpm run dev          # Start dev server
pnpm run build        # Build for production
pnpm run preview      # Preview production build

# Code Quality
pnpm run lint         # Lint code
pnpm run format       # Format code with oxfmt
pnpm test             # Run all tests once
pnpm test:watch       # Watch tests during development
pnpm test <file>      # Run specific test file

# Package Management
pnpm add <package>    # Add dependency
```

## Configuration Files

- `vite.config.ts` - Vite with solid-file-router plugin
- `tsconfig.json` - TypeScript with `#/*` path alias for `./src/*`
- `unocss.config.ts` - UnoCSS styling configuration
- `eslint.config.ts` - ESLint rules

## Build Configuration

- Base path: `/` (configured in vite.config.ts)
- PWA enabled with auto-update service worker
- Import alias: `#/` maps to `./src/`

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
