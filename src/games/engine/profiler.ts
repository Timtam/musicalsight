/**
 * The track analysis itself, shared by the build script and the browser.
 *
 * `scripts/build-track-profiles.ts` runs this over ffmpeg's output to produce
 * the bundled `track-profiles.json`; `profiler.worker.ts` runs the very same
 * functions over a file the player dropped in. One implementation, because two
 * would drift and the games cannot tell whose numbers they are holding.
 *
 * Nothing here touches the filesystem, the DOM or Web Audio. Decoding is the
 * one genuinely platform-specific step and stays with the caller: ffmpeg in
 * Node, decodeAudioData in the browser. Those two were checked against each
 * other and agree bit for bit — same frame count, channel RMS equal to
 * 0.000 dB — so what arrives here is the same audio either way.
 */

/**
 * Anchored on 100 Hz like the game's answer grid, so a game band at
 * 100 * 2^(k / stepsPerOctave) always covers a whole number of profile
 * bands: 12 at one option per octave, 6 at two, 4 at three, 3 at four.
 * No interpolation anywhere.
 */
export const ANCHOR_HZ = 100
export const BANDS_PER_OCTAVE = 12
export const FIRST_BAND = -15 // ~42 Hz
export const LAST_BAND = 87 // ~15.2 kHz

export const SAMPLE_RATE = 48000
export const WINDOW_SECONDS = 8

/**
 * Large on purpose. The bin spacing is sampleRate / FFT_SIZE, and a twelfth
 * octave band at 100 Hz is only 5.8 Hz wide — at 4096 points the spacing is
 * 11.7 Hz and not a single bin lands inside it, so the whole bass range
 * measures as empty. At 32768 the spacing is 1.5 Hz and the narrowest band
 * the games can ask about holds several bins.
 */
export const FFT_SIZE = 32768

/** Spectra averaged per window. More than this buys no accuracy. */
export const FRAMES_PER_WINDOW = 12

export const FLOOR_DB = -80
export const CEILING_DB = 40

/** Bumped whenever the stored shape changes. Version 2 added sideRatio. */
export const PROFILE_VERSION = 2

export interface TrackWindow {
    /** Where the window starts, as a fraction of the track duration. */
    at: number
    /** Window loudness relative to the track's median window, in decibels. */
    levelDb: number
    /** Per band, in decibels relative to this window's median band. */
    bands: number[]
    /**
     * Side energy over mid energy in this window, as a plain ratio.
     *
     * What the stereo games need and the bands cannot tell them: whether this
     * stretch of music has a stereo image at all. Measured across the bundled
     * tracks it runs from 0.008 to 0.78.
     */
    sideRatio: number
}

export interface TrackProfile {
    durationSeconds: number
    /** Integrated loudness per EBU R128, or null when it could not be had. */
    lufs: number | null
    windows: TrackWindow[]
}

/** In-place iterative radix-2 FFT. */
export function fft(re: Float64Array, im: Float64Array): void {
    const n = re.length

    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1

        for (; j & bit; bit >>= 1) j ^= bit
        j ^= bit

        if (i < j) {
            const tr = re[i]
            re[i] = re[j]
            re[j] = tr

            const ti = im[i]
            im[i] = im[j]
            im[j] = ti
        }
    }

    for (let len = 2; len <= n; len <<= 1) {
        const angle = (-2 * Math.PI) / len
        const wr = Math.cos(angle)
        const wi = Math.sin(angle)

        for (let i = 0; i < n; i += len) {
            let cr = 1
            let ci = 0

            for (let k = 0; k < len / 2; k++) {
                const a = i + k
                const b = a + len / 2
                const vr = re[b] * cr - im[b] * ci
                const vi = re[b] * ci + im[b] * cr

                re[b] = re[a] - vr
                im[b] = im[a] - vi
                re[a] += vr
                im[a] += vi

                const nr = cr * wr - ci * wi
                ci = cr * wi + ci * wr
                cr = nr
            }
        }
    }
}

export function hannWindow(size: number): Float64Array {
    const w = new Float64Array(size)

    for (let i = 0; i < size; i++) {
        w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1))
    }

    return w
}

export function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)

    return sorted[Math.floor(sorted.length / 2)] ?? 0
}

export function toDb(value: number, reference: number): number {
    if (value <= 0 || reference <= 0) return FLOOR_DB

    const db = 10 * Math.log10(value / reference)

    return Math.max(FLOOR_DB, Math.min(CEILING_DB, Math.round(db)))
}

function bandEdges(): { lo: number; hi: number }[] {
    const edges: { lo: number; hi: number }[] = []
    const halfStep = Math.pow(2, 1 / (2 * BANDS_PER_OCTAVE))

    for (let n = FIRST_BAND; n <= LAST_BAND; n++) {
        const centre = ANCHOR_HZ * Math.pow(2, n / BANDS_PER_OCTAVE)

        edges.push({ lo: centre / halfStep, hi: centre * halfStep })
    }

    return edges
}

/**
 * The bins that make up each band, resolved once.
 *
 * A band narrower than the bin spacing would otherwise contain nothing and
 * measure as silent, so such a band falls back to its single nearest bin.
 * That is an approximation, but a defensible one — and vastly better than
 * reporting an empty band, which would make the games avoid a frequency
 * that is in fact perfectly audible.
 */
export function bandBins(): number[][] {
    const binHz = (k: number) => (k * SAMPLE_RATE) / FFT_SIZE
    const lastBin = FFT_SIZE / 2 - 1

    return bandEdges().map(({ lo, hi }) => {
        const bins: number[] = []
        const from = Math.max(1, Math.ceil(lo / binHz(1)))
        const to = Math.min(lastBin, Math.floor(hi / binHz(1)))

        for (let k = from; k <= to; k++) {
            if (binHz(k) >= lo && binHz(k) < hi) bins.push(k)
        }

        if (bins.length > 0) return bins

        const centre = Math.sqrt(lo * hi)
        const nearest = Math.max(
            1,
            Math.min(lastBin, Math.round(centre / binHz(1))),
        )

        return [nearest]
    })
}

/**
 * Integrated loudness per EBU R128 / ITU-R BS.1770.
 *
 * Written out rather than shelled out to ffmpeg, so the browser can measure
 * what the build script measures. Checked against `ffmpeg -af ebur128` on all
 * seven bundled tracks: identical to the reported tenth of a LU on every one,
 * with the relative gate landing within 0.02 LU.
 *
 * The one thing worth stating, because getting it wrong costs exactly 0.691
 * and looks plausible: the -0.691 offset belongs to the loudness SCALE. It
 * turns one mean square into one number in LUFS. Applying it per block and
 * then again when averaging those blocks subtracts it twice.
 */
export function integratedLoudness(
    channels: readonly Float32Array[],
    sampleRate: number = SAMPLE_RATE,
): number | null {
    if (channels.length === 0 || channels[0].length === 0) return null

    // K-weighting: a high shelf for the head, then a high-pass. Coefficients
    // are the BS.1770 ones for 48 kHz.
    const biquad = (
        x: Float32Array | Float64Array,
        b: readonly number[],
        a: readonly number[],
    ): Float64Array => {
        const y = new Float64Array(x.length)
        let x1 = 0
        let x2 = 0
        let y1 = 0
        let y2 = 0

        for (let i = 0; i < x.length; i++) {
            const v =
                b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2

            x2 = x1
            x1 = x[i]
            y2 = y1
            y1 = v
            y[i] = v
        }

        return y
    }

    const weighted = channels.map((channel) =>
        biquad(
            biquad(
                channel,
                [1.53512485958697, -2.69169618940638, 1.19839281085285],
                [1, -1.69065929318241, 0.73248077421585],
            ),
            [1, -2, 1],
            [1, -1.99004745483398, 0.99007225036621],
        ),
    )

    const block = Math.round(0.4 * sampleRate)
    const hop = Math.round(0.1 * sampleRate)

    if (weighted[0].length < block) return null

    // Mean square per block, NOT loudness — see the note above.
    const energies: number[] = []

    for (let start = 0; start + block <= weighted[0].length; start += hop) {
        let z = 0

        for (const channel of weighted) {
            let sum = 0

            for (let i = start; i < start + block; i++)
                sum += channel[i] * channel[i]

            z += sum / block
        }

        energies.push(z)
    }

    const toLufs = (z: number) =>
        z > 0 ? -0.691 + 10 * Math.log10(z) : -Infinity
    const meanLufs = (zs: number[]) =>
        toLufs(zs.reduce((a, b) => a + b, 0) / zs.length)

    // Absolute gate at -70 LUFS, then a relative gate 10 LU below what is
    // left. Silence and fades must not drag the figure down.
    const above = energies.filter((z) => toLufs(z) > -70)

    if (above.length === 0) return null

    const relative = meanLufs(above) - 10
    const gated = above.filter((z) => toLufs(z) > relative)

    return Math.round(meanLufs(gated.length > 0 ? gated : above) * 10) / 10
}

/**
 * Side over mid energy per window, on the same grid as the band analysis so
 * the two line up index for index.
 *
 * A mono file, or a window with no signal, reports 0 — which reads as "no
 * stereo image here" and is exactly right.
 */
export function sideRatios(
    left: Float32Array,
    right: Float32Array | null,
    monoLength: number,
    sampleRate: number = SAMPLE_RATE,
): number[] {
    const windowLength = WINDOW_SECONDS * sampleRate
    const ratios: number[] = []

    for (
        let start = 0;
        start + windowLength <= monoLength;
        start += windowLength
    ) {
        let midEnergy = 0
        let sideEnergy = 0

        for (let i = start; i < start + windowLength; i++) {
            const l = left[i] ?? 0
            const r = right ? (right[i] ?? 0) : l
            const mid = (l + r) / 2
            const side = (l - r) / 2

            midEnergy += mid * mid
            sideEnergy += side * side
        }

        ratios.push(midEnergy > 0 ? sideEnergy / midEnergy : 0)
    }

    return ratios
}

/**
 * The mono sum the band analysis runs on.
 *
 * `(L + R) / 2`, and the convention matters: ffmpeg's own `-ac 1` downmix is
 * 3.010 dB — exactly the square root of two — louder than this. It makes no
 * difference to anything stored here, because `bands`, `levelDb` and
 * `sideRatio` are all relative quantities, but it would to anything absolute.
 * So both callers go through this function rather than each rolling their own.
 */
export function toMono(
    left: Float32Array,
    right: Float32Array | null,
): Float32Array {
    if (!right) return left

    const mono = new Float32Array(left.length)

    for (let i = 0; i < left.length; i++) mono[i] = (left[i] + right[i]) / 2

    return mono
}

/** The whole per-window analysis, given already decoded 48 kHz audio. */
export function profileChannels(
    left: Float32Array,
    right: Float32Array | null,
    sampleRate: number = SAMPLE_RATE,
): TrackProfile {
    const mono = toMono(left, right)
    const sides = sideRatios(left, right, mono.length, sampleRate)

    const hann = hannWindow(FFT_SIZE)
    const bins = bandBins()
    const windowLength = WINDOW_SECONDS * sampleRate
    const duration = mono.length / sampleRate

    const raw: { at: number; total: number; bands: number[] }[] = []
    const spectrum = new Float64Array(FFT_SIZE / 2)
    const re = new Float64Array(FFT_SIZE)
    const im = new Float64Array(FFT_SIZE)

    for (
        let start = 0;
        start + windowLength <= mono.length;
        start += windowLength
    ) {
        spectrum.fill(0)

        const hop = Math.max(
            FFT_SIZE,
            Math.floor((windowLength - FFT_SIZE) / FRAMES_PER_WINDOW),
        )

        let frames = 0

        for (
            let offset = start;
            offset + FFT_SIZE <= start + windowLength;
            offset += hop
        ) {
            for (let i = 0; i < FFT_SIZE; i++) {
                re[i] = mono[offset + i] * hann[i]
                im[i] = 0
            }

            fft(re, im)

            for (let k = 1; k < FFT_SIZE / 2; k++) {
                spectrum[k] += re[k] * re[k] + im[k] * im[k]
            }

            frames++
        }

        if (frames === 0) continue

        const bands = bins.map((group) => {
            let sum = 0

            for (const k of group) sum += spectrum[k]

            return sum / frames
        })

        raw.push({
            at: start / mono.length,
            total: bands.reduce((sum, value) => sum + value, 0),
            bands,
        })
    }

    const medianTotal = median(raw.map((w) => w.total))

    return {
        durationSeconds: Math.round(duration),
        lufs: integratedLoudness(right ? [left, right] : [left], sampleRate),
        windows: raw.map((w, i) => {
            // Relative to this window's own median band, so the numbers say
            // nothing about mastering level and everything about balance.
            const reference = median(w.bands)

            return {
                at: +w.at.toFixed(4),
                levelDb: toDb(w.total, medianTotal),
                bands: w.bands.map((value) => toDb(value, reference)),
                sideRatio: +(sides[i] ?? 0).toFixed(4),
            }
        }),
    }
}

/** The shortest track the window grid can say anything about. */
export function isLongEnough(seconds: number): boolean {
    return seconds >= WINDOW_SECONDS
}
