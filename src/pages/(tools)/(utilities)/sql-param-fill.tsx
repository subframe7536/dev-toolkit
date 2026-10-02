import { Button, Textarea } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal } from 'solid-js'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { fillSqlParams, splitSqlAndParams } from '#/utils/sql'

export default createRoute({
  info: {
    title: 'SQL Parameter Fill',
    description: 'Fill SQL template with MyBatis-style parameters',
    category: 'Utilities',
    icon: 'i-lucide-database',
    tags: ['sql', 'mybatis', 'parameters', 'database'],
  },
  component: SqlParamFill,
})

function SqlParamFill() {
  const [sqlInput, setSqlInput] = createSignal('')
  const [paramsInput, setParamsInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal('')

  const loadSample = () => {
    setSqlInput('SELECT * FROM users WHERE id = ? AND name = ? AND created_at > ?')
    setParamsInput('1001(Integer), John Doe(String), 2024-01-01T00:00(LocalDateTime)')
  }

  const handleClear = () => {
    setSqlInput('')
    setParamsInput('')
    setOutput('')
    setError('')
  }

  // Auto-split MyBatis logs
  createEffect(() => {
    const input = sqlInput()
    if (input && input.includes('Preparing:') && input.includes('Parameters:')) {
      const result = splitSqlAndParams(input)
      if (result.sql && result.params) {
        setSqlInput(result.sql)
        setParamsInput(result.params)
      }
    }
  })

  // Fill parameters
  createEffect(() => {
    let sql = sqlInput()
    let params = paramsInput()

    if (!sql || !params) {
      setOutput('')
      setError('')
      return
    }

    if (sql.includes('Preparing:') && params.includes('Parameters:')) {
      const result = splitSqlAndParams(sql + params)
      sql = result.sql
      params = result.params
    }

    try {
      const result = fillSqlParams(sql, params)
      setOutput(result)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
      setOutput('')
    }
  })

  return (
    <div class="flex flex-col gap-6">
      <div class="tool-actions">
        <Button onClick={loadSample} variant="outline" size="sm">
          Load Sample
        </Button>
      </div>

      <div class="tool-grid">
        <div class="tool-field">
          <label class="font-medium text-sm">SQL Template</label>
          <Textarea
            aria-label="SQL Template"
            value={sqlInput()}
            onValueChange={setSqlInput}
            placeholder={`All Mybatis logs\n\nor\n\nSELECT * FROM T WHERE id = ? AND name = ?`}
            classes={{ root: 'text-sm leading-relaxed font-mono h-48 resize-y' }}
          />
        </div>

        <div class="tool-field">
          <label class="font-medium text-sm">Parameters</label>
          <Textarea
            aria-label="Parameters"
            value={paramsInput()}
            onValueChange={setParamsInput}
            placeholder="1(Integer), zhangshan(String)"
            classes={{ root: 'text-sm leading-relaxed font-mono h-48 resize-y' }}
          />
        </div>
      </div>

      <div class="relative">
        <div class="tool-field">
          <label class="font-medium text-sm">Output</label>
          <Textarea
            aria-label="Output"
            aria-invalid={!!error()}
            value={error() || output()}
            readOnly
            placeholder="SELECT * FROM T WHERE id=1 AND name='zhangshan'"
            classes={{
              root: [
                error() && 'text-destructive',
                'text-sm leading-relaxed font-mono bg-muted/30 h-48 resize-y',
              ],
            }}
          />
        </div>
        <div class="mt-4 tool-actions">
          <CopyButton content={output()} disabled={!output() || !!error()} variant="secondary" />
          <ClearButton onClear={handleClear} disabled={!sqlInput() && !paramsInput()} />
        </div>
      </div>

      <div class="text-muted-foreground leading-relaxed p-4 bg-muted space-y-3 text-sm rounded-lg">
        <div>
          <strong>How to use:</strong>
          <ul class="mt-1 list-disc list-inside space-y-0.5">
            <li>Paste MyBatis log directly in the top left textarea</li>
            <li>
              Or enter SQL template (with <code class="px-1 rounded bg-muted">?</code> placeholders)
              and parameters separately
            </li>
          </ul>
        </div>
        <div>
          <strong>Parameter format:</strong>
          <code class="px-1.5 py-0.5 rounded bg-muted text-xs">value(Type), value(Type), ...</code>
          <div class="mt-1">
            Supported types: <code class="px-1 rounded bg-muted text-xs">String</code>,{' '}
            <code class="px-1 rounded bg-muted text-xs">Integer</code>,{' '}
            <code class="px-1 rounded bg-muted text-xs">Long</code>,{' '}
            <code class="px-1 rounded bg-muted text-xs">Timestamp</code>
          </div>
        </div>
      </div>
    </div>
  )
}
