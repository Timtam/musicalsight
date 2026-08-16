import Linkify from "linkify-react"
import { memo, useEffect, useRef } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import Modal from "react-bootstrap/Modal"
import type { Step } from "../../games/engine/types"
import type { GameApi } from "../../games/engine/useGame"
import { LiveRegions } from "./Announcer"

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
 * A running session lives in a dialog, so the player cannot wander out of
 * the game and into the rest of the page. react-bootstrap sets
 * aria-modal="true", which is what actually contains the virtual cursor —
 * a focus trap alone would only hold the Tab key, and in browse mode the
 * screen reader's cursor is not the focus.
 *
 * Three consequences, each handled below: the live regions have to move
 * inside the dialog, because under aria-modal a region outside it is not
 * reliably observed; Escape and backdrop clicks are disabled, because both
 * default to discarding a session in progress; and the dialog is named by
 * the heading rather than left anonymous, which the previous modal was.
 */
export default function GameShell<P>({ api, heading }: GameShellProps<P>) {
    const anchor = useRef<HTMLHeadingElement>(null)
    const { state } = api
    const { round, phase } = state

    // The error keeps the dialog open too: it is announced at the moment the
    // phase falls back to idle, and closing the dialog in that instant would
    // unmount the live regions before the message could be read out.
    const inGame = phase !== "idle" || state.error !== null

    // Exactly two focus moves per session: session start and session end.
    // Moving focus interrupts whatever the live region is speaking, so
    // anything more would cut off the feedback the user is waiting for.
    useEffect(() => {
        if (state.focus.seq === 0) return

        anchor.current?.focus()
    }, [state.focus.seq])

    // A measuring round is submitted by its own button, so the usual primary
    // control has nothing to do while the question is open. It stays mounted
    // and merely goes aria-disabled — see the button itself for why removing
    // it is not an option.
    const capturing = round?.steps.some((s) => s.capture) === true

    /**
     * Whether the answers already switch playback on their own.
     *
     * When they do — "which of these three is compressed", where every option
     * carries Option.auditions — the audition control below would be a second
     * copy of the same list, one to listen with and one to answer with. In
     * browse mode that is two identical radio groups to walk past, and the
     * distinction between them is invisible until you have used both.
     *
     * Derived rather than flagged, because the redundancy IS this condition:
     * a control that offers nothing the answers do not already offer.
     */
    const answersAudition =
        round !== null &&
        round.variants.length > 0 &&
        round.variants.every((variant) =>
            round.steps.some((step) =>
                step.options.some((option) => option.auditions === variant.id),
            ),
        )

    const answered =
        round !== null && Object.keys(state.draft).length >= round.steps.length

    const primaryLabel =
        phase === "over"
            ? "Play again"
            : phase === "feedback"
              ? "Next round"
              : "Submit answer"

    function onPrimary() {
        // countIn goes through submit as well, so the reducer can say why it
        // is too early rather than leaving the activation unanswered.
        if (phase === "question" || phase === "countIn") api.submit()
        else if (phase === "feedback") api.advance()
        else if (phase === "over") void api.start()
    }

    // There are deliberately no keyboard shortcuts. The site is operated in
    // browse mode, where NVDA and JAWS sit in front of the browser and claim
    // the keys anyway; every control here is reachable and operable on its
    // own, so a shortcut layer would add a second, less reliable way to do
    // what the radio groups and buttons already do.
    return (
        <>
            {/*
                Never unmounted, even though it is unreachable behind the
                dialog anyway. react-bootstrap restores focus on close to
                whatever was focused before opening — and a real activation
                focuses this button, so unmounting it leaves restoreFocus
                with a detached node, focus lands on document.body, and the
                virtual cursor is thrown back to the top of the page without
                a word. That is the exact wandering the dialog exists to
                prevent, at the one moment it hurts most.
            */}
            <Button
                aria-disabled={inGame || undefined}
                onClick={() => {
                    if (!inGame) void api.start()
                }}
            >
                Start training
            </Button>

            <Modal
                show={inGame}
                // Only our own buttons close this. Both defaults would throw
                // away a session in progress without asking.
                backdrop="static"
                keyboard={false}
                onHide={api.dismiss}
                scrollable
                fullscreen="sm-down"
                aria-labelledby="game-heading"
            >
                <Modal.Body>
                    <h3 id="game-heading" tabIndex={-1} ref={anchor}>
                        {heading}
                    </h3>

                    {/*
                        Inside the dialog on purpose: react-bootstrap marks it
                        aria-modal, so a live region left outside would not be
                        reliably announced and the game would go silent.
                    */}
                    <LiveRegions />

                    {/*
                        Plain text, deliberately not a live region. The reducer
                        already announces this through the assertive channel,
                        so a role="status" here would say it a second time.
                    */}
                    {state.error && <p>{state.error}</p>}

                    {/*
                        Same reasoning as the error above: plain text, not a
                        live region, because the reducer already spoke it.

                        It has to stay on screen. The live region clears
                        itself a second after speaking, and for a calibration
                        run this paragraph IS the result — the measured
                        average, its spread and the recommendation exist
                        nowhere else. The score line below cannot carry them:
                        it is hidden on measuring rounds precisely because
                        points are meaningless there.
                    */}
                    {phase === "over" && state.summaryText !== "" && (
                        <>
                            <h4>Result</h4>
                            <p>{state.summaryText}</p>
                        </>
                    )}

                    {round !== null && (
                        <>
                            {/*
                                The playing surface, gone once the session is
                                over. The round object survives into the "over"
                                phase — the score line and "Last round" still
                                read from it — but every control in here is
                                dead by then: the audio is stopped, so the
                                variant toggle switches nothing, and the
                                question has already been answered and
                                reported. Leaving it up put a standing
                                instruction ("Press as soon as you notice a
                                change…") on the results screen, where there
                                is nothing left to press.
                            */}
                            {phase !== "over" && (
                                <>
                                    {/*
                                Two variants are an on/off state, so they get
                                a single checkbox: unchecked is the untouched
                                reference, checked is the processed version.
                                One control and one announcement instead of a
                                group of two to enter and step through.

                                Games with three or more variants — "which of
                                these three stands out" — cannot express that
                                as a checkbox and keep the radio group. The
                                engine's Variant list is deliberately N-ary,
                                so this branch is what keeps the checkbox from
                                painting later games into a corner.

                                Neither branch guards the handler: during the
                                count-in the reducer answers a locked variant
                                with a spoken "Available after the count-in",
                                which is more use than a control that silently
                                does nothing.

                                And nothing at all when the answers already
                                switch playback themselves — see
                                answersAudition above.
                            */}
                                    {answersAudition ||
                                    round.variants.length < 2 ? null : round
                                          .variants.length === 2 ? (
                                        <Form.Check
                                            type="checkbox"
                                            id="game-variant-toggle"
                                            label={round.variants[1].label}
                                            aria-disabled={
                                                (phase === "countIn" &&
                                                    round.variants[1]
                                                        .lockedDuringCountIn ===
                                                        true) ||
                                                undefined
                                            }
                                            checked={
                                                state.activeVariantId ===
                                                round.variants[1].id
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
                                                    variant.lockedDuringCountIn ===
                                                        true

                                                return (
                                                    <Form.Check
                                                        key={variant.id}
                                                        type="radio"
                                                        name="game-variant"
                                                        id={`game-variant-${variant.id}`}
                                                        label={variant.label}
                                                        aria-disabled={
                                                            locked || undefined
                                                        }
                                                        checked={
                                                            state.activeVariantId ===
                                                            variant.id
                                                        }
                                                        onChange={() =>
                                                            api.audition(
                                                                variant.id,
                                                            )
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
                                    {round.steps.map((step) =>
                                        step.capture ? (
                                            // A measuring step: one button, pressed
                                            // the moment something is perceived. The
                                            // instant IS the answer, so there is
                                            // nothing to select and nothing to submit
                                            // afterwards.
                                            <div key={step.id}>
                                                <p>{step.prompt}</p>
                                                {step.help && (
                                                    <p
                                                        id={`help-${step.id}`}
                                                        className="visually-hidden"
                                                    >
                                                        {step.help}
                                                    </p>
                                                )}
                                                <Button
                                                    id={`game-capture-${step.id}`}
                                                    aria-describedby={
                                                        step.help
                                                            ? `help-${step.id}`
                                                            : undefined
                                                    }
                                                    aria-disabled={
                                                        phase !== "question" ||
                                                        undefined
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            phase === "question"
                                                        )
                                                            api.capture()
                                                    }}
                                                >
                                                    {step.capture.buttonLabel}
                                                </Button>
                                            </div>
                                        ) : (
                                            <AnswerFieldset
                                                key={step.id}
                                                step={step}
                                                selected={state.draft[step.id]}
                                                locked={
                                                    phase !== "question" &&
                                                    phase !== "countIn"
                                                }
                                                onPick={api.pick}
                                            />
                                        ),
                                    )}
                                </>
                            )}

                            {/*
                                Never unmounted, for the same reason as the
                                Start button above. On a measuring round this
                                control has nothing to do once the question
                                opens — but hiding it there unmounted the very
                                node that had just been activated to get here,
                                because "Next round" IS this button. Focus fell
                                to document.body and the virtual cursor was
                                thrown out of the dialog, silently, at the
                                start of every round from the second on.

                                So it stays and goes aria-disabled instead.
                                Activating it anyway is answered by the reducer
                                with a spoken pointer to the capture button,
                                rather than the "Choose an answer first" that a
                                measuring round has no way to satisfy.
                            */}
                            <Button
                                id="game-primary"
                                aria-disabled={
                                    phase === "countIn" ||
                                    (phase === "question" &&
                                        (capturing || !answered)) ||
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
                                {!capturing && (
                                    <>
                                        <dt>Score</dt>
                                        <dd>{state.score}</dd>
                                    </>
                                )}
                                {state.lives >= 0 && (
                                    <>
                                        <dt>Lives</dt>
                                        <dd>
                                            {state.lives} of {state.maxLives}
                                        </dd>
                                    </>
                                )}
                                {!capturing && (
                                    <>
                                        <dt>Streak</dt>
                                        <dd>{state.streak}</dd>
                                    </>
                                )}
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

                            {/*
                                Opened in a new tab: following an attribution
                                link in the same tab would leave the app and
                                destroy the session, and going back reloads
                                the page at round zero.
                            */}
                            <p>
                                Track: {round.track.title}.{" "}
                                <Linkify
                                    options={{
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                    }}
                                >
                                    {round.track.credits}
                                </Linkify>
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
                            api.volumeDb <= -60
                                ? "Muted"
                                : `${api.volumeDb} decibels`
                        }
                        onChange={(event) =>
                            api.setVolumeDb(Number(event.currentTarget.value))
                        }
                    />

                    <Button onClick={api.repeat}>
                        Repeat last announcement
                    </Button>
                    {phase !== "idle" && phase !== "over" && (
                        <Button onClick={api.quit}>End training</Button>
                    )}
                    {state.error !== null && (
                        <Button onClick={() => void api.start()}>
                            Try again
                        </Button>
                    )}
                    {(phase === "over" || state.error !== null) && (
                        <Button onClick={api.dismiss}>Close</Button>
                    )}
                </Modal.Body>
            </Modal>
        </>
    )
}
