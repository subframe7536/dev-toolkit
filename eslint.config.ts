import { defineEslintConfig } from '@subframe7536/eslint-config'

export default defineEslintConfig({
  ignoreAll: ['agents.md', '.kiro/**'],
  ignoreRuleOnFile: [
    { files: '**/*.md', rules: ['style/eol-last'] },
  ],
})
