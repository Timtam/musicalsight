import {
    dbToGain,
    glide,
    PROBE_MIN_FRAMES,
    ramp,
    responseCompensationDb,
    type AudioRig,
} from "../engine/audio"
import {
    buildGrid,
    describeDistance,
    formatHz,
    gridHz,
    qFromBandwidth,
    speakHz,
} from "../engine/grid"
import { usablePassages } from "../engine/profile"
import type {
    Answer,
    GameAudio,
    GameSpec,
    LevelSpec,
    MakeRoundContext,
    Round,
} from "../engine/types"

export type EqMode = "boost" | "cut" | "mixed"
export type EqDepth = "gentle" | "normal" | "hard"

export interface EqSettings {
    mode: EqMode
    depth: EqDepth
}

/** One difficulty level. Add, remove or reorder these freely. */
export interface EqLevel extends LevelSpec {
    /**
     * How finely the frequency list is divided.
     *   1 = one option per octave      (100, 200, 400, 800 ...)
     *   2 = two options per octave     (100, 141, 200, 283 ...)
     *   3 = three options per octave, and so on.
     * Higher means more options and a harder level.
     */
    stepsPerOctave: number
    /** Lowest frequency that can be the correct answer, in hertz. */
    lowestAnswerHz: number
    /** Highest frequency that can be the correct answer, in hertz. */
    highestAnswerHz: number
    /** Points for a correct answer on this level. */
    pointsPerCorrectAnswer: number
}

export interface EqDepthOption {
    id: EqDepth
    /** Shown and spoken in the settings. */
    label: string
    /** How many decibels the frequency is boosted or cut by. */
    gainDb: number
}

export interface EqModeOption {
    id: EqMode
    label: string
}

export interface EqConfig {
    countInSeconds: number
    lives: number
    timeAttackSeconds: number
    roundLevelJitterDb: number
    trackHoldRounds: number
    trackStartEarliestFraction: number
    trackStartLatestFraction: number
    emptyBandThresholdDb: number
    quietPassageThresholdDb: number
    streakBonusPoints: number
    streakBonusCap: number
    defaultSettings: EqSettings
    modes: EqModeOption[]
    depths: EqDepthOption[]
    levels: EqLevel[]
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  EQ DETECTIVE — ALL SETTINGS IN ONE PLACE
 *
 *  Everything you can tune about this game lives in this one object. You do
 *  not need to read or change any of the code below it.
 *
 *  To add a difficulty level, copy one of the blocks in `levels`, paste it,
 *  and give it a new `id`. The settings page picks it up on its own.
 *
 *  Two things are worked out automatically and are deliberately NOT set
 *  here, because getting them wrong would silently break the game:
 *
 *  - The filter width (Q). It is always exactly one grid step wide, so a
 *    boost stays equally distinguishable from its neighbour on every level.
 *    Difficulty then comes from the number of options, not from the sound
 *    quietly getting harder to hear.
 *  - The loudness correction. Boosting a frequency also makes the whole
 *    track a little louder, which would let a player answer by volume
 *    instead of by ear, so it is measured and cancelled out per round.
 * ══════════════════════════════════════════════════════════════════════════
 */
export const EQ_CONFIG: EqConfig = {
    /** Seconds of untouched music before the filter switches on. */
    countInSeconds: 4,

    /** Wrong answers allowed in practice mode before the session ends. */
    lives: 3,

    /** Length of a time attack session, in seconds. */
    timeAttackSeconds: 60,

    /**
     * A small random volume change applied once per round, in decibels.
     * It is the second line of defence against answering by loudness
     * rather than by ear. Set it to 0 to switch it off.
     */
    roundLevelJitterDb: 1.5,

    /**
     * How many rounds in a row use the same piece of music. Changing the
     * track every round would stop players from building a feel for the
     * material, and forces a reload each time.
     */
    trackHoldRounds: 4,

    /**
     * Where in the track playback starts, as a fraction of its length.
     * A random point between the two, so players cannot recognise a round
     * by the intro of the music.
     */
    trackStartEarliestFraction: 0.05,
    trackStartLatestFraction: 0.65,

    /**
     * How far below a passage's median band a frequency band may sit and
     * still count as present, in decibels.
     *
     * Boosting a band the music does not contain changes nothing audible,
     * and the round becomes solvable only by elimination. Measured across
     * the bundled tracks, treble bands swing by up to 28 dB between
     * passages of the same track, and even 100 Hz drops by 30 dB in
     * places — so this is judged per passage, from the profiles built by
     * scripts/build-track-profiles.ts.
     *
     * Lower (more negative) allows quieter bands as answers and makes the
     * game harder; raise it towards -10 if rounds still feel unfair.
     */
    emptyBandThresholdDb: -18,

    /**
     * Passages quieter than this relative to the rest of the track are
     * skipped entirely, so a round never starts in a fade or a gap.
     */
    quietPassageThresholdDb: -15,

    /** Extra points per answer in a run of correct answers. */
    streakBonusPoints: 25,
    /** The streak length past which the bonus stops growing. */
    streakBonusCap: 4,

    /** What the settings page starts out with. */
    defaultSettings: { mode: "mixed", depth: "normal" },

    modes: [
        { id: "mixed", label: "Boost or cut, at random" },
        { id: "boost", label: "Boost only" },
        { id: "cut", label: "Cut only" },
    ],

    /**
     * Fewer decibels means a subtler change and a harder game. Below about
     * 3 dB it becomes very hard on real music.
     */
    depths: [
        { id: "gentle", label: "Gentle", gainDb: 12 },
        { id: "normal", label: "Normal", gainDb: 8 },
        { id: "hard", label: "Hard", gainDb: 5 },
    ],

    levels: [
        {
            id: 1,
            label: "Beginner",
            description: "whole octaves, the widest steps",
            stepsPerOctave: 1,
            lowestAnswerHz: 100,
            highestAnswerHz: 12800,
            pointsPerCorrectAnswer: 100,
            supportsTimeAttack: true,
        },
        {
            id: 2,
            label: "Intermediate",
            description: "half octaves, twice as many options",
            stepsPerOctave: 2,
            lowestAnswerHz: 100,
            highestAnswerHz: 12800,
            pointsPerCorrectAnswer: 200,
            supportsTimeAttack: true,
        },
        {
            id: 3,
            label: "Advanced",
            description: "third octaves",
            stepsPerOctave: 3,
            lowestAnswerHz: 100,
            highestAnswerHz: 12800,
            pointsPerCorrectAnswer: 300,
            supportsTimeAttack: true,
        },
        {
            id: 4,
            label: "Expert",
            description: "quarter octaves, the finest steps",
            stepsPerOctave: 4,
            lowestAnswerHz: 100,
            highestAnswerHz: 12800,
            pointsPerCorrectAnswer: 400,
            supportsTimeAttack: true,
        },
    ],
}

// ═══════════════════════════════════════════════════════════════════════════
//  Below this line is the game itself. Editing it is not needed for tuning.
// ═══════════════════════════════════════════════════════════════════════════

/** Fade length when a round's audio chain is swapped in or out. */
const TEARDOWN_SECONDS = 0.03

/** How long the outgoing chain stays connected so its fade can finish. */
const TEARDOWN_MS = 80

export interface EqParams {
    /** Grid index n. This, not the hertz value, is the answer identity. */
    gridIndex: number
    hz: number
    /** Signed: negative means a cut. */
    gainDb: number
    q: number
    stepsPerOctave: number
    points: number
}

function levelById(id: number): EqLevel {
    return (
        EQ_CONFIG.levels.find((level) => level.id === id) ?? EQ_CONFIG.levels[0]
    )
}

function depthById(id: EqDepth): EqDepthOption {
    return (
        EQ_CONFIG.depths.find((depth) => depth.id === id) ?? EQ_CONFIG.depths[0]
    )
}

function makeRound(context: MakeRoundContext<EqSettings>): Round<EqParams> {
    const level = levelById(context.level)
    const { stepsPerOctave } = level

    const grid = buildGrid(
        stepsPerOctave,
        context.sampleRate,
        level.lowestAnswerHz,
        level.highestAnswerHz,
    )
    const pool = grid.filter((point) => point.answerable)
    const magnitude = depthById(context.settings.depth).gainDb

    const boost =
        context.settings.mode === "mixed"
            ? context.rng.next() < 0.5
            : context.settings.mode === "boost"

    const others = context.tracks.filter(
        (track) => track !== context.previousTrack,
    )
    const keepTrack =
        context.previousTrack !== null &&
        (context.roundIndex % EQ_CONFIG.trackHoldRounds !== 0 ||
            others.length === 0)
    const track = keepTrack ? context.previousTrack! : context.rng.pick(others)

    // Frequency first, passage second. Picking the passage first and then
    // filtering would skew the frequencies towards whatever bands happen to
    // be common; this way every band the track can carry stays equally
    // likely, and only the stretch of music adapts.
    const passages = usablePassages(track.file, grid, stepsPerOctave, {
        thresholdDb: EQ_CONFIG.emptyBandThresholdDb,
        minLevelDb: EQ_CONFIG.quietPassageThresholdDb,
        earliestFraction: EQ_CONFIG.trackStartEarliestFraction,
        latestFraction: EQ_CONFIG.trackStartLatestFraction,
    })

    let target = pool[0]
    let offsetFraction =
        EQ_CONFIG.trackStartEarliestFraction +
        context.rng.next() *
            (EQ_CONFIG.trackStartLatestFraction -
                EQ_CONFIG.trackStartEarliestFraction)

    if (passages.length === 0) {
        // No profile for this track — a newly added file, or a checkout
        // without ffmpeg. Fall back to the old behaviour rather than break.
        target = context.rng.pick(pool)
    } else {
        const viable = [
            ...new Set(passages.flatMap((passage) => passage.gridIndices)),
        ]
        const chosen = context.rng.pick(viable)
        const withTarget = passages.filter((passage) =>
            passage.gridIndices.includes(chosen),
        )

        target = pool.find((point) => point.index === chosen) ?? pool[0]
        offsetFraction = context.rng.pick(withTarget).at
    }

    const q = qFromBandwidth(1 / stepsPerOctave, target.hz, context.sampleRate)
    const first = grid[0]
    const last = grid[grid.length - 1]

    return {
        key: `r${context.roundIndex}`,
        track,
        trackOffsetFraction: offsetFraction,
        variants: [
            { id: "flat", label: "Original" },
            {
                id: "eq",
                label: boost ? "Boosted" : "Cut",
                lockedDuringCountIn: true,
            },
        ],
        revealVariantId: "eq",
        steps: [
            {
                id: "frequency",
                prompt: boost
                    ? "Which frequency was boosted?"
                    : "Which frequency was cut?",
                // The screen reader announces the position within the group
                // by itself, so the only thing worth adding is the span the
                // list covers — useful to know before walking into it.
                help:
                    `${grid.length} options, from ${speakHz(first.hz)} ` +
                    `to ${speakHz(last.hz)}.`,
                options: grid.map((point) => ({
                    id: `n${point.index}`,
                    label: formatHz(point.hz),
                    speech: speakHz(point.hz),
                })),
            },
        ],
        correct: { frequency: `n${target.index}` },
        params: {
            gridIndex: target.index,
            hz: target.hz,
            gainDb: boost ? magnitude : -magnitude,
            q,
            stepsPerOctave,
            points: level.pointsPerCorrectAnswer,
        },
    }
}

/**
 * Switching between the two variants is a ramp on filter.gain within ONE
 * chain — deliberately not a crossfade between two.
 *
 * At gain 0 dB the peaking filter's A is 1, so b0 == a0, b1 == a1 and
 * b2 == a2: H(z) is bit exactly the identity. The reference state therefore
 * needs no second signal path, and every intermediate state of the ramp is
 * a valid minimum phase peaking filter. A dry/wet crossfade would sum a
 * phase rotated copy of the signal with itself at the 50/50 point, which is
 * a comb filter rather than a filter at half gain — and two parallel chains
 * have exactly the same problem.
 *
 * Swapping whole ROUNDS is a different matter and does fade, see dispose().
 */
function buildAudio(rig: AudioRig, round: Round<EqParams>): GameAudio {
    const { ctx } = rig
    const { hz, gainDb, q } = round.params

    const filter = new BiquadFilterNode(ctx, {
        type: "peaking",
        frequency: hz,
        Q: q,
        gain: 0,
    })
    const compensation = new GainNode(ctx, { gain: 1 })

    // A dedicated fade stage, separate from the loudness compensation, so a
    // round can be swapped in and out without a step in the signal.
    const fade = new GainNode(ctx, { gain: 0 })

    rig.source
        .connect(filter)
        .connect(compensation)
        .connect(fade)
        .connect(rig.sink)

    ramp(fade.gain, 1, ctx, TEARDOWN_SECONDS)

    let cachedDb: number | null = null

    /**
     * Without this, an 8 dB peak raises the broadband level by 0.3 to
     * 2.9 dB depending on where it sits — and the loudness JND is 0.5 to
     * 1 dB. The player would learn "clearly louder means a low answer" and
     * reliably pick the right half of the grid without ever hearing a
     * frequency.
     */
    function compensationDb(): number {
        if (cachedDb !== null) return cachedDb

        // A throwaway filter carrying the TARGET gain; the live filter is
        // still sitting at 0 dB while this is measured.
        const measured = new BiquadFilterNode(ctx, {
            type: "peaking",
            frequency: hz,
            Q: q,
            gain: gainDb,
        })

        const value = responseCompensationDb(rig.probe, measured)

        // Gated on frames since the TRACK changed, not on the probe's
        // lifetime count. The lifetime count passes permanently after the
        // first second of the first session, so gating on it would cache a
        // compensation computed from the previous track's spectrum and keep
        // it for the whole round — the exact loudness cue this is meant to
        // remove. Until the average has decayed into the new track the value
        // is still applied, just recomputed on every switch.
        if (rig.probe.sourceFrames() >= PROBE_MIN_FRAMES) cachedDb = value

        return value
    }

    return {
        setVariant(variantId: string, at: number) {
            const on = variantId !== "flat"

            glide(filter.gain, on ? gainDb : 0, ctx, at)
            glide(
                compensation.gain,
                on ? dbToGain(compensationDb()) : 1,
                ctx,
                at,
            )
        },
        dispose() {
            // Fade out before tearing down. React runs this cleanup and then
            // builds the next round's chain in the same commit, so a bare
            // disconnect would step the output from the boosted signal to the
            // flat one within a single sample — and in a listening game a
            // click is worse than noise, because it marks the exact moment of
            // the switch and masks the first milliseconds of the new round.
            // The incoming chain fades in over the same span, so the two
            // overlap as an equal gain crossfade rather than a jump.
            const at = ctx.currentTime

            glide(filter.gain, 0, ctx, at)
            ramp(fade.gain, 0, ctx, TEARDOWN_SECONDS, at)

            window.setTimeout(() => {
                try {
                    // Without this the filter stays attached to the probe
                    // output and leaks one node per round; the context is a
                    // never closed singleton, so nothing else releases it.
                    rig.source.disconnect(filter)
                } catch {
                    // Already detached — disconnect(node) throws then.
                }

                filter.disconnect()
                compensation.disconnect()
                fade.disconnect()
            }, TEARDOWN_MS)
        },
    }
}

function judge(round: Round<EqParams>, given: Answer) {
    const chosen = given.frequency
    const correct = chosen === round.correct.frequency

    const { gridIndex, stepsPerOctave, gainDb, hz, points } = round.params
    const chosenIndex = Number(chosen.slice(1))
    const direction = gainDb > 0 ? "boosted" : "cut"
    const target = speakHz(hz)

    return {
        correct,
        perStep: { frequency: correct },
        points: correct ? points : 0,
        speech: correct
            ? `Correct. ${target} was ${direction}.`
            : `Wrong. You chose ` +
              `${speakHz(gridHz(chosenIndex, stepsPerOctave))}, but ` +
              `${target} was ${direction} — ` +
              `${describeDistance(chosenIndex - gridIndex, stepsPerOctave)}.`,
    }
}

export function createEqDetective(): GameSpec<EqParams, EqSettings> {
    return {
        id: "eq-detective",
        name: "EQ Detective",
        levels: EQ_CONFIG.levels,
        defaultSettings: EQ_CONFIG.defaultSettings,
        countInSeconds: EQ_CONFIG.countInSeconds,
        lives: EQ_CONFIG.lives,
        levelJitterDb: EQ_CONFIG.roundLevelJitterDb,
        streakBonusPoints: EQ_CONFIG.streakBonusPoints,
        streakBonusCap: EQ_CONFIG.streakBonusCap,
        makeRound,
        buildAudio,
        judge,
        summarise({ rounds, correct, score, bestStreak, reason }) {
            const percent =
                rounds === 0 ? 0 : Math.round((correct / rounds) * 100)

            // Naming the reason matters: without it a session that ended
            // because the lives ran out is indistinguishable from one the
            // player ended on purpose.
            const prefix =
                reason === "time"
                    ? "Time is up. "
                    : reason === "lives"
                      ? "No lives left. "
                      : ""

            if (rounds === 0)
                return `${prefix}Training finished. No answers given.`

            return (
                `${prefix}Training finished after ${rounds} ` +
                `${rounds === 1 ? "round" : "rounds"}. ` +
                `${correct} correct, ${percent} percent. ` +
                `Score ${score}. Best streak ${bestStreak}.`
            )
        },
    }
}
