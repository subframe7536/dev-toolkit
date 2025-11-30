import { Button } from '#/components/ui/button'
import { TextField, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { fillSqlParams, splitSqlAndParams } from '#/utils/sql'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal } from 'solid-js'

export default createRoute({
  info: {
    title: 'SQL Parameter Fill',
    description: 'Fill SQL template with MyBatis-style parameters',
    category: 'Utilities',
    icon: 'lucide:database',
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
    setParamsInput('1001(Integer), John Doe(String), 2024-01-01 00:00:00(Timestamp)')
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
    <div class="flex flex-col gap-4 h-full">
      <div class="flex justify-end">
        <Button onClick={loadSample} variant="outline" size="sm">
          Load Sample
        </Button>
      </div>

      <div class="flex-1 gap-4 grid grid-cols-1 md:grid-cols-2">
        <TextField>
          <TextFieldLabel>SQL Template</TextFieldLabel>
          <TextFieldTextArea
            value={sqlInput()}
            onInput={e => setSqlInput(e.currentTarget.value)}
            placeholder="SELECT * FROM T WHERE id = ? AND name = ?"
            class="font-mono h-48 resize-none"
          />
        </TextField>

        <TextField>
          <TextFieldLabel>Parameters</TextFieldLabel>
          <TextFieldTextArea
            value={paramsInput()}
            onInput={e => setParamsInput(e.currentTarget.value)}
            placeholder="1(Integer), zhangshan(String)"
            class="font-mono h-48 resize-none"
          />
        </TextField>
      </div>

      <TextField>
        <TextFieldLabel>Output</TextFieldLabel>
        <TextFieldTextArea
          value={error() || output()}
          readOnly
          placeholder="SELECT * FROM T WHERE id=1 AND name='zhangshan'"
          class="font-mono h-48 resize-none"
          classList={{ 'text-red-500': !!error() }}
        />
      </TextField>

      <div class="c-note text-sm space-y-3">
        <div>
          <strong>How to use:</strong>
          <ul class="mt-1 list-disc list-inside space-y-0.5">
            <li>Paste MyBatis log directly in the top left textarea</li>
            <li>Or enter SQL template (with <code class="px-1 rounded bg-muted">?</code> placeholders) and parameters separately</li>
          </ul>
        </div>
        <div>
          <strong>Parameter format:</strong>
          <code class="text-xs px-1.5 py-0.5 rounded bg-muted">value(Type), value(Type), ...</code>
          <div class="mt-1">Supported types: <code class="text-xs px-1 rounded bg-muted">String</code>, <code class="text-xs px-1 rounded bg-muted">Integer</code>, <code class="text-xs px-1 rounded bg-muted">Long</code>, <code class="text-xs px-1 rounded bg-muted">Timestamp</code></div>
        </div>
      </div>
    </div>
  )
}
