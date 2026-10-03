import { Field, Button, Textarea } from 'moraine'
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
    <div class="flex flex-col gap-4">
      <div class="tool-editor-grid">
        <Field
          label="SQL Template"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            value={sqlInput()}
            onValueChange={setSqlInput}
            placeholder={`All Mybatis logs\n\nor\n\nSELECT * FROM T WHERE id = ? AND name = ?`}
            classes={{ root: 'tool-editor' }}
          />
        </Field>

        <Field
          label="Parameters"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            value={paramsInput()}
            onValueChange={setParamsInput}
            placeholder="1(Integer), zhangshan(String)"
            classes={{ root: 'tool-editor' }}
          />
        </Field>
      </div>

      <div class="relative">
        <Field
          label="Output"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            aria-invalid={!!error()}
            value={error() || output()}
            readOnly
            placeholder="SELECT * FROM T WHERE id=1 AND name='zhangshan'"
            classes={{
              root: [error() && 'text-destructive', 'tool-editor bg-muted/30'],
            }}
          />
        </Field>
        <div class="mt-4 tool-toolbar">
          <Button onClick={loadSample} variant="outline">
            Load Sample
          </Button>
          <CopyButton
            text="Copy Output"
            content={output()}
            disabled={!output() || !!error()}
            variant="secondary"
          />
          <ClearButton onClear={handleClear} disabled={!sqlInput() && !paramsInput()} />
        </div>
      </div>

      <div class="text-muted-foreground leading-relaxed pt-4 border-t border-border space-y-3 text-sm rounded-lg">
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
