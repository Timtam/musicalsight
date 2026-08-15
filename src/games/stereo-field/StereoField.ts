import { glide, ramp, type AudioRig } from "../engine/audio"
import { loudPassages, stereoPassages } from "../engine/profile"
import type {
    Answer,
    GameAudio,
    GameSpec,
    LevelSpec,
    MakeRoundContext,
    Round,
    Verdict,
} from "../engine/types"

/** What the round asks about. Two genuinely different questions. */
export type StereoAsk = "position" | "width"

export interface StereoSettings {
    ask: StereoAsk
}

/** One difficulty level. Add, remove or reorder these freely. */
export interface StereoLevel extends LevelSpec {
    /** Gap between neighbouring pan answers, in percent of hard left/right. */
    positionStepPercent: number
    /** Gap between neighbouring width answers, in percent. */
    widthStepPercent: number
    pointsPerCorrectAnswer: number
}

export interface StereoAskOption {
    id: StereoAsk
    label: string
    /** Shown under the choice, so the two questions cannot be confused. */
    description: string
}

export interface StereoConfig {
    countInSeconds: number
    lives: number
    timeAttackSeconds: number
    roundLevelJitterDb: number
    trackHoldRounds: number
    trackStartEarliestFraction: number
    trackStartLatestFraction: number
    quietPassageThresholdDb: number
    /** Least side-to-mid energy a width round accepts. See the config. */
    minSideRatio: number
    streakBonusPoints: number
    streakBonusCap: number
    defaultSettings: StereoSettings
    asks: StereoAskOption[]
    levels: StereoLevel[]
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  STEREO FIELD — ALL SETTINGS IN ONE PLACE
 *
 *  Everything you can tune about this game lives in this one object. You do
 *  not need to read or change any of the code below it.
 *
 *  To add a difficulty level, copy one of the blocks in `levels`, paste it,
 *  and give it a new `id`. The settings page picks it up on its own.
 *
 *  Two things are worked out automatically and are deliberately NOT set here:
 *
 *  - The loudness correction for width. Narrowing an image makes it quieter,
 *    by an amount that depends on the music, and a player would answer by
 *    volume instead of by image. It is measured per round and cancelled.
 *  - The panning law. A mono source panned by StereoPannerNode is already
 *    constant power; the mono fold in front of it is what makes that true.
 * ══════════════════════════════════════════════════════════════════════════
 */
export const STEREO_CONFIG: StereoConfig = {
    /**
     * Seconds before the change is revealed.
     *
     * Not "seconds of unchanged music": in a position round the fold to mono
     * is already in place during the count-in, so what the player hears is a
     * centred point from the very first second. Only where that point sits
     * changes afterwards.
     */
    countInSeconds: 4,

    /** Wrong answers allowed in practice mode before the session ends. */
    lives: 3,

    /** Length of a time attack session, in seconds. */
    timeAttackSeconds: 60,

    /**
     * A small random volume change applied once per round, in decibels.
     * Both variants pass through it, so it moves the pair together and the
     * image itself is untouched.
     */
    roundLevelJitterDb: 1.5,

    /** How many rounds in a row use the same piece of music. */
    trackHoldRounds: 4,

    /** Where in the track playback starts, as a fraction of its length. */
    trackStartEarliestFraction: 0.05,
    trackStartLatestFraction: 0.65,

    /** Passages quieter than this relative to the track are skipped. */
    quietPassageThresholdDb: -15,

    /**
     * The least side-to-mid energy a width round will accept in a passage.
     *
     * This is the width game's version of EQ Detective's empty-band rule, and
     * it is every bit as necessary. A stretch that is already close to mono
     * has nothing to narrow: every answer sounds the same and the round is
     * decided by luck. Measured across the bundled tracks, 47 of 157 passages
     * fall below this — three of the seven are near-mono for most of their
     * length — so without it almost a third of width rounds would be unfair.
     *
     * Raise it for rounds with a more obvious image and fewer of them to
     * choose from; the count that survives is printed by the profile build.
     */
    minSideRatio: 0.02,

    /** Extra points per answer in a run of correct answers. */
    streakBonusPoints: 25,
    /** The streak length past which the bonus stops growing. */
    streakBonusCap: 4,

    /** What the settings page starts out with. */
    defaultSettings: { ask: "position" },

    asks: [
        {
            id: "position",
            label: "Position",
            description:
                "the music plays as a single point throughout, and moves from the centre to somewhere between hard left and hard right",
        },
        {
            id: "width",
            label: "Width",
            description:
                "the music keeps its own stereo image, and that image is squeezed towards the middle",
        },
    ],

    /**
     * Both questions are answered on a percentage scale, and difficulty is
     * the gap between neighbouring answers — the same reasoning as Gain
     * Trainer, for the same reason: the ear's resolution for a position or a
     * width does not change with the number of choices on offer.
     *
     * Position runs from 100 left through centre to 100 right, so it always
     * has roughly twice as many options as width at the same step.
     */
    levels: [
        {
            id: 1,
            label: "Beginner",
            description: "the widest steps",
            positionStepPercent: 50,
            widthStepPercent: 25,
            pointsPerCorrectAnswer: 100,
            supportsTimeAttack: true,
        },
        {
            id: 2,
            label: "Intermediate",
            description: "half as far apart",
            positionStepPercent: 25,
            widthStepPercent: 20,
            pointsPerCorrectAnswer: 150,
            supportsTimeAttack: true,
        },
        {
            id: 3,
            label: "Advanced",
            description: "fine steps",
            positionStepPercent: 20,
            widthStepPercent: 10,
            pointsPerCorrectAnswer: 200,
            supportsTimeAttack: true,
        },
        {
            id: 4,
            label: "Expert",
            description: "the finest steps",
            positionStepPercent: 10,
            widthStepPercent: 5,
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

/** Analyser window for the mid/side energy measurement. */
const BALANCE_FFT = 2048

export interface StereoParams {
    ask: StereoAsk
    /** -100 hard left .. 0 centre .. +100 hard right. Position rounds. */
    positionPercent: number
    /** 0 mono .. 100 the track's own image. Width rounds. */
    widthPercent: number
    points: number
}

function levelById(id: number): StereoLevel {
    return (
        STEREO_CONFIG.levels.find((level) => level.id === id) ??
        STEREO_CONFIG.levels[0]
    )
}

/** Every pan answer this level offers, hard left first, centre included. */
export function buildPositionLadder(level: StereoLevel): number[] {
    const values: number[] = []
    const step = level.positionStepPercent

    for (let v = -100; v <= 100; v = Math.round((v + step) * 100) / 100)
        values.push(v)

    if (!values.includes(0)) values.push(0)

    return values.sort((a, b) => a - b)
}

/** Every width answer this level offers, mono first. */
export function buildWidthLadder(level: StereoLevel): number[] {
    const values: number[] = []
    const step = level.widthStepPercent

    for (let v = 0; v <= 100; v = Math.round((v + step) * 100) / 100)
        values.push(v)

    if (!values.includes(100)) values.push(100)

    return values.sort((a, b) => a - b)
}

/** "l50", "c", "r100" / "w0", "w55". Stable across rounds. */
export function positionId(percent: number): string {
    if (percent === 0) return "c"

    return `${percent < 0 ? "l" : "r"}${Math.round(Math.abs(percent))}`
}

export function widthId(percent: number): string {
    return `w${Math.round(percent * 10)}`
}

/** Visible: "L50", "Centre", "R100". */
export function formatPosition(percent: number): string {
    if (percent === 0) return "Centre"

    return `${percent < 0 ? "L" : "R"}${Math.abs(percent)}`
}

/** Spoken. "L50" would be read as a letter and a number, or spelled out. */
export function speakPosition(percent: number): string {
    if (percent === 0) return "centre"
    if (Math.abs(percent) === 100)
        return `hard ${percent < 0 ? "left" : "right"}`

    return `${Math.abs(percent)} percent ${percent < 0 ? "left" : "right"}`
}

/** Visible: "0% (mono)", "60%", "100% (full)". */
export function formatWidth(percent: number): string {
    if (percent === 0) return "0% (mono)"
    if (percent === 100) return "100% (full)"

    return `${percent}%`
}

export function speakWidth(percent: number): string {
    if (percent === 0) return "mono"
    if (percent === 100) return "full width"

    return `${percent} percent wide`
}

/** How wrong a wrong answer was, in the unit the player was thinking in. */
export function describePositionGap(chosen: number, correct: number): string {
    const gap = Math.abs(chosen - correct)

    if (
        Math.sign(chosen) !== Math.sign(correct) &&
        chosen !== 0 &&
        correct !== 0
    )
        return `you had the wrong side, ${gap} percent out`

    return `${gap} percent ${Math.abs(chosen) > Math.abs(correct) ? "too far out" : "too near the middle"}`
}

export function describeWidthGap(chosen: number, correct: number): string {
    const gap = Math.abs(chosen - correct)

    return `${gap} percent too ${chosen > correct ? "wide" : "narrow"}`
}

function makeRound(
    context: MakeRoundContext<StereoSettings>,
): Round<StereoParams> {
    const level = levelById(context.level)
    const ask = context.settings.ask

    const window = {
        minLevelDb: STEREO_CONFIG.quietPassageThresholdDb,
        earliestFraction: STEREO_CONFIG.trackStartEarliestFraction,
        latestFraction: STEREO_CONFIG.trackStartLatestFraction,
    }

    const passagesOf = (file: string) =>
        ask === "width"
            ? stereoPassages(file, {
                  ...window,
                  minSideRatio: STEREO_CONFIG.minSideRatio,
              })
            : loudPassages(file, window)

    // The TRACK has to be chosen against the same test as the passage, not
    // just the passage within it. Three of the seven bundled tracks are
    // near-mono almost throughout — landing on one of those for a width round
    // leaves two usable passages out of seventeen, and picking the track
    // first would keep returning to them.
    const usable = context.tracks.filter(
        (candidate) => passagesOf(candidate.file).length > 0,
    )
    const pool = usable.length > 0 ? usable : context.tracks

    const others = pool.filter((track) => track !== context.previousTrack)
    const keepTrack =
        context.previousTrack !== null &&
        pool.includes(context.previousTrack) &&
        (context.roundIndex % STEREO_CONFIG.trackHoldRounds !== 0 ||
            others.length === 0)
    const track = keepTrack ? context.previousTrack! : context.rng.pick(others)

    const passages = passagesOf(track.file)

    const offsetFraction =
        passages.length > 0
            ? context.rng.pick(passages)
            : STEREO_CONFIG.trackStartEarliestFraction +
              context.rng.next() *
                  (STEREO_CONFIG.trackStartLatestFraction -
                      STEREO_CONFIG.trackStartEarliestFraction)

    const common = {
        key: `r${context.roundIndex}`,
        track,
        trackOffsetFraction: offsetFraction,
        points: level.pointsPerCorrectAnswer,
    }

    if (ask === "width") {
        const ladder = buildWidthLadder(level)
        const widthPercent = context.rng.pick(ladder)

        return {
            ...common,
            variants: [
                { id: "flat", label: "The track's own width" },
                { id: "changed", label: "Changed", lockedDuringCountIn: true },
            ],
            revealVariantId: "changed",
            steps: [
                {
                    id: "width",
                    prompt: "How wide is the image now?",
                    help:
                        `${ladder.length} options, from mono to full width, ` +
                        `in steps of ${level.widthStepPercent} percent. ` +
                        `Full width is the track as it was recorded, and it ` +
                        `is one of the answers.`,
                    options: ladder.map((percent) => ({
                        id: widthId(percent),
                        label: formatWidth(percent),
                        speech: speakWidth(percent),
                    })),
                },
            ],
            correct: { width: widthId(widthPercent) },
            params: {
                ask,
                positionPercent: 0,
                widthPercent,
                points: common.points,
            },
        }
    }

    const ladder = buildPositionLadder(level)
    const positionPercent = context.rng.pick(ladder)

    return {
        ...common,
        variants: [
            { id: "flat", label: "Centred" },
            { id: "changed", label: "Moved", lockedDuringCountIn: true },
        ],
        revealVariantId: "changed",
        steps: [
            {
                id: "position",
                prompt: "Where is the sound now?",
                help:
                    `${ladder.length} options, from hard left through centre ` +
                    `to hard right, in steps of ${level.positionStepPercent} ` +
                    `percent. Centre is one of them.`,
                options: ladder.map((percent) => ({
                    id: positionId(percent),
                    label: formatPosition(percent),
                    speech: speakPosition(percent),
                })),
            },
        ],
        correct: { position: positionId(positionPercent) },
        params: {
            ask,
            positionPercent,
            widthPercent: 100,
            points: common.points,
        },
    }
}

/**
 * Measures how much of the source is mid and how much is side.
 *
 * Only two numbers are needed, not a spectrum, so this is a pair of analysers
 * read in the time domain rather than anything as involved as the engine's
 * SpectrumProbe.
 */
function createBalanceProbe(
    ctx: BaseAudioContext,
    mid: AudioNode,
    side: AudioNode,
) {
    const midAnalyser = new AnalyserNode(ctx, { fftSize: BALANCE_FFT })
    const sideAnalyser = new AnalyserNode(ctx, { fftSize: BALANCE_FFT })
    const midBuffer = new Float32Array(midAnalyser.fftSize)
    const sideBuffer = new Float32Array(sideAnalyser.fftSize)

    mid.connect(midAnalyser)
    side.connect(sideAnalyser)

    function meanSquare(
        analyser: AnalyserNode,
        buffer: Float32Array<ArrayBuffer>,
    ): number {
        analyser.getFloatTimeDomainData(buffer)

        let sum = 0

        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]

        return sum / buffer.length
    }

    return {
        energies() {
            return {
                mid: meanSquare(midAnalyser, midBuffer),
                side: meanSquare(sideAnalyser, sideBuffer),
            }
        },
        dispose() {
            try {
                mid.disconnect(midAnalyser)
            } catch {
                // Already detached.
            }
            try {
                side.disconnect(sideAnalyser)
            } catch {
                // Already detached.
            }
            midAnalyser.disconnect()
            sideAnalyser.disconnect()
        },
    }
}

/**
 * The gain that keeps total power constant as the width changes.
 *
 * out(L) = M + wS and out(R) = M - wS, so the total power is
 *
 *     |M + wS|² + |M - wS|²  =  2|M|² + 2w²|S|²
 *
 * — the cross terms cancel EXACTLY, whatever the correlation between mid and
 * side happens to be. That is what makes this a correction rather than a
 * model: no assumption about the material enters it. Referencing to w = 1
 * gives the factor below.
 *
 * Without it, narrowing towards mono drops the level by an amount that
 * depends on how much side signal the passage carries, and the player would
 * answer "quieter means narrower" without ever hearing an image.
 */
export function widthCompensation(
    midEnergy: number,
    sideEnergy: number,
    width: number,
): number {
    const reference = midEnergy + sideEnergy
    const current = midEnergy + width * width * sideEnergy

    if (!(reference > 0) || !(current > 0)) return 1

    return Math.sqrt(reference / current)
}

function buildAudio(rig: AudioRig, round: Round<StereoParams>): GameAudio {
    const { ctx } = rig
    const { ask, positionPercent, widthPercent } = round.params

    // A dedicated fade stage, so a round can be swapped in and out without a
    // step in the signal.
    const fade = new GainNode(ctx, { gain: 0 })

    fade.connect(rig.sink)
    ramp(fade.gain, 1, ctx, TEARDOWN_SECONDS)

    if (ask === "position") {
        /**
         * The fold to mono is not a simplification, it is the question. A
         * finished stereo mix is already spread across the field, so "where
         * is it" has no answer until it is collapsed to a point.
         *
         * It is CONSTANT, not part of the change: both variants run through
         * it and so does the count-in, so the player hears a centred point
         * from the first second and only its place moves. Making the fold
         * part of the reveal would put a second, much louder difference on
         * top of the one being asked about.
         *
         * It also makes the panner safe. StereoPannerNode is constant power
         * for a MONO input — the spec's mono path is cos/sin — but with a
         * stereo input at pan -1 it sums both channels into the left one, up
         * to 6 dB louder, which would be a level cue pointing straight at the
         * answer. Downmixing first removes that case entirely.
         */
        const mono = new GainNode(ctx, {
            gain: 1,
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers",
        })
        const panner = new StereoPannerNode(ctx, { pan: 0 })

        rig.source.connect(mono).connect(panner).connect(fade)

        return {
            setVariant(variantId: string, at: number) {
                glide(
                    panner.pan,
                    variantId === "flat" ? 0 : positionPercent / 100,
                    ctx,
                    at,
                )
            },
            dispose() {
                const at = ctx.currentTime

                glide(panner.pan, 0, ctx, at)
                ramp(fade.gain, 0, ctx, TEARDOWN_SECONDS, at)

                window.setTimeout(() => {
                    try {
                        rig.source.disconnect(mono)
                    } catch {
                        // Already detached.
                    }

                    mono.disconnect()
                    panner.disconnect()
                    fade.disconnect()
                }, TEARDOWN_MS)
            },
        }
    }

    /**
     * Mid/side, built by hand because Web Audio has no node for it.
     *
     *     M = (L + R) / 2        out(L) = M + wS
     *     S = (L - R) / 2        out(R) = M - wS
     *
     * At w = 1 that reconstructs L and R exactly, so "full width" is the
     * track untouched and needs no second signal path — the same reason
     * EQ Detective and Gain Trainer each use one chain and a parameter ramp.
     */
    const splitter = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 })
    const merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 })

    const mid = new GainNode(ctx, { gain: 1 })
    const side = new GainNode(ctx, { gain: 1 })

    const midFromLeft = new GainNode(ctx, { gain: 0.5 })
    const midFromRight = new GainNode(ctx, { gain: 0.5 })
    const sideFromLeft = new GainNode(ctx, { gain: 0.5 })
    const sideFromRight = new GainNode(ctx, { gain: -0.5 })

    // The width control and the loudness correction are separate stages on
    // purpose: one is the question, the other cancels a side effect of it,
    // and folding them into a single gain would hide which is which.
    //
    // The correction sits AFTER the merge, deliberately. Putting it on the
    // side path alone would rescale the level by changing the mid/side
    // balance — that is, by changing the very thing being asked about.
    const width = new GainNode(ctx, { gain: 1 })
    const negated = new GainNode(ctx, { gain: -1 })
    const compensation = new GainNode(ctx, { gain: 1 })

    rig.source.connect(splitter)

    splitter.connect(midFromLeft, 0).connect(mid)
    splitter.connect(midFromRight, 1).connect(mid)
    splitter.connect(sideFromLeft, 0).connect(side)
    splitter.connect(sideFromRight, 1).connect(side)

    side.connect(width)

    // out(L) = M + wS
    mid.connect(merger, 0, 0)
    width.connect(merger, 0, 0)

    // out(R) = M - wS
    mid.connect(merger, 0, 1)
    width.connect(negated).connect(merger, 0, 1)

    merger.connect(compensation).connect(fade)

    const balance = createBalanceProbe(ctx, mid, side)

    let cached: number | null = null

    function compensationGain(target: number): number {
        if (target === 1) return 1
        if (cached !== null) return cached

        const { mid: m, side: s } = balance.energies()

        // A silent analyser window says nothing; leave the correction at 1
        // and try again on the next switch rather than cache a guess.
        if (m + s <= 0) return 1

        cached = widthCompensation(m, s, target)

        return cached
    }

    return {
        setVariant(variantId: string, at: number) {
            const target = variantId === "flat" ? 1 : widthPercent / 100

            glide(width.gain, target, ctx, at)
            glide(compensation.gain, compensationGain(target), ctx, at)
        },
        dispose() {
            const at = ctx.currentTime

            glide(width.gain, 1, ctx, at)
            glide(compensation.gain, 1, ctx, at)
            ramp(fade.gain, 0, ctx, TEARDOWN_SECONDS, at)

            window.setTimeout(() => {
                balance.dispose()

                try {
                    rig.source.disconnect(splitter)
                } catch {
                    // Already detached.
                }

                for (const node of [
                    splitter,
                    merger,
                    mid,
                    side,
                    midFromLeft,
                    midFromRight,
                    sideFromLeft,
                    sideFromRight,
                    width,
                    negated,
                    compensation,
                    fade,
                ])
                    node.disconnect()
            }, TEARDOWN_MS)
        },
    }
}

/**
 * The spoken forms are lower case because almost every use of them is
 * mid-sentence ("you chose hard left"). The one place that is not is the
 * verdict opening, so it gets its capital here rather than by keeping a
 * second, capitalised copy of every label.
 */
function opensSentence(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function percentFromPositionId(id: string): number {
    if (id === "c") return 0

    const magnitude = Number(id.slice(1))

    return id.startsWith("l") ? -magnitude : magnitude
}

function percentFromWidthId(id: string): number {
    return Number(id.slice(1)) / 10
}

function judge(round: Round<StereoParams>, given: Answer): Verdict {
    const { ask, positionPercent, widthPercent, points } = round.params

    if (ask === "width") {
        const chosen = percentFromWidthId(given.width)
        const correct = given.width === round.correct.width

        return {
            correct,
            perStep: { width: correct },
            points: correct ? points : 0,
            speech: correct
                ? `Correct. ${opensSentence(speakWidth(widthPercent))}.`
                : `Wrong. You chose ${speakWidth(chosen)}, but it was ` +
                  `${speakWidth(widthPercent)} — ` +
                  `${describeWidthGap(chosen, widthPercent)}.`,
        }
    }

    const chosen = percentFromPositionId(given.position)
    const correct = given.position === round.correct.position

    return {
        correct,
        perStep: { position: correct },
        points: correct ? points : 0,
        speech: correct
            ? `Correct. ${opensSentence(speakPosition(positionPercent))}.`
            : `Wrong. You chose ${speakPosition(chosen)}, but it was ` +
              `${speakPosition(positionPercent)} — ` +
              `${describePositionGap(chosen, positionPercent)}.`,
    }
}

export function createStereoField(): GameSpec<StereoParams, StereoSettings> {
    return {
        id: "stereo-field",
        name: "Stereo Field",
        levels: STEREO_CONFIG.levels,
        defaultSettings: STEREO_CONFIG.defaultSettings,
        countInSeconds: STEREO_CONFIG.countInSeconds,
        lives: STEREO_CONFIG.lives,
        levelJitterDb: STEREO_CONFIG.roundLevelJitterDb,
        streakBonusPoints: STEREO_CONFIG.streakBonusPoints,
        streakBonusCap: STEREO_CONFIG.streakBonusCap,
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
