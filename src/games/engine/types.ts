import type Asset from "../../entities/Asset"
import type { AudioRig } from "./audio"

export type Phase = "idle" | "countIn" | "question" | "feedback" | "over"

/** stepId -> optionId. One shape for every game, including single step ones. */
export type Answer = Record<string, string>

export interface Rng {
    next(): number
    int(maxExclusive: number): number
    pick<T>(items: readonly T[]): T
    /** Current 32 bit word, written back into the reducer state. */
    state(): number
}

export interface Variant {
    id: string
    /** Shown and spoken: "Original", "Boosted", "Sound A". */
    label: string
    /** Marked aria-disabled while the count-in is running. */
    lockedDuringCountIn?: boolean
}

export interface Option {
    /** Stable across rounds. Used as the React key. Never the array index. */
    id: string
    /** Visible: "1.6 kHz". */
    label: string
    /** Spoken, where the visible form reads badly: "1600 hertz". */
    speech?: string
    /**
     * Only for "which one of these" games: selecting this option also
     * switches playback to the named variant. Pure data — only the shell
     * reads this field, the reducer never does. That is the entire
     * difference between the two game shapes; there is deliberately no
     * mode flag, because the moment the engine branches on one it becomes
     * two engines in one file.
     */
    auditions?: string
}

export interface Step {
    id: string
    /** Rendered as the <legend> and spoken with the group. */
    prompt: string
    /** Extra sentence, wired up via aria-describedby, visually hidden. */
    help?: string
    options: Option[]
}

export interface Round<P> {
    /** Unique per round, drives the effect dependencies. */
    key: string
    track: Asset
    /** 0..0.8, multiplied by the real track duration. */
    trackOffsetFraction: number
    variants: Variant[]
    /** Played as soon as the count-in ends. */
    revealVariantId: string
    /** Length 1 for most games, 3 for Filter Expert. */
    steps: Step[]
    correct: Answer
    /** Passed through to buildAudio and judge with full type safety. */
    params: P
}

export interface Verdict {
    correct: boolean
    /** Partial credit for multi dimensional answers. */
    perStep: Record<string, boolean>
    points: number
    /** The exact sentence the screen reader will speak. */
    speech: string
}

export interface MakeRoundContext<S> {
    roundIndex: number
    level: number
    settings: S
    /** Read from the live AudioContext. Never a constant. */
    sampleRate: number
    tracks: readonly Asset[]
    previousTrack: Asset | null
    rng: Rng
}

export interface LevelSpec {
    id: number
    label: string
    /** Spoken as part of the radio label. */
    description: string
    /** False where a multi step answer makes a 60 second round incoherent. */
    supportsTimeAttack: boolean
}

export interface GameAudio {
    /**
     * Switches the audible variant. `at` is an absolute audio clock time.
     * Must be click free — use glide() or crossfadeVariants().
     */
    setVariant(variantId: string, at: number): void
    dispose(): void
}

/**
 * The complete engine interface. No chain array, no mode flag — a single
 * function pointer for audio, which is strictly more general and smaller
 * than any chain abstraction, and carries both topologies (one chain with a
 * parameter ramp, N chains with a crossfade) without the engine ever
 * knowing the difference.
 */
export interface GameSpec<P, S> {
    id: string
    name: string
    levels: readonly LevelSpec[]
    defaultSettings: S

    /** Defaults to 4. */
    countInSeconds?: number
    /** Defaults to 3. Ignored in time attack. */
    lives?: number
    /** Defaults to 1.5. Set to 0 where the level itself is the question. */
    levelJitterDb?: number
    /** Extra points per answer in the current streak. Defaults to 25. */
    streakBonusPoints?: number
    /** The streak length past which the bonus stops growing. Defaults to 4. */
    streakBonusCap?: number

    /** Pure. No Math.random, no Date, no DOM — use ctx.rng. */
    makeRound(context: MakeRoundContext<S>): Round<P>

    /**
     * Builds the graph between rig.source (already behind the probe) and
     * rig.sink.
     *
     * INVARIANT for games with N parallel chains (Dynamics, Distortion,
     * Space): every variant must share the same node topology, and only
     * parameter values may differ. A "bypass" is the same node in a
     * transparent setting — a DynamicsCompressorNode with ratio 1, a
     * WaveShaperNode with an identity curve, a DelayNode with wet 0 — never
     * a missing node. Only then is the latency identical across variants
     * (compressor lookahead, waveshaper oversampling) and crossfading safe.
     *
     * EQ Detective deliberately does NOT follow this: at gain 0 dB the
     * peaking filter is a bit exact identity, so it uses one chain and a
     * ramp on filter.gain. Crossfading between a flat and a filtered copy
     * would sum a phase rotated signal with itself at the 50/50 point,
     * which is a comb filter rather than a filter at half gain.
     */
    buildAudio(rig: AudioRig, round: Round<P>): GameAudio

    /** Pure. Produces the verdict including the spoken sentence. */
    judge(round: Round<P>, given: Answer): Verdict

    /** Optional sentence spoken when a round starts. */
    introduce?(round: Round<P>): string

    /** Closing sentence. The engine adds nothing to it. */
    summarise(input: {
        level: number
        rounds: number
        correct: number
        score: number
        bestStreak: number
        reason: "user" | "lives" | "time"
    }): string
}

export interface EngineSettings<S> {
    level: number
    /** Null means practice mode. */
    timeAttackSeconds: number | null
    seed: number
    game: S
}
