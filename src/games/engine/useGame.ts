import { useLocalStorage } from "@uidotdev/usehooks"
import {
    useCallback,
    useEffect,
    useEffectEvent,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react"
import { useAnnouncer } from "../../components/game/Announcer"
import type Asset from "../../entities/Asset"
import { createRig, getAudioContext, unlockAudio, type AudioRig } from "./audio"
import { createRng, randomSeed } from "./grid"
import { trackGainDb } from "./profile"
import type {
    Answer,
    EngineSettings,
    GameAudio,
    GameSpec,
    Phase,
    Round,
    Verdict,
} from "./types"

const DEFAULT_COUNT_IN_SECONDS = 4
const DEFAULT_LIVES = 3
const DEFAULT_JITTER_DB = 1.5
const FEEDBACK_DUCK_MS = 2200
const TICK_MS = 200
const PROBE_MS = 100
const VOLUME_KEY = "gameVolumeDb"
const DEFAULT_VOLUME_DB = -6

const AUDIO_ERROR =
    "Audio could not be started. Check your output device, then try again."

export interface GameState<P> {
    phase: Phase
    /** mulberry32 word. Kept in state so the reducer stays pure. */
    rng: number
    round: Round<P> | null
    roundIndex: number
    /**
     * Bumped on every start. A game's round key restarts at r0 with each
     * session, so without this the round effect would not re-run when a
     * session ends and restarts at the same round index — leaving the
     * previous round's filter in place while the answer belongs to the new
     * one, which makes the round unsolvable.
     */
    sessionSeq: number
    activeVariantId: string
    auditions: number
    draft: Answer
    verdict: Verdict | null
    /** -1 disables the lives system entirely (time attack). */
    lives: number
    maxLives: number
    score: number
    streak: number
    bestStreak: number
    correctCount: number
    answeredCount: number
    /** Absolute audio clock times. Nothing is ever decremented. */
    countInEndsAt: number | null
    countInRemaining: number
    sessionEndsAt: number | null
    timeRemaining: number | null
    /** Statically readable under the "Last round" heading. */
    lastRoundText: string
    announcement: { text: string; urgent: boolean; seq: number }
    /** Focus is data, not an imperative side effect. */
    focus: { target: "round" | "summary"; seq: number }
    error: string | null
}

type Action =
    | { type: "start"; at: number; seed: number }
    | { type: "countInStart"; at: number; seconds: number }
    | { type: "tick"; at: number }
    | { type: "audition"; variantId: string }
    | { type: "pick"; stepId: string; optionId: string }
    | { type: "submit" }
    | { type: "advance" }
    | { type: "audioError"; message: string }
    | { type: "quit" }
    | { type: "dismiss" }

export interface GameApi<P> {
    state: GameState<P>
    /** Must be called from a real click handler so the context can unlock. */
    start(): Promise<void>
    audition(variantId: string): void
    pick(stepId: string, optionId: string): void
    submit(): void
    advance(): void
    repeat(): void
    quit(): void
    /** Leaves the finished session and closes the game dialog. */
    dismiss(): void
    volumeDb: number
    setVolumeDb(db: number): void
}

function initialState<P, S>(
    spec: GameSpec<P, S>,
    settings: EngineSettings<S>,
): GameState<P> {
    const timed = settings.timeAttackSeconds !== null
    const maxLives = spec.lives ?? DEFAULT_LIVES

    return {
        phase: "idle",
        rng: settings.seed,
        round: null,
        roundIndex: 0,
        sessionSeq: 0,
        activeVariantId: "",
        auditions: 0,
        draft: {},
        verdict: null,
        lives: timed ? -1 : maxLives,
        maxLives,
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        answeredCount: 0,
        countInEndsAt: null,
        countInRemaining: 0,
        sessionEndsAt: null,
        timeRemaining: timed ? settings.timeAttackSeconds : null,
        lastRoundText: "",
        announcement: { text: "", urgent: false, seq: 0 },
        focus: { target: "round", seq: 0 },
        error: null,
    }
}

export function createGameReducer<P, S>(
    spec: GameSpec<P, S>,
    settings: EngineSettings<S>,
    tracks: readonly Asset[],
    sampleRate: number,
) {
    const timed = settings.timeAttackSeconds !== null
    const countInSeconds = spec.countInSeconds ?? DEFAULT_COUNT_IN_SECONDS

    function announce(
        state: GameState<P>,
        text: string,
        urgent: boolean,
    ): GameState<P> {
        return {
            ...state,
            announcement: {
                text,
                urgent,
                seq: state.announcement.seq + 1,
            },
        }
    }

    /** Creates the next round and advances the stored random state. */
    function beginRound(state: GameState<P>, roundIndex: number): GameState<P> {
        const rng = createRng(state.rng)

        const round = spec.makeRound({
            roundIndex,
            level: settings.level,
            settings: settings.game,
            sampleRate,
            tracks,
            previousTrack: state.round?.track ?? null,
            rng,
        })

        // Time attack gives a count-in for the opening round only: the
        // player still needs one reference listen, but after that every
        // spoken second is a second lost.
        const wantsCountIn = !timed || roundIndex === 0

        return {
            ...state,
            rng: rng.state(),
            round,
            roundIndex,
            draft: {},
            verdict: null,
            auditions: 0,
            phase: wantsCountIn ? "countIn" : "question",
            countInEndsAt: null,
            countInRemaining: wantsCountIn ? countInSeconds : 0,
            activeVariantId: wantsCountIn
                ? round.variants[0].id
                : round.revealVariantId,
        }
    }

    function openQuestion(state: GameState<P>, at: number): GameState<P> {
        const round = state.round

        if (round === null) return state

        const opened: GameState<P> = {
            ...state,
            phase: "question",
            countInEndsAt: null,
            countInRemaining: 0,
            activeVariantId: round.revealVariantId,
            // The session clock starts when the first question opens, so
            // the count-in never eats into the 60 seconds.
            sessionEndsAt:
                timed && state.sessionEndsAt === null
                    ? at + (settings.timeAttackSeconds ?? 60)
                    : state.sessionEndsAt,
        }

        return announce(opened, round.steps[0].prompt, false)
    }

    function finish(
        state: GameState<P>,
        reason: "user" | "lives" | "time",
    ): GameState<P> {
        const summary = spec.summarise({
            level: settings.level,
            rounds: state.answeredCount,
            correct: state.correctCount,
            score: state.score,
            bestStreak: state.bestStreak,
            reason,
        })

        // When the last life goes, the verdict for that final answer has not
        // been spoken yet. Without this the player never hears what the right
        // answer was and has to go hunting for the "Last round" heading.
        const text =
            reason === "lives" && state.lastRoundText !== ""
                ? `${state.lastRoundText} ${summary}`
                : summary

        return announce(
            {
                ...state,
                phase: "over",
                countInEndsAt: null,
                sessionEndsAt: null,
                countInRemaining: 0,
                focus: { target: "summary", seq: state.focus.seq + 1 },
            },
            text,
            true,
        )
    }

    return function reducer(state: GameState<P>, action: Action): GameState<P> {
        switch (action.type) {
            case "start": {
                // The seed comes from the action, not from the settings, so
                // that replaying with unchanged settings does not replay the
                // exact same rounds.
                const fresh = initialState(spec, settings)
                const started = beginRound({ ...fresh, rng: action.seed }, 0)

                return {
                    ...started,
                    sessionSeq: state.sessionSeq + 1,
                    focus: { target: "round", seq: state.focus.seq + 1 },
                    announcement: {
                        text: spec.introduce?.(started.round!) ?? "Round 1.",
                        urgent: false,
                        seq: state.announcement.seq + 1,
                    },
                }
            }

            case "countInStart": {
                if (state.phase !== "countIn") return state

                return {
                    ...state,
                    countInEndsAt: action.at + action.seconds,
                    countInRemaining: action.seconds,
                }
            }

            // The single clock input, carrying an ABSOLUTE timestamp.
            // Nothing accumulates, so there is no drift; a duplicated
            // dispatch under StrictMode is a no-op because the same `at`
            // yields the same state; and a throttled tick in a background
            // tab corrects itself on the next one. Because currentTime
            // stops while the context is suspended, ctx.suspend() is a
            // complete pause implementation with no bookkeeping at all.
            case "tick": {
                if (state.phase === "idle" || state.phase === "over")
                    return state

                let next = state

                if (state.countInEndsAt !== null) {
                    const left = Math.max(0, state.countInEndsAt - action.at)
                    const whole = Math.ceil(left)

                    if (whole !== next.countInRemaining)
                        next = { ...next, countInRemaining: whole }

                    if (left <= 0) next = openQuestion(next, action.at)
                }

                if (next.sessionEndsAt !== null) {
                    const left = Math.max(0, next.sessionEndsAt - action.at)
                    const whole = Math.ceil(left)

                    if (whole !== next.timeRemaining)
                        next = { ...next, timeRemaining: whole }

                    if (left <= 0) return finish(next, "time")
                }

                return next
            }

            case "audition": {
                // Feedback is included on purpose: hearing the two variants
                // again right after learning the answer is exactly how the
                // connection between a number and a sound gets made.
                if (
                    state.phase !== "countIn" &&
                    state.phase !== "question" &&
                    state.phase !== "feedback"
                )
                    return state

                const variant = state.round?.variants.find(
                    (v) => v.id === action.variantId,
                )

                if (!variant) return state

                if (state.phase === "countIn" && variant.lockedDuringCountIn)
                    return announce(
                        state,
                        "Available after the count-in.",
                        false,
                    )

                return announce(
                    {
                        ...state,
                        activeVariantId: variant.id,
                        auditions: state.auditions + 1,
                    },
                    variant.label,
                    false,
                )
            }

            case "pick": {
                // The count-in is allowed, because the shell deliberately
                // keeps the answers navigable during it so the player can
                // pre-select. Rejecting the pick here would make the screen
                // reader announce a selection that React then silently takes
                // back. Submitting stays restricted to "question".
                if (
                    (state.phase !== "question" && state.phase !== "countIn") ||
                    state.round === null
                )
                    return state

                const step = state.round.steps.find(
                    (s) => s.id === action.stepId,
                )
                const option = step?.options.find(
                    (o) => o.id === action.optionId,
                )

                if (!option) return state

                // No announcement: the screen reader reads the radio itself.
                return {
                    ...state,
                    draft: { ...state.draft, [action.stepId]: action.optionId },
                    activeVariantId: option.auditions ?? state.activeVariantId,
                }
            }

            case "submit": {
                // The shell keeps the answers selectable during the count-in
                // so the player can pre-select, which makes reaching for the
                // submit button the natural next move. Saying why it is too
                // early beats a button that silently does nothing.
                if (state.phase === "countIn")
                    return announce(
                        state,
                        "Available after the count-in.",
                        true,
                    )

                // Reentrancy guard. Two fast activations of the button would
                // otherwise start two evaluations; aria-disabled alone does
                // not help, because it only takes effect after the re-render.
                if (state.phase !== "question" || state.round === null)
                    return state

                const round = state.round

                if (Object.keys(state.draft).length < round.steps.length)
                    return announce(state, "Choose an answer first.", true)

                const verdict = spec.judge(round, state.draft)
                const bonus = verdict.correct
                    ? Math.min(state.streak, spec.streakBonusCap ?? 4) *
                      (spec.streakBonusPoints ?? 25)
                    : 0
                const gained = verdict.correct ? verdict.points + bonus : 0
                const streak = verdict.correct ? state.streak + 1 : 0
                const lives =
                    state.lives >= 0 && !verdict.correct
                        ? state.lives - 1
                        : state.lives

                const scored: GameState<P> = {
                    ...state,
                    verdict,
                    lives,
                    score: state.score + gained,
                    streak,
                    bestStreak: Math.max(state.bestStreak, streak),
                    correctCount:
                        state.correctCount + (verdict.correct ? 1 : 0),
                    answeredCount: state.answeredCount + 1,
                    lastRoundText: `Round ${state.roundIndex + 1}. ${verdict.speech}`,
                }

                if (lives === 0) return finish(scored, "lives")

                if (timed) {
                    // No spoken verdict: a sentence costs about three of the
                    // sixty seconds. The earcon carries the result, and the
                    // text stays readable under "Last round".
                    //
                    // The verdict has to be carried across the round change
                    // by hand. beginRound resets it to null, and the earcon
                    // effect keys on the verdict's identity — reset to null
                    // it would compare null with null, never re-run, and the
                    // player would get no feedback at all for a whole
                    // session. spec.judge returns a fresh object per answer,
                    // so the effect fires exactly once per answer.
                    return {
                        ...beginRound(scored, scored.roundIndex + 1),
                        verdict,
                    }
                }

                const livesText =
                    lives >= 0
                        ? ` ${lives} of ${state.maxLives} lives left.`
                        : ""

                return announce(
                    { ...scored, phase: "feedback" },
                    `${scored.lastRoundText} Score ${scored.score}.${livesText}`,
                    true,
                )
            }

            case "advance": {
                if (state.phase !== "feedback") return state

                // Deliberately no focus change: moving focus would cut off
                // the live region announcement that is still being spoken.
                return beginRound(state, state.roundIndex + 1)
            }

            case "audioError":
                // The round is torn down with it. Leaving it in place would
                // strand the player among the controls of a round that can
                // no longer be played — a question, a live "Submit answer"
                // button and a running count-in, all of them silent on
                // activation, with no clue that they are dead.
                return announce(
                    {
                        ...state,
                        phase: "idle",
                        round: null,
                        verdict: null,
                        activeVariantId: "",
                        draft: {},
                        countInEndsAt: null,
                        countInRemaining: 0,
                        error: action.message,
                    },
                    action.message,
                    true,
                )

            case "quit":
                return state.phase === "idle" || state.phase === "over"
                    ? state
                    : finish(state, "user")

            case "dismiss": {
                // Only from a finished session or an audio error, so a
                // stray dismiss cannot throw away a round in progress.
                if (state.phase !== "over" && state.error === null) return state

                // The counters carry over, so the live regions and the focus
                // effect keep seeing strictly rising sequence numbers.
                return {
                    ...initialState(spec, settings),
                    rng: state.rng,
                    sessionSeq: state.sessionSeq,
                    announcement: state.announcement,
                    focus: state.focus,
                }
            }
        }
    }
}

export function useGame<P, S>(
    spec: GameSpec<P, S>,
    settings: EngineSettings<S>,
    tracks: readonly Asset[],
): GameApi<P> {
    const announcer = useAnnouncer()

    // Reading the real sample rate up front: the answer grid depends on it,
    // and a Bluetooth headset in HFP mode forces a 16 kHz context.
    const [sampleRate] = useState(() => getAudioContext().sampleRate)

    const reducer = useMemo(
        () => createGameReducer(spec, settings, tracks, sampleRate),
        [spec, settings, tracks, sampleRate],
    )

    const [state, dispatch] = useReducer(reducer, undefined, () =>
        initialState(spec, settings),
    )

    const rigRef = useRef<AudioRig | null>(null)
    const audioRef = useRef<GameAudio | null>(null)
    const generationRef = useRef(0)
    const loadedUrlRef = useRef<string | null>(null)
    const stateRef = useRef<GameState<P>>(state)

    stateRef.current = state

    const [storedVolume, setStoredVolume] = useLocalStorage<number>(
        VOLUME_KEY,
        DEFAULT_VOLUME_DB,
    )

    const volumeDb = Number.isFinite(Number(storedVolume))
        ? Number(storedVolume)
        : DEFAULT_VOLUME_DB

    const round = state.round
    const roundKey = round === null ? null : `s${state.sessionSeq}:${round.key}`
    const wantsCountIn = state.phase === "countIn"
    const countInSeconds = spec.countInSeconds ?? DEFAULT_COUNT_IN_SECONDS

    // Dispose everything exactly once, on unmount. Idempotency comes from
    // real cleanup functions, never from ref guards: a useRef container
    // survives StrictMode's simulated remount, which is why the previous
    // implementation's `if (!audioNode.current)` guard worked by accident
    // and killed the level switch as a side effect.
    useEffect(
        () => () => {
            audioRef.current?.dispose()
            audioRef.current = null
            rigRef.current?.dispose()
            rigRef.current = null
            loadedUrlRef.current = null
        },
        [],
    )

    const onTick = useEffectEvent(() => {
        const rig = rigRef.current

        if (rig) dispatch({ type: "tick", at: rig.now() })
    })

    // No requestAnimationFrame: rAF pauses when the document is hidden but
    // the audio does not, so the display would freeze and then jump.
    useEffect(() => {
        if (state.phase === "idle" || state.phase === "over") return

        const timer = window.setInterval(() => onTick(), TICK_MS)

        return () => window.clearInterval(timer)
    }, [state.phase])

    useEffect(() => {
        if (state.phase === "idle") return

        const timer = window.setInterval(
            () => rigRef.current?.probe.sample(),
            PROBE_MS,
        )

        return () => window.clearInterval(timer)
    }, [state.phase === "idle"])

    useEffect(() => {
        const rig = rigRef.current

        if (rig === null || round === null) return

        const generation = ++generationRef.current

        audioRef.current?.dispose()
        audioRef.current = spec.buildAudio(rig, round)

        // Drawn once per round rather than per switch, otherwise it is
        // audible as wobble while comparing the two variants. Applied after
        // the passage is in place, because seeking mutes the trim.
        const jitter = spec.levelJitterDb ?? DEFAULT_JITTER_DB
        const applyTrim = () =>
            rig.setRoundTrimDb(
                jitter === 0 ? 0 : (Math.random() * 2 - 1) * jitter,
            )

        // Loading is asynchronous and the session can end while it is still
        // running. The generation counter alone does not catch that: ending
        // a session changes neither the round nor sessionSeq, so roundKey is
        // unchanged, this effect never re-runs, and the generation still
        // matches. The captured wantsCountIn is a snapshot from the render
        // where the effect last ran and is likewise still true. So the live
        // phase has to be read, otherwise a count-in gets scheduled onto the
        // cue bus — which bypasses both the trim and the ducker — and clicks
        // over the spoken summary of a session that is already over.
        const beginCountIn = () => {
            if (generation !== generationRef.current) return

            // Checked before wantsCountIn, because a time attack round has
            // no count-in and would otherwise leave the element playing.
            if (
                stateRef.current.phase === "over" ||
                stateRef.current.phase === "idle"
            ) {
                // loadTrack ends with its own play(), so the element is
                // running again by now and has to be stopped a second time.
                rig.stopTrack()
                return
            }

            if (!wantsCountIn || stateRef.current.phase !== "countIn") return

            rig.scheduleCountIn(countInSeconds)
            dispatch({
                type: "countInStart",
                at: rig.now(),
                seconds: countInSeconds,
            })
        }

        const onAudioFailure = () => {
            if (generation !== generationRef.current) return

            loadedUrlRef.current = null
            dispatch({ type: "audioError", message: AUDIO_ERROR })
        }

        // A held track still has to jump to this round's passage. The round
        // picks a passage that actually contains the target frequency, so
        // skipping the seek would play a stretch that may not contain it at
        // all — which is the whole thing the profiles exist to prevent.
        const prepare = async () => {
            // Applied before playback so a track change is not a level jump.
            rig.setTrackGainDb(trackGainDb(round.track.file))

            if (round.track.url === loadedUrlRef.current) {
                // It may be paused because the previous session ended, so
                // resuming is not optional.
                await rig.ensurePlaying()
                await rig.seekTo(round.trackOffsetFraction)
            } else {
                loadedUrlRef.current = round.track.url
                await rig.loadTrack(round.track.url, round.trackOffsetFraction)
            }

            applyTrim()
            beginCountIn()
        }

        void prepare().catch(onAudioFailure)

        return () => {
            if (generation !== generationRef.current) return

            // Otherwise the previous round's downbeat can still be pending.
            rig.cancelCues()
            audioRef.current?.dispose()
            audioRef.current = null
        }
    }, [roundKey])

    useEffect(() => {
        const rig = rigRef.current

        if (rig === null || audioRef.current === null) return
        if (state.activeVariantId === "") return

        audioRef.current.setVariant(state.activeVariantId, rig.now())
    }, [state.activeVariantId, roundKey])

    // Sound before speech: an earcon first gives the highest recognition
    // rates, and playing both at once makes them mask each other.
    useEffect(() => {
        const rig = rigRef.current
        const verdict = state.verdict

        if (rig === null || verdict === null) return

        rig.earcon(verdict.correct ? "correct" : "wrong")

        if (state.phase !== "feedback") return

        rig.duck(true)

        const timer = window.setTimeout(
            () => rigRef.current?.duck(false),
            FEEDBACK_DUCK_MS,
        )

        return () => {
            window.clearTimeout(timer)
            rigRef.current?.duck(false)
        }
    }, [state.verdict])

    // The session is over — stop the music. Leaving it looping means a blind
    // user gets the summary and then sits with endless playback and no
    // obvious way to silence it short of leaving the page.
    useEffect(() => {
        if (state.phase !== "over") return

        // cancelCues as well as stopTrack: a count-in is scheduled ahead of
        // time as a set of oscillators on the cue bus, which deliberately
        // bypasses the trim and the ducker. Fading the music out therefore
        // does nothing to ticks that are already queued, and they would go
        // on clicking over the closing summary.
        rigRef.current?.cancelCues()
        rigRef.current?.stopTrack()
    }, [state.phase])

    useEffect(() => {
        if (state.announcement.seq === 0 || state.announcement.text === "")
            return

        announcer.say(
            state.announcement.text,
            state.announcement.urgent ? "assertive" : "polite",
        )
    }, [state.announcement.seq])

    useEffect(() => {
        rigRef.current?.setVolumeDb(volumeDb)
    }, [volumeDb, state.phase])

    const start = useCallback(async () => {
        try {
            // resume() belongs in the click call stack, not in an effect: a
            // passive effect runs in a scheduler callback outside the
            // gesture stack, which Chrome's sticky activation forgives but
            // Safari's transient activation check does not.
            const ctx = await unlockAudio()

            if (rigRef.current === null) rigRef.current = createRig(ctx)

            rigRef.current.setVolumeDb(volumeDb)
            dispatch({
                type: "start",
                at: ctx.currentTime,
                seed: randomSeed(),
            })
        } catch {
            dispatch({ type: "audioError", message: AUDIO_ERROR })
        }
    }, [volumeDb])

    return {
        state,
        start,
        audition: useCallback(
            (variantId: string) => dispatch({ type: "audition", variantId }),
            [],
        ),
        pick: useCallback(
            (stepId: string, optionId: string) =>
                dispatch({ type: "pick", stepId, optionId }),
            [],
        ),
        submit: useCallback(() => dispatch({ type: "submit" }), []),
        advance: useCallback(() => dispatch({ type: "advance" }), []),
        repeat: useCallback(() => announcer.repeat(), [announcer]),
        quit: useCallback(() => dispatch({ type: "quit" }), []),
        dismiss: useCallback(() => dispatch({ type: "dismiss" }), []),
        volumeDb,
        setVolumeDb: setStoredVolume,
    }
}
