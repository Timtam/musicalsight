import Linkify from "linkify-react"
import { memo, useEffect, useRef } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import type { Step } from "../../games/engine/types"
import type { GameApi } from "../../games/engine/useGame"

function optionInputId(stepId: string, optionId: string): string {
    return `game-answer-${stepId}-${optionId}`
}

interface AnswerFieldsetProps {
    step: Step
    selected: string | undefined
    locked: boolean
    onPick(stepId: string, optionId: string): void
}

/**
 * Memoised so the 200 ms ticker does not reconcile up to forty inputs five
 * times a second.
 */
const AnswerFieldset = memo(function AnswerFieldset({
    step,
    selected,
    locked,
    onPick,
}: AnswerFieldsetProps) {
    return (
        <fieldset aria-describedby={step.help ? `help-${step.id}` : undefined}>
            <legend>{step.prompt}</legend>
            {step.help && (
                <p id={`help-${step.id}`} className="visually-hidden">
                    {step.help}
                </p>
            )}
            {step.options.map((option) => (
                <Form.Check
                    key={option.id}
                    type="radio"
                    name={`game-answer-${step.id}`}
                    id={optionInputId(step.id, option.id)}
                    label={option.label}
                    aria-label={option.speech}
                    aria-disabled={locked || undefined}
                    checked={selected === option.id}
                    onChange={() => {
                        if (!locked) onPick(step.id, option.id)
                    }}
                />
            ))}
        </fieldset>
    )
})

interface GameShellProps<P> {
    api: GameApi<P>
    /** Static per phase — never a text that changes every second. */
    heading: string
}

/**
 * The whole game surface in one file. Deliberately not split into
 * Announcer/StatusLine/VariantBar/QuestionPanel: the focus and announcement
 * logic spans all four, and splitting it would scatter the one part that
 * has to be right.
 *
 * Rendered inline rather than in a modal. A modal would unmount its
 * children (making a permanently mounted live region impossible), leave the
 * dialog nameless, add a second h1, make regions outside it unreliable via
 * aria-modal, and throw away a running session on Escape or a backdrop
 * click. Inline, the user can also re-read the rules and the keyboard list
 * by heading navigation while playing.
 */
export default function GameShell<P>({ api, heading }: GameShellProps<P>) {
    const anchor = useRef<HTMLHeadingElement>(null)
    const { state } = api
    const { round, phase } = state

    // Exactly two focus moves per session: session start and session end.
    // Moving focus interrupts whatever the live region is speaking, so
    // anything more would cut off the feedback the user is waiting for.
    useEffect(() => {
        if (state.focus.seq === 0) return

        anchor.current?.focus()
    }, [state.focus.seq])

    const answered =
        round !== null && Object.keys(state.draft).length >= round.steps.length

    const primaryLabel =
        phase === "over"
            ? "Play again"
            : phase === "feedback"
              ? "Next round"
              : "Submit answer"

    function onPrimary() {
        if (phase === "question") api.submit()
        else if (phase === "feedback") api.advance()
        else if (phase === "over") void api.start()
    }

    // There are deliberately no keyboard shortcuts. The site is operated in
    // browse mode, where NVDA and JAWS sit in front of the browser and claim
    // the keys anyway; every control here is reachable and operable on its
    // own, so a shortcut layer would add a second, less reliable way to do
    // what the radio groups and buttons already do.
    return (
        <section aria-labelledby="game-heading">
            <h3 id="game-heading" tabIndex={-1} ref={anchor}>
                {heading}
            </h3>

            {/*
                Plain text, deliberately not a live region. The reducer
                already announces this through the assertive channel, so a
                role="status" here would say it a second time — and being
                rendered conditionally, it is the one shape a live region
                must never have anyway.
            */}
            {state.error && <p>{state.error}</p>}

            {phase === "idle" && (
                <Button onClick={() => void api.start()}>Start training</Button>
            )}

            {round !== null && (
                <>
                    {/*
                        Two variants are an on/off state, so they get a single
                        checkbox: unchecked is the untouched reference, checked
                        is the processed version. That is one control and one
                        announcement instead of a group of two that has to be
                        entered and stepped through.

                        Games with three or more variants — "which of these
                        three stands out" — cannot express that as a checkbox
                        and keep the radio group. The engine's Variant list is
                        deliberately N-ary, so this branch is what keeps the
                        checkbox from painting later games into a corner.

                        Neither branch guards the handler: during the count-in
                        the reducer answers a locked variant with a spoken
                        "Available after the count-in", which is more use than
                        a control that silently does nothing.
                    */}
                    {round.variants.length === 2 ? (
                        <Form.Check
                            type="checkbox"
                            id="game-variant-toggle"
                            label={round.variants[1].label}
                            aria-disabled={
                                (phase === "countIn" &&
                                    round.variants[1].lockedDuringCountIn ===
                                        true) ||
                                undefined
                            }
                            checked={
                                state.activeVariantId === round.variants[1].id
                            }
                            onChange={() =>
                                api.audition(
                                    state.activeVariantId ===
                                        round.variants[1].id
                                        ? round.variants[0].id
                                        : round.variants[1].id,
                                )
                            }
                        />
                    ) : (
                        <fieldset>
                            <legend>What you hear</legend>
                            {round.variants.map((variant) => {
                                const locked =
                                    phase === "countIn" &&
                                    variant.lockedDuringCountIn === true

                                return (
                                    <Form.Check
                                        key={variant.id}
                                        type="radio"
                                        name="game-variant"
                                        id={`game-variant-${variant.id}`}
                                        label={variant.label}
                                        aria-disabled={locked || undefined}
                                        checked={
                                            state.activeVariantId === variant.id
                                        }
                                        onChange={() =>
                                            api.audition(variant.id)
                                        }
                                    />
                                )
                            })}
                        </fieldset>
                    )}

                    {/*
                        The answers stay fully navigable during the count-in
                        — only aria-disabled, never disabled, which would
                        remove them from the tab order and from the screen
                        reader's focus mode silently. That turns the waiting
                        period from dead time into the most useful window of
                        the round: the user learns the list and pre-selects.
                    */}
                    {round.steps.map((step) => (
                        <AnswerFieldset
                            key={step.id}
                            step={step}
                            selected={state.draft[step.id]}
                            locked={phase !== "question" && phase !== "countIn"}
                            onPick={api.pick}
                        />
                    ))}

                    <Button
                        id="game-primary"
                        aria-disabled={
                            phase === "countIn" ||
                            (phase === "question" && !answered) ||
                            undefined
                        }
                        onClick={onPrimary}
                    >
                        {primaryLabel}
                    </Button>

                    <h4>Last round</h4>
                    <p>{state.lastRoundText || "No answers yet."}</p>

                    <h4 id="game-status">Score</h4>
                    <dl aria-labelledby="game-status">
                        <dt>Round</dt>
                        <dd>{state.roundIndex + 1}</dd>
                        <dt>Score</dt>
                        <dd>{state.score}</dd>
                        {state.lives >= 0 && (
                            <>
                                <dt>Lives</dt>
                                <dd>
                                    {state.lives} of {state.maxLives}
                                </dd>
                            </>
                        )}
                        <dt>Streak</dt>
                        <dd>{state.streak}</dd>
                        {state.countInRemaining > 0 && (
                            <>
                                <dt>Count-in</dt>
                                <dd>
                                    <span role="timer">
                                        {state.countInRemaining} seconds
                                    </span>
                                </dd>
                            </>
                        )}
                        {state.timeRemaining !== null && (
                            <>
                                <dt>Time left</dt>
                                <dd>
                                    <span role="timer">
                                        {state.timeRemaining} seconds
                                    </span>
                                </dd>
                            </>
                        )}
                    </dl>

                    <p>
                        Track: {round.track.title}.{" "}
                        <Linkify>{round.track.credits}</Linkify>
                    </p>
                </>
            )}

            <Form.Label htmlFor="game-volume">Music volume</Form.Label>
            <Form.Range
                id="game-volume"
                min={-60}
                max={0}
                step={1}
                value={api.volumeDb}
                aria-valuetext={
                    api.volumeDb <= -60 ? "Muted" : `${api.volumeDb} decibels`
                }
                onChange={(event) =>
                    api.setVolumeDb(Number(event.currentTarget.value))
                }
            />

            <Button onClick={api.repeat}>Repeat last announcement</Button>
            {phase !== "idle" && phase !== "over" && (
                <Button onClick={api.quit}>End training</Button>
            )}
        </section>
    )
}
