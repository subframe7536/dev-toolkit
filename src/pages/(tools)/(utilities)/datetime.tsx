import { Field, Button, Input, Select } from 'moraine'
import { createRoute } from 'solid-file-router'
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  Index,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { toast } from 'solid-toaster'

import { Card } from '#/components/card'
import { CopyButton } from '#/components/copy-button'
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

export default createRoute({
  info: {
    title: 'DateTime Tool',
    description: 'Real-time clock, formatter, and datetime manipulation',
    category: 'Utilities',
    icon: 'i-lucide-clock',
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
    <div class="space-y-4">
      {/* Two Column Layout for Wide Screens */}
      <div class="tool-grid lg:grid-cols-2">
        {/* Left Column */}
        <div class="space-y-4">
          {/* Real-time Clock + Custom Date Input + Format Options */}
          <div class="space-y-4">
            {/* Real-time Display */}
            <div class="p-4 text-center border bg-muted/50 rounded-lg">
              <div class="leading-relaxed font-medium font-mono mb-2 break-words tabular-nums text-xl">
                {formattedTime()}
              </div>
              <div class="text-muted-foreground text-sm">
                {selectedTimeZone()} • {selectedLocale()}
              </div>
            </div>

            {/* Custom Date Input */}
            <div class="space-y-2">
              <div class="flex gap-2 items-end">
                <Field
                  label="Custom Date Input"
                  classes={{
                    root: 'min-w-0 flex-1',
                    label: 'text-muted-foreground font-medium text-xs',
                  }}
                >
                  <Input
                    value={customInput()}
                    onValueChange={setCustomInput}
                    placeholder="ISO, Unix timestamp, yyyy-MM-dd HH:mm:ss..."
                  />
                </Field>
                <Button onClick={handleParseCustomDate} classes={{ root: 'shrink-0' }}>
                  {customDate() ? 'Reset' : 'Parse'}
                </Button>
              </div>
              <Show when={customDate()}>
                <div class="text-muted-foreground text-sm">Using: {toISOString(customDate()!)}</div>
              </Show>
            </div>

            {/* Format Options */}
            <div class="space-y-2">
              <div class="text-muted-foreground font-medium text-xs">Format Options</div>
              <div class="gap-4 grid grid-cols-2">
                <Field
                  label="Locale"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Select
                    value={selectedLocale()}
                    onValueChange={(value) => {
                      if (value !== null) {
                        setSelectedLocale(value)
                      }
                    }}
                    items={locales.map((v) => ({ value: v, label: v }))}
                  />
                </Field>
                <Field
                  label="Time Zone"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Select
                    value={selectedTimeZone()}
                    onValueChange={(value) => {
                      if (value !== null) {
                        setSelectedTimeZone(value)
                      }
                    }}
                    items={commonTimeZones.map((v) => ({ value: v, label: v }))}
                  />
                </Field>
                <Field
                  label="Date Style"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Select
                    value={dateStyle()}
                    onValueChange={(v) => v && setDateStyle(v as any)}
                    items={[...styles].map((v) => ({ value: v, label: v }))}
                  />
                </Field>
                <Field
                  label="Time Style"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Select
                    value={timeStyle()}
                    onValueChange={(v) => v && setTimeStyle(v as any)}
                    items={[...styles].map((v) => ({ value: v, label: v }))}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* DateTime Manipulation */}
          <Card
            variant="section"
            title="DateTime Manipulation"
            description="Units: y=years, M=months, d=days, h=hours, m=minutes, s=seconds"
            icon="i-lucide-calculator"
            content={
              <div class="space-y-2">
                <Field
                  label="DateTime Manipulation"
                  classes={{ root: 'min-w-0', label: 'sr-only', container: 'mt-0!' }}
                >
                  <Input
                    value={manipulationInput()}
                    onValueChange={setManipulationInput}
                    placeholder="e.g., +1h -30m +2d"
                  />
                </Field>
                <Show when={manipulatedTime()}>
                  <div class="p-3 border bg-muted/50 rounded-lg">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <div class="text-muted-foreground mb-1 text-xs">Result:</div>
                        <div class="font-mono font-semibold truncate text-sm">
                          {manipulatedTime()}
                        </div>
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
            }
          />
        </div>

        {/* Right Column */}
        {/* Custom Format + Output Formats */}
        <Card
          variant="section"
          title="Format Outputs"
          icon="i-lucide-list"
          content={
            <div class="space-y-4">
              {/* Custom Format */}
              <Field
                label="Custom Format Pattern"
                classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
              >
                <Input
                  value={customFormat()}
                  onValueChange={setCustomFormat}
                  placeholder="e.g., yyyy/MM/dd or dd-MM-yyyy HH:mm"
                />
                <div class="text-muted-foreground space-y-1 text-xs">
                  <div>Tokens: yyyy (year), MM (month), dd (day)</div>
                  <div>HH/hh (hours), mm (minutes), ss (seconds), SSS (ms)</div>
                </div>
                <Show when={customFormat().trim()}>
                  <div class="p-3 border bg-muted/50 rounded-lg">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <div class="text-muted-foreground mb-1 text-xs">Preview:</div>
                        <div class="font-mono font-semibold truncate text-sm">
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
              </Field>

              {/* Common Formats */}
              <div class="space-y-2">
                <div class="font-medium text-sm">Common Formats</div>
                <div class="space-y-2">
                  <Index each={outputFormats}>
                    {(format) => (
                      <div class="p-3 border bg-muted/30 flex gap-2 items-center justify-between rounded-lg">
                        <div class="flex-1 min-w-0">
                          <div class="text-muted-foreground text-xs">{format().label}</div>
                          <div class="font-mono break-all text-sm">{format().value}</div>
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
          }
        />
      </div>
    </div>
  )
}
