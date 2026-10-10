import { subfLint } from '@subf/config/oxlint'

export default subfLint({
  solid: true,
  unocss: true,
  ignorePatterns: ['src/routes.d.ts'],
})
