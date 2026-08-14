/**
 * Measures what each training track actually contains, so the games never
 * ask about a frequency that is not there.
 *
 * The problem this solves: boosting 12.8 kHz by 8 dB does nothing audible in
 * a passage that has no content up there, and the round becomes solvable
 * only by elimination. Measured across the bundled tracks, the treble bands
 * swing by up to 28 dB between passages of the SAME track — so a per-track
 * average is not enough, and this profiles every passage separately.
 *
 * Run through ffmpeg, which must be on PATH. Without it the script writes an
 * empty profile and warns; the games then fall back to their previous
 * behaviour of allowing every band.
 *
 * Output is generated, gitignored and rebuilt by prestart/prebuild, exactly
 * like src/catalog.json.
 */
import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"

const TRACKS_DIR = "./tracks"
const OUTPUT = "./src/track-profiles.json"

/**
 * Anchored on 100 Hz like the game's answer grid, so a game band at
 * 100 * 2^(k / stepsPerOctave) always covers a whole number of profile
 * bands: 12 at one option per octave, 6 at two, 4 at three, 3 at four.
 * No interpolation anywhere.
 */
const ANCHOR_HZ = 100
const BANDS_PER_OCTAVE = 12
const FIRST_BAND = -15 // ~42 Hz
const LAST_BAND = 87 // ~15.2 kHz

const SAMPLE_RATE = 48000
const WINDOW_SECONDS = 8

/**
 * Large on purpose. The bin spacing is sampleRate / FFT_SIZE, and a twelfth
 * octave band at 100 Hz is only 5.8 Hz wide — at 4096 points the spacing is
 * 11.7 Hz and not a single bin lands inside it, so the whole bass range
 * measures as empty. At 32768 the spacing is 1.5 Hz and the narrowest band
 * the games can ask about holds several bins.
 */
const FFT_SIZE = 32768

/** Spectra averaged per window. More than this buys no accuracy. */
const FRAMES_PER_WINDOW = 12

const FLOOR_DB = -80
const CEILING_DB = 40

const AUDIO_EXTENSIONS = [".opus", ".ogg", ".mp3", ".flac", ".wav", ".m4a"]

export interface TrackWindow {
    /** Where the window starts, as a fraction of the track duration. */
    at: number
    /** Window loudness relative to the track's median window, in decibels. */
    levelDb: number
    /** Per band, in decibels relative to this window's median band. */
    bands: number[]
}

export interface TrackProfile {
    durationSeconds: number
    windows: TrackWindow[]
}

export interface TrackProfiles {
    version: number
    anchorHz: number
    bandsPerOctave: number
    firstBand: number
    lastBand: number
    windowSeconds: number
    /** Keyed by file name, matching the `file` field in src/assets.ts. */
    tracks: Record<string, TrackProfile>
}

/** In-place iterative radix-2 FFT. */
function fft(re: Float64Array, im: Float64Array): void {
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

function hannWindow(size: number): Float64Array {
    const w = new Float64Array(size)

    for (let i = 0; i < size; i++) {
        w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1))
    }

    return w
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)

    return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function toDb(value: number, reference: number): number {
    if (value <= 0 || reference <= 0) return FLOOR_DB

    const db = 10 * Math.log10(value / reference)

    return Math.max(FLOOR_DB, Math.min(CEILING_DB, Math.round(db)))
}

/** Decodes to mono float32 PCM. Rejects if ffmpeg is missing or fails. */
function decode(file: string): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
        const child = spawn(
            "ffmpeg",
            [
                "-v",
                "error",
                "-i",
                file,
                "-ac",
                "1",
                "-ar",
                String(SAMPLE_RATE),
                "-f",
                "f32le",
                "-",
            ],
            { stdio: ["ignore", "pipe", "pipe"] },
        )

        const chunks: Buffer[] = []
        let stderr = ""

        child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk))
        child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()))
        child.on("error", reject)
        child.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(stderr.trim() || `ffmpeg exited with ${code}`))
                return
            }

            const merged = Buffer.concat(chunks)

            resolve(
                new Float32Array(
                    merged.buffer,
                    merged.byteOffset,
                    Math.floor(merged.byteLength / 4),
                ),
            )
        })
    })
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
function bandBins(edges: { lo: number; hi: number }[]): number[][] {
    const binHz = (k: number) => (k * SAMPLE_RATE) / FFT_SIZE
    const lastBin = FFT_SIZE / 2 - 1

    return edges.map(({ lo, hi }) => {
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

function profileTrack(samples: Float32Array): TrackProfile {
    const hann = hannWindow(FFT_SIZE)
    const edges = bandEdges()
    const bins = bandBins(edges)
    const windowLength = WINDOW_SECONDS * SAMPLE_RATE
    const duration = samples.length / SAMPLE_RATE

    const raw: { at: number; total: number; bands: number[] }[] = []

    const spectrum = new Float64Array(FFT_SIZE / 2)
    const re = new Float64Array(FFT_SIZE)
    const im = new Float64Array(FFT_SIZE)

    for (
        let start = 0;
        start + windowLength <= samples.length;
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
                re[i] = samples[offset + i] * hann[i]
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
        const total = bands.reduce((sum, value) => sum + value, 0)

        raw.push({ at: start / samples.length, total, bands })
    }

    const medianTotal = median(raw.map((w) => w.total))

    return {
        durationSeconds: Math.round(duration),
        windows: raw.map((w) => {
            // Relative to this window's own median band, so the numbers say
            // nothing about mastering level and everything about balance.
            const reference = median(w.bands)

            return {
                at: +w.at.toFixed(4),
                levelDb: toDb(w.total, medianTotal),
                bands: w.bands.map((value) => toDb(value, reference)),
            }
        }),
    }
}

async function main() {
    const profiles: TrackProfiles = {
        version: 1,
        anchorHz: ANCHOR_HZ,
        bandsPerOctave: BANDS_PER_OCTAVE,
        firstBand: FIRST_BAND,
        lastBand: LAST_BAND,
        windowSeconds: WINDOW_SECONDS,
        tracks: {},
    }

    let files: string[] = []

    try {
        files = (await fs.readdir(TRACKS_DIR))
            .filter((f) =>
                AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()),
            )
            .sort()
    } catch {
        console.warn(`[track-profiles] no ${TRACKS_DIR} directory, skipping`)
    }

    for (const file of files) {
        const full = path.join(TRACKS_DIR, file)

        try {
            const samples = await decode(full)

            if (samples.length < WINDOW_SECONDS * SAMPLE_RATE) {
                console.warn(`[track-profiles] ${file} is too short, skipping`)
                continue
            }

            profiles.tracks[file] = profileTrack(samples)
            console.log(
                `[track-profiles] ${file}: ` +
                    `${profiles.tracks[file].windows.length} windows`,
            )
        } catch (error) {
            // Deliberately not fatal: a developer without ffmpeg should still
            // be able to run the site. The games treat a missing profile as
            // "every band allowed", which is the behaviour from before this
            // existed.
            console.warn(
                `[track-profiles] could not profile ${file}: ` +
                    `${(error as Error).message}`,
            )
        }
    }

    await fs.writeFile(OUTPUT, JSON.stringify(profiles), { encoding: "utf-8" })

    if (files.length > 0 && Object.keys(profiles.tracks).length === 0) {
        const message =
            "[track-profiles] there are tracks but none could be profiled — " +
            "is ffmpeg on PATH, and did Git LFS fetch the audio?"

        // Locally this is only a warning, so a contributor without ffmpeg can
        // still run the site; the games fall back to allowing every band. In
        // CI it has to be fatal, because the alternative is silently
        // deploying a game that asks about frequencies which are not there.
        if (process.env.CI) {
            console.error(message)
            process.exitCode = 1
            return
        }

        console.warn(message)
    }
}

main()
