import {
    crossfadeVariants,
    dbToGain,
    ramp,
    type AudioRig,
} from "../engine/audio"
import { loudPassages } from "../engine/profile"
import type {
    Answer,
    GameAudio,
    GameSpec,
    LevelSpec,
    MakeRoundContext,
    Round,
    Verdict,
} from "../engine/types"

/** What the round asks about. */
export type CompAsk = "which" | "ratio"

export interface CompSettings {
    ask: CompAsk
}

/** One difficulty level. Add, remove or reorder these freely. */
export interface CompLevel extends LevelSpec {
    /** Where the compressor starts working, in dBFS. */
    thresholdDb: number
    /** How hard it squeezes in a "which one" round. */
    ratio: number
    /** The answers offered in a "how hard" round. 1 means untouched. */
    ratioOptions: number[]
    pointsPerCorrectAnswer: number
}

export interface CompAskOption {
    id: CompAsk
    label: string
    description: string
}

export interface CompConfig {
    countInSeconds: number
    lives: number
    timeAttackSeconds: number
    roundLevelJitterDb: number
    trackHoldRounds: number
    trackStartEarliestFraction: number
    trackStartLatestFraction: number
    quietPassageThresholdDb: number
    attackSeconds: number
    releaseSeconds: number
    kneeDb: number
    variantsInWhichRound: number
    streakBonusPoints: number
    streakBonusCap: number
    defaultSettings: CompSettings
    asks: CompAskOption[]
    levels: CompLevel[]
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  DYNAMICS — ALL SETTINGS IN ONE PLACE
 *
 *  Everything you can tune about this game lives in this one object. You do
 *  not need to read or change any of the code below it.
 *
 *  To add a difficulty level, copy one of the blocks in `levels`, paste it,
 *  and give it a new `id`. The settings page picks it up on its own.
 *
 *  One thing is worked out automatically and is deliberately NOT set here:
 *  the makeup gain. Compression moves the level, and "the odd one out is the
 *  odd level" would be the whole game — so every variant is measured against
 *  the untouched one and corrected. See makeupGains().
 *
 *  Which DIRECTION it moves is not knowable in advance, and that is the
 *  reason this is measured rather than calculated. DynamicsCompressorNode
 *  applies a makeup of its own that the spec does not describe and no
 *  property reports: measured in Chrome, a 20:1 chain at -40 dB came out
 *  2.54 dB LOUDER than the untouched one while reporting 17 dB of gain
 *  reduction. Any correction derived from threshold and ratio would have
 *  pushed it further the wrong way.
 * ══════════════════════════════════════════════════════════════════════════
 */
export const COMP_CONFIG: CompConfig = {
    /**
     * Seconds before the answer becomes available.
     *
     * Longer than the other games on purpose. The loudness match is measured
     * during this window, and it has to be finished early rather than merely
     * by the end: in a "which one" round the answers ARE the listening
     * control, and they can be reached while the count-in is still running.
     */
    countInSeconds: 6,

    /** Wrong answers allowed in practice mode before the session ends. */
    lives: 3,

    /** Length of a time attack session, in seconds. */
    timeAttackSeconds: 60,

    /** A small random volume change applied once per round, in decibels. */
    roundLevelJitterDb: 1.5,

    /** How many rounds in a row use the same piece of music. */
    trackHoldRounds: 4,

    /** Where in the track playback starts, as a fraction of its length. */
    trackStartEarliestFraction: 0.05,
    trackStartLatestFraction: 0.65,

    /** Passages quieter than this relative to the track are skipped. */
    quietPassageThresholdDb: -15,

    /**
     * Fast attack and fast release, which is what makes compression audible
     * rather than tasteful.
     *
     * Both SoundGym's game and the notes taken from it use a short attack and
     * release deliberately: a slow compressor mostly rides the level, while a
     * fast one pumps, dulls transients and pulls the room up between hits —
     * the three cues a player is actually being taught to hear.
     */
    attackSeconds: 0.003,
    releaseSeconds: 0.05,

    /**
     * A harder knee than the node's default of 30 dB, which is so soft that
     * a 4:1 ratio barely announces itself.
     */
    kneeDb: 6,

    /**
     * How many sounds a "which one" round offers.
     *
     * Three, where SoundGym uses two. Two is a coin toss, and worse, it
     * cannot be built honestly here: the shell renders a two-variant round as
     * a single checkbox, which is right for "original versus processed" but
     * wrong for "which of these is it", where neither is the reference.
     */
    variantsInWhichRound: 3,

    /** Extra points per answer in a run of correct answers. */
    streakBonusPoints: 25,
    /** The streak length past which the bonus stops growing. */
    streakBonusCap: 4,

    /** What the settings page starts out with. */
    defaultSettings: { ask: "which" },

    asks: [
        {
            id: "which",
            label: "Which one",
            description:
                "three sounds, one of them compressed — say which, the way Dr. Compressor asks it",
        },
        {
            id: "ratio",
            label: "How hard",
            description:
                "the untouched music and a compressed version — say what ratio was used",
        },
    ],

    /**
     * Difficulty is how much the compressor actually does, which is the
     * threshold and the ratio together: a 20:1 ratio does nothing if the
     * threshold sits above the music, and a threshold far below it flattens
     * everything even at 2:1.
     *
     * The ratio lists get longer AND closer together as the levels go up, so
     * the later ones ask for a real reading rather than "a lot or a little".
     * 1:1 is on every list and means the compressor did nothing — the same
     * job "no change" does in Gain Trainer.
     */
    levels: [
        {
            id: 1,
            label: "Beginner",
            description: "heavy compression, three answers apart",
            thresholdDb: -40,
            ratio: 20,
            ratioOptions: [1, 4, 20],
            pointsPerCorrectAnswer: 100,
            supportsTimeAttack: true,
        },
        {
            id: 2,
            label: "Intermediate",
            description: "still obvious, five answers",
            thresholdDb: -32,
            ratio: 12,
            ratioOptions: [1, 2, 4, 8, 20],
            pointsPerCorrectAnswer: 150,
            supportsTimeAttack: true,
        },
        {
            id: 3,
            label: "Advanced",
            description: "moderate compression, eight answers",
            thresholdDb: -24,
            ratio: 6,
            ratioOptions: [1, 2, 3, 4, 6, 8, 12, 20],
            pointsPerCorrectAnswer: 200,
            supportsTimeAttack: true,
        },
        {
            id: 4,
            label: "Expert",
            description: "gentle compression, the finest answers",
            thresholdDb: -18,
            ratio: 3,
            ratioOptions: [1, 1.5, 2, 3, 4, 6, 8, 12, 20],
            pointsPerCorrectAnswer: 250,
            supportsTimeAttack: true,
        },
    ],
}

// ═══════════════════════════════════════════════════════════════════════════
//  Below here is the game itself.
// ═══════════════════════════════════════════════════════════════════════════

/** Fade length when a round's audio chain is swapped in or out. */
const TEARDOWN_SECONDS = 0.03

/** How long the outgoing chain stays connected so its fade can finish. */
const TEARDOWN_MS = 80

/**
 * Analyser window for the per-variant level measurement.
 *
 * The largest the node allows, and worth it: 32768 samples is 0.68 s of audio
 * per read, where the 2048 this started with was 43 ms — shorter than the
 * compressor's own release, so each reading depended on which drum hit it
 * happened to land on. A bigger window means the match is both steadier and
 * ready sooner, which matters because the answers double as the listening
 * control and can be reached during the count-in.
 */
const LEVEL_FFT = 32768

/** How often the per-variant level is sampled while the count-in runs. */
const SAMPLE_MS = 150

/**
 * Readings to collect before the makeup gains are set.
 *
 * Ten readings at 150 ms covers about two and a half seconds of music with
 * overlap, and lands the match roughly 1.5 s into a 6 s count-in — before a
 * player who reaches straight for the answers can hear an unmatched chain.
 */
const MIN_SAMPLES = 10

/**
 * How far the whole game sits below everything else.
 *
 * Two reasons, both about the makeup gain. It raises a compressed variant
 * back to the untouched one's level, and the round jitter — applied by the
 * rig's trim, AFTER this chain — can add 1.5 dB on top of that. The extra
 * 1.5 dB is slack for the makeup itself: it is measured over a few seconds of
 * music and the passage that follows can be louder than the passage measured.
 */
const HEADROOM_DB = 3

export interface CompParams {
    ask: CompAsk
    /** One per variant, in the same order as round.variants. 1 is untouched. */
    ratios: number[]
    /**
     * Which LABEL carries the compression — Sound A is 0, B is 1, C is 2.
     *
     * Not a position in `ratios`: that array follows the variants order,
     * which is shuffled so an untouched sound leads the count-in.
     */
    compressedIndex: number
    thresholdDb: number
    attackSeconds: number
    releaseSeconds: number
    kneeDb: number
    /** The ratio that was applied. Also the answer in a "how hard" round. */
    answerRatio: number
    points: number
}

function levelById(id: number): CompLevel {
    return (
        COMP_CONFIG.levels.find((level) => level.id === id) ??
        COMP_CONFIG.levels[0]
    )
}

/** "r40" for 4.0:1. Stable across rounds, and safe in an element id. */
export function ratioId(ratio: number): string {
    return `r${Math.round(ratio * 10)}`
}

function ratioFromId(id: string): number {
    return Number(id.slice(1)) / 10
}

/** Visible: "1:1 (untouched)", "4:1". */
export function formatRatio(ratio: number): string {
    const value = Number.isInteger(ratio) ? String(ratio) : ratio.toFixed(1)

    return ratio === 1 ? "1:1 (untouched)" : `${value}:1`
}

/** Spoken. "4:1" would be read as a time, a date or a fraction. */
export function speakRatio(ratio: number): string {
    const value = Number.isInteger(ratio) ? String(ratio) : ratio.toFixed(1)

    return ratio === 1 ? "no compression" : `${value} to 1`
}

/** How wrong a wrong ratio was, said the way a player thinks about it. */
export function describeRatioGap(chosen: number, correct: number): string {
    if (chosen === 1) return "there was compression, and you heard none"
    if (correct === 1) return "nothing was compressed"

    return chosen > correct ? "harder than it was" : "gentler than it was"
}

/** Sound A, Sound B, Sound C. */
function variantLabel(index: number): string {
    return `Sound ${String.fromCharCode(65 + index)}`
}

function variantId(index: number): string {
    return `v${index}`
}

function makeRound(context: MakeRoundContext<CompSettings>): Round<CompParams> {
    const level = levelById(context.level)
    const ask = context.settings.ask

    const others = context.tracks.filter(
        (track) => track !== context.previousTrack,
    )
    const keepTrack =
        context.previousTrack !== null &&
        (context.roundIndex % COMP_CONFIG.trackHoldRounds !== 0 ||
            others.length === 0)
    const track = keepTrack ? context.previousTrack! : context.rng.pick(others)

    const passages = loudPassages(track.file, {
        minLevelDb: COMP_CONFIG.quietPassageThresholdDb,
        earliestFraction: COMP_CONFIG.trackStartEarliestFraction,
        latestFraction: COMP_CONFIG.trackStartLatestFraction,
    })

    const offsetFraction =
        passages.length > 0
            ? context.rng.pick(passages)
            : COMP_CONFIG.trackStartEarliestFraction +
              context.rng.next() *
                  (COMP_CONFIG.trackStartLatestFraction -
                      COMP_CONFIG.trackStartEarliestFraction)

    const shared = {
        key: `r${context.roundIndex}`,
        track,
        trackOffsetFraction: offsetFraction,
        thresholdDb: level.thresholdDb,
        attackSeconds: COMP_CONFIG.attackSeconds,
        releaseSeconds: COMP_CONFIG.releaseSeconds,
        kneeDb: COMP_CONFIG.kneeDb,
        points: level.pointsPerCorrectAnswer,
    }

    if (ask === "ratio") {
        const answerRatio = context.rng.pick(level.ratioOptions)

        return {
            key: shared.key,
            track,
            trackOffsetFraction: offsetFraction,
            variants: [
                { id: "v0", label: "Untouched" },
                { id: "v1", label: "Compressed", lockedDuringCountIn: true },
            ],
            revealVariantId: "v1",
            steps: [
                {
                    id: "ratio",
                    prompt: "How hard was it compressed?",
                    help:
                        `${level.ratioOptions.length} options, from no ` +
                        `compression to ${speakRatio(
                            level.ratioOptions[level.ratioOptions.length - 1],
                        )}. The threshold is fixed at ` +
                        `${level.thresholdDb} decibels, so the ratio is the ` +
                        `only thing that changes. No compression is one of ` +
                        `the answers.`,
                    options: level.ratioOptions.map((ratio) => ({
                        id: ratioId(ratio),
                        label: formatRatio(ratio),
                        speech: speakRatio(ratio),
                    })),
                },
            ],
            correct: { ratio: ratioId(answerRatio) },
            params: {
                ask,
                ratios: [1, answerRatio],
                compressedIndex: 1,
                thresholdDb: shared.thresholdDb,
                attackSeconds: shared.attackSeconds,
                releaseSeconds: shared.releaseSeconds,
                kneeDb: shared.kneeDb,
                answerRatio,
                points: shared.points,
            },
        }
    }

    const count = Math.max(2, COMP_CONFIG.variantsInWhichRound)
    const compressedIndex = context.rng.int(count)
    const labels = Array.from({ length: count }, (_, i) => i)

    /**
     * The order of the VARIANTS array, which is not the order of the labels.
     *
     * The engine plays `variants[0]` through the count-in, so whatever sits
     * at the front is what the player hears before the question opens. Left
     * as A, B, C that means one round in three opens on the compressed sound
     * — and opens on it before the loudness match has been measured, which is
     * the one moment it is at its natural level.
     *
     * So an untouched one always leads. Putting the compressed one anywhere
     * but the front is not an option either: "Sound A is never the answer"
     * would be the whole game. The labels therefore stay where they were
     * drawn, and only the array is reordered around them.
     *
     * Nothing leaks. Both untouched variants are the same chain at ratio 1
     * and therefore bit-identical, so "this one matches what I heard during
     * the count-in" is true of both of them — which is the task, not a
     * shortcut through it.
     */
    const lead = context.rng.pick(labels.filter((i) => i !== compressedIndex))
    const order = [lead, ...labels.filter((i) => i !== lead)]

    return {
        key: shared.key,
        track,
        trackOffsetFraction: offsetFraction,
        variants: order.map((i) => ({
            id: variantId(i),
            label: variantLabel(i),
        })),
        // Stays on the untouched sound the count-in established, so opening
        // the question is not itself an event.
        revealVariantId: variantId(lead),
        steps: [
            {
                id: "which",
                prompt: "Listen, then say which sound was compressed",
                help:
                    `${count} sounds, all the same music. One of them went ` +
                    `through a ${speakRatio(level.ratio)} compressor at ` +
                    `${level.thresholdDb} decibels; the others are untouched, ` +
                    `and so is the music you heard during the count-in. ` +
                    `Choosing a sound plays it, so listen your way through ` +
                    `them and leave the one you mean selected. They are ` +
                    `matched for loudness, so listen for the transients and ` +
                    `for the room coming up between them, not for the level.`,
                options: labels.map((i) => ({
                    id: variantId(i),
                    label: variantLabel(i),
                    // The third interaction shape the engine provides, and the
                    // first game to use it: picking an answer also switches
                    // playback to it.
                    auditions: variantId(i),
                })),
            },
        ],
        correct: { which: variantId(compressedIndex) },
        params: {
            ask,
            // In VARIANTS order, because buildAudio pairs these with the
            // chains one to one and the shell finds a chain by its position
            // in round.variants.
            ratios: order.map((i) => (i === compressedIndex ? level.ratio : 1)),
            compressedIndex,
            thresholdDb: shared.thresholdDb,
            attackSeconds: shared.attackSeconds,
            releaseSeconds: shared.releaseSeconds,
            kneeDb: shared.kneeDb,
            answerRatio: level.ratio,
            points: shared.points,
        },
    }
}

/**
 * The makeup gains that put every variant at the same loudness.
 *
 * Compression turns the loud parts down, so without this the compressed
 * variant is simply the quiet one and the game is over before it starts. The
 * correction cannot be computed from the settings — how much a compressor
 * actually takes off depends on the music — so it is measured: every chain
 * runs in parallel throughout the count-in, muted but processing, and each
 * one's mean square is read at the end of it.
 *
 * Referenced to the untouched chain rather than to a fixed target, so an
 * untouched variant is left at exactly 1 and only the processed ones move.
 */
function makeupGains(
    energies: readonly number[],
    ratios: readonly number[],
): number[] {
    const referenceIndex = ratios.findIndex((ratio) => ratio === 1)
    const reference =
        referenceIndex >= 0
            ? energies[referenceIndex]
            : Math.max(...energies, 0)

    return energies.map((energy) => {
        if (!(reference > 0) || !(energy > 0)) return 1

        return Math.sqrt(reference / energy)
    })
}

/**
 * N parallel chains and a crossfade — the shape the engine was designed
 * around, and the first game to need it.
 *
 * EQ Detective, Gain Trainer and Stereo Field all take the documented
 * exception: at 0 dB a peaking filter, at 1 a gain and at full width a
 * mid/side network are each the exact identity, so one chain and a parameter
 * ramp does the job. A compressor has no such setting. Ratio 1 is
 * transparent, but getting there from ratio 20 means dragging the node's own
 * envelope along with it, and the sound during the change is neither variant.
 *
 * Hence the invariant, and why the untouched variants are the SAME node at
 * ratio 1 rather than a bare wire: DynamicsCompressorNode reports a
 * latency it does not let you query, so a bare wire would be ahead of the
 * compressed chain by a few milliseconds. Crossfading between two copies of
 * the same music a few milliseconds apart is a comb filter, and it would
 * mark every switch far more clearly than any amount of compression.
 */
function buildAudio(rig: AudioRig, round: Round<CompParams>): GameAudio {
    const { ctx } = rig
    const { ratios, thresholdDb, attackSeconds, releaseSeconds, kneeDb } =
        round.params

    const headroom = new GainNode(ctx, { gain: dbToGain(-HEADROOM_DB) })
    const fade = new GainNode(ctx, { gain: 0 })

    rig.source.connect(headroom)
    fade.connect(rig.sink)
    ramp(fade.gain, 1, ctx, TEARDOWN_SECONDS)

    const chains = ratios.map((ratio) => {
        const compressor = new DynamicsCompressorNode(ctx, {
            threshold: thresholdDb,
            knee: kneeDb,
            ratio,
            attack: attackSeconds,
            release: releaseSeconds,
        })
        const makeup = new GainNode(ctx, { gain: 1 })
        const level = new GainNode(ctx, { gain: 0 })
        const analyser = new AnalyserNode(ctx, { fftSize: LEVEL_FFT })

        headroom.connect(compressor)
        compressor.connect(makeup).connect(level).connect(fade)
        // Measured BEFORE the makeup, so the reading is what the compressor
        // did rather than what the correction already undid.
        compressor.connect(analyser)

        return {
            compressor,
            makeup,
            level,
            analyser,
            buffer: new Float32Array(analyser.fftSize),
        }
    })

    /**
     * Accumulated energy per chain, and how many readings went into it.
     *
     * Sampling starts the moment the chain exists and runs through the whole
     * count-in, so the gains are already right when the first sound becomes
     * audible. Measuring at the reveal instead — the obvious place, and where
     * this began — is too late in a way that hands over the answer: the
     * analysers are still empty at that instant, so the first thing the player
     * hears is the compressed variant at its natural level, which is to say
     * the quiet one.
     */
    const energies = chains.map(() => 0)

    let samples = 0
    let matched = false

    function sample(): void {
        let usable = false

        chains.forEach((chain, i) => {
            chain.analyser.getFloatTimeDomainData(chain.buffer)

            let sum = 0

            for (let k = 0; k < chain.buffer.length; k++)
                sum += chain.buffer[k] * chain.buffer[k]

            if (sum > 0) usable = true

            energies[i] += sum
        })

        // Silence says nothing about anything. The track is still loading, or
        // the passage starts quiet; either way the reading is not evidence.
        if (usable) samples += 1
    }

    /**
     * Set once, then held for the whole round — deliberately not tracked.
     *
     * A tracking version was built and measured against this one, and it was
     * no better: over forty seconds of real music the per-moment level
     * difference between a compressed and an untouched chain has a median of
     * 1.3 dB whether it is corrected statically, corrected continuously, or
     * left alone entirely. That difference is not an error to be removed. It
     * IS the compression — a signal with less dynamic range is quieter under
     * the peaks and louder between them — and a correction fast enough to
     * flatten it would be a second compressor undoing the first.
     *
     * What a correction genuinely fixes is the long-run offset, and that one
     * is worth fixing: measured across two tracks at three playback levels it
     * ran from -6.5 dB to +8.5 dB, changing sign along the way. A static
     * match removes it exactly, and leaves the moment-to-moment difference
     * the player is supposed to be listening to.
     */
    function applyMatch(at: number): void {
        if (matched || samples === 0) return

        makeupGains(energies, ratios).forEach((gain, i) => {
            ramp(chains[i].makeup.gain, gain, ctx, TEARDOWN_SECONDS, at)
        })

        matched = true
    }

    const timer = window.setInterval(() => {
        sample()

        if (samples < MIN_SAMPLES) return

        // Only the count-in is audible at this point, and it plays the first
        // variant, whose makeup is 1 by construction — so the moment the
        // gains land is silent for the player.
        applyMatch(ctx.currentTime)
        window.clearInterval(timer)
    }, SAMPLE_MS)

    return {
        setVariant(id: string, at: number) {
            // A safety net, not the normal path: if a round somehow reaches
            // its reveal before enough readings exist, matching on whatever
            // has been gathered still beats handing over the answer.
            applyMatch(at)

            const index = Math.max(
                0,
                round.variants.findIndex((variant) => variant.id === id),
            )

            crossfadeVariants(
                chains.map((chain) => chain.level),
                index,
                ctx,
                at,
            )
        },
        dispose() {
            const at = ctx.currentTime

            window.clearInterval(timer)
            ramp(fade.gain, 0, ctx, TEARDOWN_SECONDS, at)

            window.setTimeout(() => {
                try {
                    rig.source.disconnect(headroom)
                } catch {
                    // Already detached.
                }

                for (const chain of chains) {
                    chain.compressor.disconnect()
                    chain.makeup.disconnect()
                    chain.level.disconnect()
                    chain.analyser.disconnect()
                }

                headroom.disconnect()
                fade.disconnect()
            }, TEARDOWN_MS)
        },
    }
}

function judge(round: Round<CompParams>, given: Answer): Verdict {
    const { ask, answerRatio, points, ratios } = round.params

    if (ask === "ratio") {
        const chosen = ratioFromId(given.ratio)
        const correct = given.ratio === round.correct.ratio

        return {
            correct,
            perStep: { ratio: correct },
            points: correct ? points : 0,
            speech: correct
                ? answerRatio === 1
                    ? "Correct. Nothing was compressed."
                    : `Correct. ${speakRatio(answerRatio)}.`
                : `Wrong. You chose ${speakRatio(chosen)}, but it was ` +
                  `${speakRatio(answerRatio)} — ` +
                  `${describeRatioGap(chosen, answerRatio)}.`,
        }
    }

    const correct = given.which === round.correct.which
    const answer = variantLabel(round.params.compressedIndex)

    return {
        correct,
        perStep: { which: correct },
        points: correct ? points : 0,
        speech: correct
            ? `Correct. ${answer} was the compressed one, at ` +
              `${speakRatio(answerRatio)}.`
            : `Wrong. It was ${answer}, at ${speakRatio(answerRatio)}.`,
    }
}

export function createDynamics(): GameSpec<CompParams, CompSettings> {
    return {
        id: "dynamics",
        name: "Dynamics",
        levels: COMP_CONFIG.levels,
        defaultSettings: COMP_CONFIG.defaultSettings,
        countInSeconds: COMP_CONFIG.countInSeconds,
        lives: COMP_CONFIG.lives,
        levelJitterDb: COMP_CONFIG.roundLevelJitterDb,
        streakBonusPoints: COMP_CONFIG.streakBonusPoints,
        streakBonusCap: COMP_CONFIG.streakBonusCap,
        makeRound,
        buildAudio,
        judge,
        summarise({ rounds, correct, score, bestStreak, reason }) {
            const percent =
                rounds === 0 ? 0 : Math.round((correct / rounds) * 100)

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
