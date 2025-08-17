import { defineEslintConfig } from '@subframe7536/eslint-config'

export default defineEslintConfig({
  ignoreRuleOnFile: [
    { files: '**/*.md', rules: ['style/eol-last'] },
  ],
})
