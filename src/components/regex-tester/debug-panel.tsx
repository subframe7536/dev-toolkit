import type { DebugSession, DebugStep } from '#/utils/regex/types'

import { Button } from '#/components/ui/button'
import { useRegexContext } from '#/contexts/regex-context'
import { generateDebugSteps, getActionBgColor, getActionColor, getActionIcon } from '#/utils/regex/debug-engine'
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js'

// Highlight colors for pattern and text positions
const PATTERN_HIGHLIGHT = 'bg-primary/30 ring-2 ring-primary'
const TEXT_HIGHLIGHT = 'bg-amber-300/60 dark:bg-amber-600/40'
const TEXT_MATCHED = 'bg-green-300/60 dark:bg-green-600/40'

interface DebugControlsProps {
  session: DebugSession
  onStepForward: () => void
  onStepBackward: () => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

function DebugControls(props: DebugControlsProps) {
  const isAtStart = createMemo(() => props.session.currentStepIndex <= 0)
  const isAtEnd = createMemo(() => props.session.currentStepIndex >= props.session.steps.length - 1)
  const isComplete = createMemo(() => props.session.finalResult !== 'pending' && isAtEnd())

  return (
    <div class="flex flex-wrap gap-2 items-center" role="toolbar" aria-label="Debug controls">
      {/* Playback controls */}
      <div class="flex gap-1" role="group" aria-label="Playback">
        <Button
          variant="outline"
          size="sm"
          onClick={props.onReset}
          disabled={isAtStart()}
          title="Reset to start"
          aria-label="Reset to start"
        >
          <span class="i-lucide-skip-back size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={props.onStepBackward}
          disabled={isAtStart()}
          title="Step backward"
          aria-label="Step backward"
        >
          <span class="i-lucide-step-back size-4" aria-hidden="true" />
        </Button>
        <Show
          when={props.session.isPlaying}
          fallback={(
            <Button
              variant="outline"
              size="sm"
              onClick={props.onPlay}
              disabled={isComplete()}
              title="Play"
              aria-label="Play automatic stepping"
            >
              <span class="i-lucide-play size-4" aria-hidden="true" />
            </Button>
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={props.onPause}
            title="Pause"
            aria-label="Pause automatic stepping"
          >
            <span class="i-lucide-pause size-4" aria-hidden="true" />
          </Button>
        </Show>
        <Button
          variant="outline"
          size="sm"
          onClick={props.onStepForward}
          disabled={isAtEnd()}
          title="Step forward"
          aria-label="Step forward"
        >
          <span class="i-lucide-step-forward size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Speed control */}
      <div class="ml-2 flex gap-2 items-center">
        <label for="debug-speed" class="text-xs text-muted-foreground">Speed:</label>
        <select
          id="debug-speed"
          class="text-xs px-2 py-1 border rounded bg-background focus:(outline-none ring-2 ring-ring)"
          value={props.session.playSpeed}
          onChange={e => props.onSpeedChange(Number(e.currentTarget.value))}
          aria-label="Playback speed"
        >
          <option value={1000}>0.5x</option>
          <option value={500}>1x</option>
          <option value={250}>2x</option>
          <option value={100}>5x</option>
        </select>
      </div>

      {/* Progress indicator */}
      <div class="text-xs text-muted-foreground ml-auto" aria-live="polite">
        Step {props.session.currentStepIndex + 1} / {props.session.steps.length}
      </div>
    </div>
  )
}

interface PatternVisualizerProps {
  pattern: string
  currentPosition: number
  highlightLength: number
}

function PatternVisualizer(props: PatternVisualizerProps) {
  const segments = createMemo(() => {
    const pattern = props.pattern
    const pos = props.currentPosition
    const len = props.highlightLength

    if (!pattern || pos < 0 || pos >= pattern.length) {
      return [{ text: pattern, highlighted: false }]
    }

    const segments: Array<{ text: string, highlighted: boolean }> = []

    if (pos > 0) {
      segments.push({ text: pattern.slice(0, pos), highlighted: false })
    }

    const endPos = Math.min(pos + Math.max(len, 1), pattern.length)
    segments.push({ text: pattern.slice(pos, endPos), highlighted: true })

    if (endPos < pattern.length) {
      segments.push({ text: pattern.slice(endPos), highlighted: false })
    }

    return segments
  })

  return (
    <div class="text-sm font-mono p-2 border rounded bg-muted/30 overflow-x-auto">
      <For each={segments()}>
        {segment => (
          <span class={segment.highlighted ? PATTERN_HIGHLIGHT : ''}>
            {segment.text}
          </span>
        )}
      </For>
    </div>
  )
}

interface TextVisualizerProps {
  text: string
  currentPosition: number
  matchStart?: number
  matchEnd?: number
}

function TextVisualizer(props: TextVisualizerProps) {
  type SegmentType = 'normal' | 'current' | 'matched'
  type Segment = { text: string, type: SegmentType }

  const segments = createMemo((): Segment[] => {
    const text = props.text
    const pos = props.currentPosition
    const matchStart = props.matchStart
    const matchEnd = props.matchEnd

    if (!text) {
      return [{ text: '', type: 'normal' }]
    }

    const segments: Segment[] = []

    // If we have a complete match, show it
    if (matchStart !== undefined && matchEnd !== undefined && matchEnd > matchStart) {
      if (matchStart > 0) {
        segments.push({ text: text.slice(0, matchStart), type: 'normal' })
      }
      segments.push({ text: text.slice(matchStart, matchEnd), type: 'matched' })
      if (matchEnd < text.length) {
        segments.push({ text: text.slice(matchEnd), type: 'normal' })
      }
      return segments
    }

    // Otherwise show current position
    if (pos < 0 || pos >= text.length) {
      return [{ text, type: 'normal' }]
    }

    if (pos > 0) {
      segments.push({ text: text.slice(0, pos), type: 'normal' })
    }
    segments.push({ text: text[pos], type: 'current' })
    if (pos + 1 < text.length) {
      segments.push({ text: text.slice(pos + 1), type: 'normal' })
    }

    return segments
  })

  const getSegmentClass = (type: SegmentType) => {
    switch (type) {
      case 'current':
        return TEXT_HIGHLIGHT
      case 'matched':
        return TEXT_MATCHED
      default:
        return ''
    }
  }

  return (
    <div class="text-sm font-mono p-2 border rounded bg-muted/30 whitespace-pre-wrap break-all overflow-x-auto">
      <For each={segments()}>
        {segment => (
          <span class={getSegmentClass(segment.type)}>
            {segment.text}
          </span>
        )}
      </For>
      <Show when={!props.text}>
        <span class="text-muted-foreground italic">No test text</span>
      </Show>
    </div>
  )
}

interface StepListProps {
  steps: DebugStep[]
  currentIndex: number
  onStepClick: (index: number) => void
}

function StepList(props: StepListProps) {
  let containerRef: HTMLDivElement | undefined

  // Auto-scroll to current step
  createEffect(() => {
    const index = props.currentIndex
    if (containerRef && index >= 0) {
      const stepElement = containerRef.querySelector(`[data-step-index="${index}"]`)
      if (stepElement) {
        stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  })

  return (
    <div
      ref={containerRef}
      class="max-h-48 overflow-y-auto space-y-1"
      role="listbox"
      aria-label="Debug steps"
      aria-activedescendant={`step-${props.currentIndex}`}
    >
      <For each={props.steps}>
        {(step, index) => (
          <div
            id={`step-${index()}`}
            data-step-index={index()}
            class={`text-sm p-2 rounded cursor-pointer transition-colors ${
              index() === props.currentIndex
                ? `${getActionBgColor(step.action)} ring-2 ring-primary/50`
                : 'hover:bg-muted/50'
            }`}
            onClick={() => props.onStepClick(index())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                props.onStepClick(index())
              }
            }}
            role="option"
            aria-selected={index() === props.currentIndex}
            tabIndex={index() === props.currentIndex ? 0 : -1}
          >
            <div class="flex gap-2 items-center">
              <span class={`${getActionIcon(step.action)} size-4 ${getActionColor(step.action)}`} aria-hidden="true" />
              <span class={`font-medium ${getActionColor(step.action)}`}>
                {step.action.charAt(0).toUpperCase() + step.action.slice(1)}
              </span>
              <span class="text-xs text-muted-foreground ml-auto">
                #{step.stepNumber}
              </span>
            </div>
            <p class="text-xs text-muted-foreground ml-6 mt-1">
              {step.description}
            </p>
          </div>
        )}
      </For>
    </div>
  )
}

export function DebugPanel() {
  const { store } = useRegexContext()

  const [debugSession, setDebugSession] = createSignal<DebugSession | null>(null)
  const [isDebugMode, setIsDebugMode] = createSignal(false)

  let playIntervalId: ReturnType<typeof setInterval> | null = null

  // Generate debug steps when entering debug mode
  const startDebug = () => {
    if (!store.pattern || !store.testText) {
      return
    }

    const session = generateDebugSteps(store.pattern, store.flags, store.testText)
    setDebugSession(session)
    setIsDebugMode(true)
  }

  const stopDebug = () => {
    if (playIntervalId) {
      clearInterval(playIntervalId)
      playIntervalId = null
    }
    setDebugSession(null)
    setIsDebugMode(false)
  }

  // Regenerate steps when pattern or text changes during debug mode
  createEffect(on(
    () => [store.pattern, store.testText, store.flags] as const,
    () => {
      if (isDebugMode() && store.pattern && store.testText) {
        const session = generateDebugSteps(store.pattern, store.flags, store.testText)
        setDebugSession(session)
      }
    },
    { defer: true },
  ))

  // Cleanup on unmount
  onCleanup(() => {
    if (playIntervalId) {
      clearInterval(playIntervalId)
    }
  })

  const stepForward = () => {
    const session = debugSession()
    if (!session || session.currentStepIndex >= session.steps.length - 1) {
      return
    }
    setDebugSession({
      ...session,
      currentStepIndex: session.currentStepIndex + 1,
    })
  }

  const stepBackward = () => {
    const session = debugSession()
    if (!session || session.currentStepIndex <= 0) {
      return
    }
    setDebugSession({
      ...session,
      currentStepIndex: session.currentStepIndex - 1,
    })
  }

  const reset = () => {
    const session = debugSession()
    if (!session) {
      return
    }
    if (playIntervalId) {
      clearInterval(playIntervalId)
      playIntervalId = null
    }
    setDebugSession({
      ...session,
      currentStepIndex: 0,
      isPlaying: false,
    })
  }

  const play = () => {
    const session = debugSession()
    if (!session || session.currentStepIndex >= session.steps.length - 1) {
      return
    }

    setDebugSession({ ...session, isPlaying: true })

    playIntervalId = setInterval(() => {
      const currentSession = debugSession()
      if (!currentSession) {
        if (playIntervalId) {
          clearInterval(playIntervalId)
          playIntervalId = null
        }
        return
      }

      if (currentSession.currentStepIndex >= currentSession.steps.length - 1) {
        if (playIntervalId) {
          clearInterval(playIntervalId)
          playIntervalId = null
        }
        setDebugSession({ ...currentSession, isPlaying: false })
        return
      }

      setDebugSession({
        ...currentSession,
        currentStepIndex: currentSession.currentStepIndex + 1,
      })
    }, session.playSpeed)
  }

  const pause = () => {
    if (playIntervalId) {
      clearInterval(playIntervalId)
      playIntervalId = null
    }
    const session = debugSession()
    if (session) {
      setDebugSession({ ...session, isPlaying: false })
    }
  }

  const setSpeed = (speed: number) => {
    const session = debugSession()
    if (!session) {
      return
    }

    const wasPlaying = session.isPlaying
    if (wasPlaying) {
      pause()
    }

    setDebugSession({ ...session, playSpeed: speed })

    if (wasPlaying) {
      play()
    }
  }

  const goToStep = (index: number) => {
    const session = debugSession()
    if (!session || index < 0 || index >= session.steps.length) {
      return
    }
    setDebugSession({
      ...session,
      currentStepIndex: index,
    })
  }

  const currentStep = createMemo(() => {
    const session = debugSession()
    if (!session || session.currentStepIndex < 0) {
      return null
    }
    return session.steps[session.currentStepIndex]
  })

  const canStartDebug = createMemo(() => store.pattern && store.testText && store.isValid)

  return (
    <div class="p-4 border rounded-lg bg-card" role="region" aria-labelledby="debug-heading">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="i-lucide-bug size-5" aria-hidden="true" />
          <h3 id="debug-heading" class="font-medium">Step-by-Step Debug</h3>
        </div>
        <Show
          when={isDebugMode()}
          fallback={(
            <Button
              variant="outline"
              size="sm"
              onClick={startDebug}
              disabled={!canStartDebug()}
              aria-describedby={!canStartDebug() ? 'debug-disabled-hint' : undefined}
            >
              Start Debug
            </Button>
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={stopDebug}
          >
            Exit Debug
          </Button>
        </Show>
      </div>

      <Show
        when={isDebugMode() && debugSession()}
        fallback={(
          <p class="text-sm text-muted-foreground" id="debug-disabled-hint">
            <Show
              when={canStartDebug()}
              fallback="Enter a valid pattern and test text to enable debug mode."
            >
              Click "Start Debug" to step through the regex matching process.
            </Show>
          </p>
        )}
      >
        {session => (
          <div class="space-y-4">
            {/* Controls */}
            <DebugControls
              session={session()}
              onStepForward={stepForward}
              onStepBackward={stepBackward}
              onPlay={play}
              onPause={pause}
              onReset={reset}
              onSpeedChange={setSpeed}
            />

            {/* Current step info */}
            <Show when={currentStep()}>
              {step => (
                <div class={`p-3 rounded-md ${getActionBgColor(step().action)}`} role="status" aria-live="polite">
                  <div class="mb-2 flex gap-2 items-center">
                    <span class={`${getActionIcon(step().action)} size-5 ${getActionColor(step().action)}`} aria-hidden="true" />
                    <span class={`font-medium ${getActionColor(step().action)}`}>
                      {step().action.charAt(0).toUpperCase() + step().action.slice(1)}
                    </span>
                  </div>
                  <p class="text-sm">{step().description}</p>
                  <Show when={step().matchedText}>
                    <p class="text-xs text-muted-foreground mt-1">
                      Matched: "{step().matchedText}"
                    </p>
                  </Show>
                </div>
              )}
            </Show>

            {/* Pattern visualization */}
            <div>
              <div class="text-xs text-muted-foreground mb-1" id="pattern-viz-label">Pattern</div>
              <PatternVisualizer
                pattern={store.pattern}
                currentPosition={currentStep()?.patternPosition ?? 0}
                highlightLength={currentStep()?.patternElement.length ?? 1}
              />
            </div>

            {/* Text visualization */}
            <div>
              <div class="text-xs text-muted-foreground mb-1" id="text-viz-label">Test Text</div>
              <TextVisualizer
                text={store.testText}
                currentPosition={currentStep()?.textPosition ?? 0}
                matchStart={session().finalResult === 'success' && currentStep()?.action === 'success' ? session().matchStart : undefined}
                matchEnd={session().finalResult === 'success' && currentStep()?.action === 'success' ? session().matchEnd : undefined}
              />
            </div>

            {/* Step history */}
            <div>
              <div class="text-xs text-muted-foreground mb-1">Step History</div>
              <StepList
                steps={session().steps}
                currentIndex={session().currentStepIndex}
                onStepClick={goToStep}
              />
            </div>

            {/* Final result indicator */}
            <Show when={session().currentStepIndex === session().steps.length - 1}>
              <div
                class={`p-3 text-center rounded-md ${
                  session().finalResult === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
                role="status"
                aria-live="assertive"
              >
                <span class={`${session().finalResult === 'success' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'} mx-auto mb-2 size-6`} aria-hidden="true" />
                <p class="font-medium">
                  {session().finalResult === 'success' ? 'Match Found!' : 'No Match'}
                </p>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </div>
  )
}
