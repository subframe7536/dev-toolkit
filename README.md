## Dev Toolkit

A privacy-first web-based developer toolset providing 14+ essential utilities. All processing happens client-side with offline support.

### Features

**JSON Tools**

- Format, repair, convert keys (camelCase/snake_case/etc)
- Generate JSONSchema
- Convert to/from YAML/TypeScript/Java/Query Params

**Encoding/Decoding**

- Base64
- Hex
- URL
- Unicode
- HTML entity

**Utilities**

- MD5, SHA-1/256/512 hash generation
- UUID generator
- Color converter (RGB/HEX/HSL/OKLCH)
- Date/time formatter and mutator
- Image transformer and converter
- SQL parameter filler
- Table editor (CSV/Excel/Markdown/SQL)
- Text case converter

### Testing

Tests use Vitest with the default Node.js environment. Component tests opt into jsdom.

```bash
pnpm test              # Run all tests once
pnpm test:watch        # Watch tests during development
pnpm test text-case    # Run tests matching a file name
```

### Todo

- [ ] jwt analyze
- [ ] regex input misalign and redudant scrollbar
- [ ] regex tester page scrollbar eliminate
- [ ] json object to python/java class
- [ ] java class to api doc table
