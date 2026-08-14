import type { Rng } from "./types"

/**
 * Seeded PRNG (mulberry32). The reducer must stay pure: React StrictMode
 * invokes reducers twice to surface impurity, so the random state lives in
 * the reducer state and is threaded through explicitly.
 */
export function createRng(seed: number): Rng {
    let a = seed >>> 0

    const next = (): number => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    return {
        next,
        int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
        pick<T>(items: readonly T[]): T {
            if (items.length === 0)
                throw new Error("pick() was called with an empty list")
            return items[Math.floor(next() * items.length)]
        },
        state: () => a,
    }
}

export function randomSeed(): number {
    return (Date.now() ^ (Math.random() * 0x100000000)) >>> 0
}

/** The frequency grid is anchored on 100 Hz: f(n) = 100 * 2^(n / stepsPerOctave). */
const ANCHOR_HZ = 100

/** Guards against floating point noise at the window boundaries. */
const EPSILON = 1e-9

export interface GridPoint {
    /** n in f(n) = 100 * 2^(n / stepsPerOctave). This is the answer identity. */
    index: number
    hz: number
    /** False for the buffer entries that can never be the correct answer. */
    answerable: boolean
}

export function gridHz(index: number, stepsPerOctave: number): number {
    return ANCHOR_HZ * Math.pow(2, index / stepsPerOctave)
}

/**
 * Builds the answer grid for one level.
 *
 * Exactly one buffer option sits below and above the answerable range. The
 * buffers exist so the correct answer never sits at the edge of the list,
 * where it could be found by elimination rather than by ear — and they are
 * never marked as such, because labelling them would give the same thing
 * away. One step is enough; more just adds dead options to navigate past.
 *
 * This reproduces the observed SoundGym behaviour exactly: at half octave
 * spacing the list runs 71, 100, 141 ... 12800, 18102, which is seventeen
 * options with fifteen of them answerable.
 *
 * The window is derived from the live sample rate, never hard coded. A
 * BiquadFilterNode clamps its frequency to [0, Nyquist], and at exactly
 * Nyquist sin(w0) is 0, alpha is 0 and b equals a — the filter becomes a
 * silent identity with no error and no warning, which would produce an
 * unsolvable round. Bluetooth headsets in HFP mode force 16 kHz contexts,
 * and that is exactly the hardware this audience tends to use.
 */
export function buildGrid(
    stepsPerOctave: number,
    sampleRate: number,
    minAnswerHz = 100,
    maxAnswerHz = 12800,
): GridPoint[] {
    const displayHighHz = 0.42 * sampleRate
    const answerHighHz = Math.min(maxAnswerHz, 0.3 * sampleRate)

    const firstAnswer = Math.ceil(
        stepsPerOctave * Math.log2(minAnswerHz / ANCHOR_HZ) - EPSILON,
    )

    let lastAnswer = Math.floor(
        stepsPerOctave * Math.log2(answerHighHz / ANCHOR_HZ) + EPSILON,
    )

    // The upper buffer still has to fit inside the display window, so a
    // low sample rate walks the answerable top down rather than showing an
    // option above Nyquist.
    while (
        lastAnswer > firstAnswer &&
        gridHz(lastAnswer + 1, stepsPerOctave) > displayHighHz
    ) {
        lastAnswer -= 1
    }

    const points: GridPoint[] = []

    for (let index = firstAnswer - 1; index <= lastAnswer + 1; index++) {
        points.push({
            index,
            hz: gridHz(index, stepsPerOctave),
            answerable: index >= firstAnswer && index <= lastAnswer,
        })
    }

    return points
}

/**
 * Converts a bandwidth in octaves into the Q value of a peaking filter.
 *
 * The `w0 / sin(w0)` term is the bilinear transform correction and is not
 * optional: the analog approximation that is quoted everywhere is off by
 * 26 % at 8 kHz and by 140 % at 16 kHz. Q also depends on the centre
 * frequency, so this must be recomputed per filter instance and can never
 * be stored as a per-level constant.
 *
 * Note that Q is linear for peaking, bandpass, notch and allpass, but is
 * given in decibels for lowpass and highpass, and ignored by the shelves.
 */
export function qFromBandwidth(
    bwOctaves: number,
    f0: number,
    sampleRate: number,
): number {
    const w0 = (2 * Math.PI * f0) / sampleRate
    const correction = w0 / Math.sin(w0)

    return 1 / (2 * Math.sinh((Math.LN2 / 2) * bwOctaves * correction))
}

/** Visible form: "800 Hz", "1.6 kHz". */
export function formatHz(hz: number): string {
    if (hz < 1000) return `${Math.round(hz)} Hz`

    const khz = hz / 1000
    const text = (khz >= 10 ? khz.toFixed(1) : khz.toFixed(2)).replace(
        /\.?0+$/,
        "",
    )

    return `${text} kHz`
}

/**
 * Spoken form. Always spells out the full hertz value and never uses "kHz",
 * which screen readers pronounce inconsistently and sometimes spell out.
 */
export function speakHz(hz: number): string {
    return `${Math.round(hz)} hertz`
}

const COUNT_WORDS = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
]

function countWord(n: number): string {
    return n < COUNT_WORDS.length ? COUNT_WORDS[n] : String(n)
}

/**
 * Describes how far a guess was from the target, in grid steps. This is the
 * actual teaching content of a wrong answer — "one octave too high" tells
 * the player something, "wrong" does not.
 *
 * Only computable from the grid index, which is why options carry ids and
 * why answers are never compared against a live AudioParam value.
 */
export function describeDistance(
    steps: number,
    stepsPerOctave: number,
): string {
    if (steps === 0) return "spot on"

    const direction = steps > 0 ? "too high" : "too low"
    const distance = Math.abs(steps)

    if (distance === stepsPerOctave) return `one octave ${direction}`

    if (distance % stepsPerOctave === 0)
        return `${countWord(distance / stepsPerOctave)} octaves ${direction}`

    if (distance === 1) return `one step ${direction}, very close`

    return `${countWord(distance)} steps ${direction}`
}
