import { Card } from '#/components/card'
import { CopyButton } from '#/components/copy-button'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { TextField, TextFieldInput, TextFieldLabel } from '#/components/ui/text-field'
import {
  commonTimeZones,
  formatDateTime,
  formatWithPattern,
  manipulateDateTimeString,
  parseDate,
  toISOString,
  toUnixTimestamp,
  toUnixTimestampMs,
} from '#/utils/datetime'
import { createRoute } from 'solid-file-router'
import { batch, createEffect, createMemo, createSignal, Index, onCleanup, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'DateTime Tool',
    description: 'Real-time clock, formatter, and datetime manipulation',
    category: 'Utilities',
    icon: 'lucide:clock',
    tags: ['datetime', 'time', 'date', 'format', 'timezone', 'manipulation'],
  },
  component: DateTimeTool,
})

function DateTimeTool() {
  const [currentTime, setCurrentTime] = createSignal(new Date())
  const [selectedLocale, setSelectedLocale] = createSignal('en-US')
  const [selectedTimeZone, setSelectedTimeZone] = createSignal('UTC')
  const [dateStyle, setDateStyle] = createSignal<'full' | 'long' | 'medium' | 'short'>('medium')
  const [timeStyle, setTimeStyle] = createSignal<'full' | 'long' | 'medium' | 'short'>('medium')
  const [manipulationInput, setManipulationInput] = createSignal('')
  const [customInput, setCustomInput] = createSignal('')
  const [customDate, setCustomDate] = createSignal<Date | null>(null)
  const [customFormat, setCustomFormat] = createSignal('')

  // Update current time every 50ms
  onMount(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 50)

    onCleanup(() => clearInterval(interval))
  })

  const formattedTime = createMemo(() => {
    const date = customDate() || currentTime()
    return formatDateTime(date, {
      locale: selectedLocale(),
      dateStyle: dateStyle(),
      timeStyle: timeStyle(),
      timeZone: selectedTimeZone(),
    })
  })

  const manipulatedTime = createMemo(() => {
    const input = manipulationInput().trim()
    if (!input) {
      return null
    }

    try {
      const date = customDate() || currentTime()
      const result = manipulateDateTimeString(date, input)
      return formatDateTime(result, {
        locale: selectedLocale(),
        dateStyle: dateStyle(),
        timeStyle: timeStyle(),
        timeZone: selectedTimeZone(),
      })
    } catch {
      return 'Invalid manipulation format'
    }
  })

  const handleParseCustomDate = () => {
    const input = customInput().trim()
    if (!input && !customDate()) {
      toast.error('Please enter a date')
      return
    }

    if (customDate()) {
      // Reset mode
      setCustomDate(null)
      setCustomInput('')
      toast.success('Reset to current time')
      return
    }

    const parsed = parseDate(input)
    if (parsed) {
      setCustomDate(parsed)
      toast.success('Date parsed successfully')
    } else {
      toast.error('Invalid date format')
    }
  }

  const locales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP', 'zh-CN', 'ar-SA']
  const styles = ['full', 'long', 'medium', 'short'] as const

  const [outputFormats, setOutputFormats] = createStore([
    { label: 'ISO 8601', value: '' },
    { label: 'Unix Timestamp (seconds)', value: '' },
    { label: 'Unix Timestamp (ms)', value: '' },
    { label: 'yyyy-MM-dd HH:mm:ss', value: '' },
    { label: 'UTC String', value: '' },
    { label: 'Local String', value: '' },
  ])

  // Update output formats reactively
  createEffect(() => {
    let date = customDate() || currentTime()
    const input = manipulationInput().trim()
    if (input) {
      date = manipulateDateTimeString(date, input)
    }
    batch(() => {
      setOutputFormats(0, 'value', toISOString(date))
      setOutputFormats(1, 'value', String(toUnixTimestamp(date)))
      setOutputFormats(2, 'value', String(toUnixTimestampMs(date)))
      setOutputFormats(3, 'value', formatWithPattern(date, 'yyyy-MM-dd HH:mm:ss'))
      setOutputFormats(4, 'value', date.toUTCString())
      setOutputFormats(5, 'value', date.toLocaleString())
    })
  })

  onMount(() => {
    setSelectedLocale(navigator.language)
    setSelectedTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  })

  return (
    <div class="space-y-6">
      {/* Two Column Layout for Wide Screens */}
      <div class="gap-6 grid lg:grid-cols-2">
        {/* Left Column */}
        <div class="space-y-6">
          {/* Real-time Clock + Custom Date Input + Format Options */}
          <Card
            title="DateTime Formatter"
            content={(
              <div class="space-y-4">
                {/* Real-time Display */}
                <div class="p-4 text-center border rounded-lg bg-muted/50">
                  <div class="text-3xl font-bold font-mono mb-2">
                    {formattedTime()}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {selectedTimeZone()}
                    {' '}
                    •
                    {' '}
                    {selectedLocale()}
                  </div>
                </div>

                {/* Custom Date Input */}
                <div class="space-y-2">
                  <label class="text-sm font-medium">Custom Date Input</label>
                  <div class="flex gap-2 items-start">
                    <TextField class="flex-1">
                      <TextFieldInput
                        value={customInput()}
                        onInput={e => setCustomInput(e.currentTarget.value)}
                        placeholder="ISO, Unix timestamp, yyyy-MM-dd HH:mm:ss..."
                      />
                    </TextField>
                    <Button onClick={handleParseCustomDate} class="shrink-0">
                      {customDate() ? 'Reset' : 'Parse'}
                    </Button>
                  </div>
                  {customDate() && (
                    <div class="text-sm text-muted-foreground">
                      Using:
                      {' '}
                      {toISOString(customDate()!)}
                    </div>
                  )}
                </div>

                {/* Format Options */}
                <div class="space-y-3">
                  <label class="text-sm font-medium">Format Options</label>
                  <div class="gap-3 grid grid-cols-2">
                    <div>
                      <label class="text-xs text-muted-foreground mb-1.5 block">Locale</label>
                      <Select<string>
                        value={selectedLocale()}
                        onChange={setSelectedLocale}
                        options={locales}
                        placeholder="Select locale..."
                        itemComponent={props => (
                          <SelectItem item={props.item}>
                            {props.item.rawValue}
                          </SelectItem>
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue<string>>
                            {state => state.selectedOption()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground mb-1.5 block">Time Zone</label>
                      <Select<string>
                        value={selectedTimeZone()}
                        onChange={setSelectedTimeZone}
                        options={commonTimeZones}
                        placeholder="Select timezone..."
                        itemComponent={props => (
                          <SelectItem item={props.item}>
                            {props.item.rawValue}
                          </SelectItem>
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue<string>>
                            {state => state.selectedOption()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground mb-1.5 block">Date Style</label>
                      <Select<string>
                        value={dateStyle()}
                        onChange={setDateStyle}
                        options={[...styles]}
                        placeholder="Select date style..."
                        itemComponent={props => (
                          <SelectItem item={props.item}>
                            {props.item.rawValue}
                          </SelectItem>
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue<'full' | 'long' | 'medium' | 'short'>>
                            {state => state.selectedOption()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground mb-1.5 block">Time Style</label>
                      <Select<string>
                        value={timeStyle()}
                        onChange={setTimeStyle}
                        options={[...styles]}
                        placeholder="Select time style..."
                        itemComponent={props => (
                          <SelectItem item={props.item}>
                            {props.item.rawValue}
                          </SelectItem>
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue<'full' | 'long' | 'medium' | 'short'>>
                            {state => state.selectedOption()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />

          {/* DateTime Manipulation */}
          <Card
            title="DateTime Manipulation"
            icon="lucide:calculator"
            content={(
              <div class="space-y-2">
                <TextField>
                  <TextFieldInput
                    value={manipulationInput()}
                    onInput={e => setManipulationInput(e.currentTarget.value)}
                    placeholder="e.g., +1h -30m +2d"
                  />
                </TextField>
                <div class="text-xs text-muted-foreground">
                  Units: y=years, M=months, d=days, h=hours, m=minutes, s=seconds
                </div>
                <Show when={manipulatedTime()}>
                  <div class="p-3 border rounded-lg bg-muted/50">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <div class="text-xs text-muted-foreground mb-1">Result:</div>
                        <div class="text-sm font-mono font-semibold truncate">{manipulatedTime()}</div>
                      </div>
                      <CopyButton
                        content={manipulatedTime()!}
                        size="sm"
                        variant="ghost"
                        text={false}
                      />
                    </div>
                  </div>
                </Show>
              </div>
            )}
          />
        </div>

        {/* Right Column */}
        <div class="space-y-6">
          {/* Custom Format + Output Formats */}
          <Card
            title="Format Outputs"
            icon="lucide:list"
            content={(
              <div class="space-y-4">
                {/* Custom Format */}
                <div class="space-y-2">
                  <TextField>
                    <TextFieldLabel>Custom Format Pattern</TextFieldLabel>
                    <TextFieldInput
                      value={customFormat()}
                      onInput={e => setCustomFormat(e.currentTarget.value)}
                      placeholder="e.g., yyyy/MM/dd or dd-MM-yyyy HH:mm"
                    />
                  </TextField>
                  <div class="text-xs text-muted-foreground space-y-1">
                    <div>Tokens: yyyy (year), MM (month), dd (day)</div>
                    <div>HH/hh (hours), mm (minutes), ss (seconds), SSS (ms)</div>
                  </div>
                  <Show when={customFormat().trim()}>
                    <div class="p-3 border rounded-lg bg-muted/50">
                      <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                          <div class="text-xs text-muted-foreground mb-1">Preview:</div>
                          <div class="text-sm font-mono font-semibold truncate">
                            {formatWithPattern(customDate() || currentTime(), customFormat())}
                          </div>
                        </div>
                        <CopyButton
                          content={formatWithPattern(customDate() || currentTime(), customFormat())}
                          size="sm"
                          variant="ghost"
                          text={false}
                        />
                      </div>
                    </div>
                  </Show>
                </div>

                {/* Common Formats */}
                <div class="space-y-2">
                  <div class="text-sm font-medium">Common Formats</div>
                  <div class="space-y-2">
                    <Index each={outputFormats}>
                      {format => (
                        <div class="p-3 border rounded-lg bg-muted/30 flex gap-2 items-center justify-between">
                          <div class="flex-1 min-w-0">
                            <div class="text-xs text-muted-foreground">{format().label}</div>
                            <div class="text-sm font-mono truncate">{format().value}</div>
                          </div>
                          <CopyButton
                            content={format().value}
                            size="sm"
                            variant="ghost"
                            text={false}
                          />
                        </div>
                      )}
                    </Index>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  )
}
