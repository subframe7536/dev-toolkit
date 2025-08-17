# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based developer toolset providing utilities for common development tasks like JSON formatting, encoding/decoding, crypto operations, and more. Built with modern web technologies.

## Tech Stack

- **Framework**: Solid.js 1.9.8
- **Routing**: @solidjs/router + @generouted/solid-router (file-based routing)
- **Styling**: UnoCSS with Tailwind v4 preset
- **Build Tool**: Vite 7.1.1
- **Language**: TypeScript
- **UI Components**: Kobalte Core (headless components)
- **Package Manager**: Bun

## Development Commands

```bash
# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run preview      # Preview production build
bun run serve        # Alias for preview
bun run format       # Run ESLint with auto-fix
```

## Project Structure

```
src/
├── components/
│   └── ui/          # Reusable UI components (Button, Dialog, etc.)
├── pages/           # File-based routing
│   ├── _app.tsx     # App layout wrapper
│   ├── index.tsx    # Home page
│   ├── data.tsx     # Data tools page
│   └── nest/        # Nested routes
├── route.tsx        # File-based router configuration
└── index.ts         # App entry point
```

## Architecture Patterns

### Routing
- Uses `@generouted/solid-router` for file-based routing
- Routes automatically generated from `/src/pages/**` structure
- Special files: `_app.tsx` (layout), `+modal.tsx` (modals), `404.tsx` (not found)
- Modal system with global state management

### Component System
- **UI Components**: Located in `src/components/ui/`
- Uses Kobalte Core for accessible headless components
- Styling with UnoCSS utility classes
- Variant system via `cls-variant` library

### Styling
- UnoCSS with custom configuration in `unocss.config.ts`
- Custom color system with semantic tokens
- Responsive design utilities
- Reuse class style variant, based on UnoCSS's `transformerVariantGroup` (e.g. `hover:bg-red hover:color-blue` to `hover:(bg-red color-blue)`)
- Use icon through `i-lucide:<icon-name>` class, based on UnoCSS's `presetIcon`
- Animation presets via `unocss-preset-animations`

### Build Configuration
- **Base Path**: `/dev-toolkit` (set in vite.config.ts)
- **PWA**: Configured with Vite PWA plugin
- **TypeScript**: Strict mode with path aliases (`#/*` maps to `./src/*`)

## Key Files

- `vite.config.ts`: Build configuration with PWA setup
- `unocss.config.ts`: Styling configuration and design tokens
- `src/route.tsx`: File-based routing setup
- `src/pages/_app.tsx`: Global app layout and navigation
- `eslint.config.ts`: ESLint configuration

## Development Notes

- No test setup currently configured
- Uses Bun as package manager (bun.lock present)
- ESLint configured with @subframe7536/eslint-config
- All components use TypeScript with strict null checks
- UI components follow compound component pattern with Kobalte
- Custom extractors for icon handling in UnoCSS
- `src/router.gen.ts` will auto update on save during dev

## Code Style
- Use single quotes, 2-space indentation, semicolons as needed
- JSX: Use class not className, preserve JSX syntax
Imports: Use ~/ for relative imports, import types with type
- Components: Default function export, no prop destructuring in params
- Files: Use .tsx for components, .ts for utilities
- Functions: Prefer function declarations over arrow functions for components
- Error handling: Use try/catch blocks, provide meaningful error messages

### Naming Conventions
- Use camelCase for JavaScript/TypeScript variables and functions
- Use PascalCase for Solidjs components, classes and types
- Use kebab-case for file names and directories
- Use SCREAMING_SNAKE_CASE for environment variables and constants

## Key Workflows

### Vibe Coding Workflow (Task-Based Development)
1. `/create-prd` - Creates Product Requirements Documents from user input
2. `/generate-tasks` - Generates task lists from PRDs
3. `/process-task-list` - Manages and tracks task progress

When using these commands:
- PRDs are saved as `prd-[feature-name].md` in `/tasks` directory
- Always ask clarifying questions before generating PRDs
- Target junior developers in documentation clarity

### Planning Strategies
- Use "think hard" variants for deeper analysis: "think" < "think hard" < "think harder" < "ultrathink"
- Write plans to external files (e.g., plan.md) as checklists
- Use `plan.prompt.md` as external memory for task management
- Switch between modes: `plan mode` → verify, then `auto-accept mode` → execute