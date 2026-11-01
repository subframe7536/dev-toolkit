import { Button, Icon } from 'moraine'
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js'

import { useRegexContext } from '#/contexts/regex-context'
import {
  generateDebugSteps,
  getActionBgColor,
  getActionColor,
  getActionIcon,
} from '#/utils/regex/debug-engine'
import type { DebugSession, DebugStep } from '#/utils/regex/types'

interface DebugControlsProps {
  session: DebugSession
  onStepForward: () => void
  onStepBackward: () => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onGoToStep: (index: number) => void
  speed: number
  onToggleSpeed: () => void
}

function DebugControls(props: DebugControlsProps) {
  const isAtStart = createMemo(() => props.session.currentStepIndex <= 0)
  const isAtEnd = createMemo(() => props.session.currentStepIndex >= props.session.steps.length - 1)
  const isComplete = createMemo(() => props.session.finalResult !== 'pending' && isAtEnd())

  return (
    <div
      class="p-2.5 border border-border rounded-lg bg-card/60 flex flex-wrap gap-3 items-center justify-between"
      role="toolbar"
      aria-label="Debug controls"
    >
      {/* Playback controls */}
      <div class="flex gap-1 items-center" role="group" aria-label="Playback controls">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={props.onReset}
          disabled={isAtStart()}
          title="Reset to start"
          aria-label="Reset to start"
          leading="i-lucide-skip-back"
        />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={props.onStepBackward}
          disabled={isAtStart()}
          title="Step backward"
          aria-label="Step backward"
          leading="i-lucide-step-back"
        />
        <Show
          when={props.session.isPlaying}
          fallback={
            <Button
              variant="outline"
              size="icon-sm"
              onClick={props.onPlay}
              disabled={isComplete()}
              title="Play automatic stepping"
              aria-label="Play automatic stepping"
              leading="i-lucide-play"
            />
          }
        >
          <Button
            variant="outline"
            size="icon-sm"
            onClick={props.onPause}
            title="Pause automatic stepping"
            aria-label="Pause automatic stepping"
            leading="i-lucide-pause"
          />
        </Show>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={props.onStepForward}
          disabled={isAtEnd()}
          title="Step forward"
          aria-label="Step forward"
          leading="i-lucide-step-forward"
        />
      </div>

      {/* Progress scrubber */}
      <div class="flex flex-1 gap-2 max-w-xs min-w-[120px] items-center">
        <input
          type="range"
          min={0}
          max={Math.max(props.session.steps.length - 1, 0)}
          value={props.session.currentStepIndex}
          onInput={(e) => props.onGoToStep(Number.parseInt(e.currentTarget.value, 10))}
          class="accent-primary rounded bg-muted h-1.5 w-full cursor-pointer"
          aria-label="Step scrubber"
        />
      </div>

      {/* Counter and speed toggle */}
      <div class="flex gap-2 items-center">
        <span class="text-xs text-foreground font-medium font-mono px-2 py-0.5 rounded bg-muted/80 shrink-0">
          Step {props.session.currentStepIndex + 1} / {props.session.steps.length}
        </span>
        <button
          type="button"
          class="text-xs text-muted-foreground font-mono px-2 py-0.5 border border-border/60 rounded cursor-pointer transition-colors hover:text-foreground hover:bg-muted/40"
          onClick={() => props.onToggleSpeed()}
          title="Click to toggle playback speed"
        >
          {props.speed}ms
        </button>
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

    const segments: Array<{ text: string; highlighted: boolean }> = []

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
    <div class="text-sm font-mono p-2.5 border border-border rounded-lg bg-card/60 whitespace-pre overflow-x-auto">
      <For each={segments()}>
        {(segment) => (
          <span
            class={
              segment.highlighted
                ? 'bg-primary/30 ring-1 ring-primary rounded-xs px-0.5 font-bold text-foreground'
                : 'text-foreground/90'
            }
          >
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
  type Segment = { text: string; type: SegmentType }

  const segments = createMemo((): Segment[] => {
    const text = props.text
    const pos = props.currentPosition
    const matchStart = props.matchStart
    const matchEnd = props.matchEnd

    if (!text) {
      return [{ text: '', type: 'normal' }]
    }

    const segments: Segment[] = []

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
        return 'bg-amber-300/60 dark:bg-amber-600/50 ring-1 ring-amber-500 rounded-xs px-0.5 font-bold'
      case 'matched':
        return 'bg-green-300/60 dark:bg-green-600/50 ring-1 ring-green-500 rounded-xs px-0.5 font-bold'
      default:
        return 'text-foreground/90'
    }
  }

  return (
    <div class="text-sm font-mono p-2.5 border border-border rounded-lg bg-card/60 max-h-36 whitespace-pre-wrap break-all overflow-y-auto">
      <For each={segments()}>
        {(segment) => <span class={getSegmentClass(segment.type)}>{segment.text}</span>}
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
      ref={(element) => (containerRef = element)}
      class="pr-1 flex-1 overflow-y-auto space-y-1"
      role="listbox"
      aria-label="Debug steps"
      aria-activedescendant={`step-${props.currentIndex}`}
    >
      <For each={props.steps}>
        {(step, index) => (
          <div
            id={`step-${index()}`}
            data-step-index={index()}
            class={`text-xs p-2 border rounded-md cursor-pointer transition-colors ${
              index() === props.currentIndex
                ? `${getActionBgColor(step.action)} border-primary/50 shadow-xs ring-1 ring-primary/40`
                : 'border-transparent hover:bg-muted/40'
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
            <div class="flex gap-1.5 items-center">
              <Icon
                name={getActionIcon(step.action)}
                class={`shrink-0 size-3.5 ${getActionColor(step.action)}`}
              />
              <span class={`font-semibold truncate capitalize ${getActionColor(step.action)}`}>
                {step.action}
              </span>
              <span class="text-[11px] text-muted-foreground font-mono ml-auto shrink-0">
                #{step.stepNumber}
              </span>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
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
  const [speed, setSpeed] = createSignal<number>(500)

  let playIntervalId: ReturnType<typeof setInterval> | null = null

  const canStartDebug = createMemo(() => Boolean(store.pattern && store.testText && store.isValid))

  createEffect(
    on(
      () => [store.pattern, store.testText, store.flags, store.isValid] as const,
      ([pattern, testText, flags, isValid]) => {
        if (playIntervalId) {
          clearInterval(playIntervalId)
          playIntervalId = null
        }
        if (pattern && testText && isValid) {
          const session = generateDebugSteps(pattern, flags, testText)
          setDebugSession(session)
        } else {
          setDebugSession(null)
        }
      },
    ),
  )

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
    }, speed())
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

  const toggleSpeed = () => {
    const speeds = [250, 500, 1000]
    const nextIndex = (speeds.indexOf(speed()) + 1) % speeds.length
    const nextSpeed = speeds[nextIndex]
    setSpeed(nextSpeed)
    if (debugSession()?.isPlaying) {
      pause()
      play()
    }
  }

  const currentStep = createMemo(() => {
    const session = debugSession()
    if (!session || session.currentStepIndex < 0) {
      return null
    }
    return session.steps[session.currentStepIndex]
  })

  return (
    <div class="space-y-4" role="region" aria-label="Regex Match Debugger">
      <Show
        when={canStartDebug() && debugSession()}
        fallback={
          <div class="p-8 text-center border border-border rounded-lg border-dashed bg-muted/20">
            <Icon name="i-lucide-bug" class="text-muted-foreground mx-auto mb-2 size-8" />
            <p class="text-sm text-foreground font-medium">
              {canStartDebug()
                ? 'Initializing debugger...'
                : 'Enter a valid pattern and test string to enable debugging.'}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Step-by-step engine execution breakdown requires both a regular expression and test
              string.
            </p>
          </div>
        }
      >
        {(session) => (
          <div class="space-y-4">
            {/* Top Control Bar */}
            <DebugControls
              session={session()}
              onStepForward={stepForward}
              onStepBackward={stepBackward}
              onPlay={play}
              onPause={pause}
              onReset={reset}
              onGoToStep={goToStep}
              speed={speed()}
              onToggleSpeed={toggleSpeed}
            />

            {/* Main 2-column debug workspace */}
            <div class="gap-4 grid grid-cols-1 items-start md:grid-cols-12">
              {/* Left Column: Visualizer & Step details (7 cols) */}
              <div class="space-y-3 md:col-span-7">
                {/* Current step info */}
                <Show when={currentStep()}>
                  {(step) => (
                    <div
                      class={`p-3.5 border border-border/80 rounded-lg ${getActionBgColor(step().action)}`}
                      role="status"
                      aria-live="polite"
                    >
                      <div class="mb-1.5 flex gap-2 items-center">
                        <Icon
                          name={getActionIcon(step().action)}
                          class={getActionColor(step().action)}
                        />
                        <span
                          class={`text-sm font-semibold capitalize ${getActionColor(step().action)}`}
                        >
                          {step().action}
                        </span>
                        <span class="text-xs text-muted-foreground font-mono ml-auto">
                          Step #{step().stepNumber}
                        </span>
                      </div>
                      <p class="text-xs text-foreground/90 leading-relaxed">{step().description}</p>
                      <Show when={step().matchedText}>
                        <div class="text-xs font-mono mt-1.5 p-1 border border-border/40 rounded bg-background/60 inline-block">
                          Matched: <span class="font-semibold">"{step().matchedText}"</span>
                        </div>
                      </Show>
                    </div>
                  )}
                </Show>

                {/* Pattern visualization */}
                <div class="space-y-1">
                  <div class="text-xs text-muted-foreground font-medium" id="pattern-viz-label">
                    Pattern Element
                  </div>
                  <PatternVisualizer
                    pattern={store.pattern || ' '}
                    currentPosition={currentStep()?.patternPosition ?? 0}
                    highlightLength={currentStep()?.patternElement.length ?? 1}
                  />
                </div>

                {/* Text visualization */}
                <div class="space-y-1">
                  <div class="text-xs text-muted-foreground font-medium" id="text-viz-label">
                    Test String Match Position
                  </div>
                  <TextVisualizer
                    text={store.testText}
                    currentPosition={currentStep()?.textPosition ?? 0}
                    matchStart={
                      session().finalResult === 'success' && currentStep()?.action === 'success'
                        ? session().matchStart
                        : undefined
                    }
                    matchEnd={
                      session().finalResult === 'success' && currentStep()?.action === 'success'
                        ? session().matchEnd
                        : undefined
                    }
                  />
                </div>

                {/* Final result indicator */}
                <Show when={session().currentStepIndex === session().steps.length - 1}>
                  <div
                    class={`p-3 text-center border rounded-lg ${
                      session().finalResult === 'success'
                        ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800'
                        : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                    }`}
                    role="status"
                    aria-live="assertive"
                  >
                    <Icon
                      name={
                        session().finalResult === 'success'
                          ? 'i-lucide-circle-check'
                          : 'i-lucide-circle-x'
                      }
                      class="mx-auto mb-1 size-6"
                    />
                    <p class="text-sm font-semibold">
                      {session().finalResult === 'success' ? 'Match Found!' : 'No Match Found'}
                    </p>
                  </div>
                </Show>
              </div>

              {/* Right Column: Step history list (5 cols) */}
              <div class="flex flex-col gap-1.5 md:col-span-5">
                <div class="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  <span>Step History</span>
                  <span class="font-mono">{session().steps.length} steps</span>
                </div>
                <div class="p-2 border border-border rounded-lg bg-card/60 flex flex-col h-[340px] overflow-hidden">
                  <StepList
                    steps={session().steps}
                    currentIndex={session().currentStepIndex}
                    onStepClick={goToStep}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
