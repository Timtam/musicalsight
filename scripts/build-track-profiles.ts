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
 * The analysis itself lives in src/games/engine/profiler.ts, shared with the
 * browser so a player's own material is measured by exactly the same code.
 * All this script adds is decoding, which is the one step Node cannot do the
 * way a browser can: ffmpeg here, decodeAudioData there. The two were checked
 * against each other and agree bit for bit.
 *
 * ffmpeg must be on PATH. Without it the script writes an empty profile and
 * warns; the games then fall back to their previous behaviour of allowing
 * every band.
 *
 * Output is generated, gitignored and rebuilt by prestart/prebuild, exactly
 * like src/catalog.json.
 */
import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"
import {
    ANCHOR_HZ,
    BANDS_PER_OCTAVE,
    FIRST_BAND,
    LAST_BAND,
    PROFILE_VERSION,
    profileChannels,
    SAMPLE_RATE,
    WINDOW_SECONDS,
    type TrackProfile,
} from "../src/games/engine/profiler"

const TRACKS_DIR = "./tracks"
const OUTPUT = "./src/track-profiles.json"

const AUDIO_EXTENSIONS = [".opus", ".ogg", ".mp3", ".flac", ".wav", ".m4a"]

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

/**
 * Decodes to de-interleaved float32 channels at the profiler's sample rate.
 *
 * Deliberately NOT `-ac 1`: that downmix is 3.010 dB louder than (L + R) / 2,
 * and the mono sum is the profiler's business rather than ffmpeg's. Asking
 * for stereo also gets the side information the stereo games need, in one
 * pass instead of the two this used to make.
 */
function decode(file: string): Promise<Float32Array[]> {
    return new Promise((resolve, reject) => {
        const child = spawn(
            "ffmpeg",
            [
                "-v",
                "error",
                "-i",
                file,
                "-ac",
                "2",
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
            const interleaved = new Float32Array(
                merged.buffer,
                merged.byteOffset,
                Math.floor(merged.byteLength / 4),
            )
            const frames = Math.floor(interleaved.length / 2)
            const left = new Float32Array(frames)
            const right = new Float32Array(frames)

            for (let i = 0; i < frames; i++) {
                left[i] = interleaved[i * 2]
                right[i] = interleaved[i * 2 + 1]
            }

            resolve([left, right])
        })
    })
}

async function main() {
    const profiles: TrackProfiles = {
        version: PROFILE_VERSION,
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
            const [left, right] = await decode(full)

            if (left.length < WINDOW_SECONDS * SAMPLE_RATE) {
                console.warn(`[track-profiles] ${file} is too short, skipping`)
                continue
            }

            const profile = profileChannels(left, right)

            profiles.tracks[file] = profile
            console.log(
                `[track-profiles] ${file}: ` +
                    `${profile.windows.length} windows, ` +
                    `${profile.lufs === null ? "loudness unknown" : `${profile.lufs} LUFS`}, ` +
                    `${
                        profile.windows.filter((w) => w.sideRatio >= 0.02)
                            .length
                    } with a stereo image`,
            )
        } catch (error) {
            // Deliberately not fatal: a developer without ffmpeg should still
            // be able to run the site. The games treat a missing profile as
            // "every band allowed", which is the behaviour from before this
            // existed.
            console.warn(
                `[track-profiles] ${file} could not be measured: ` +
                    `${(error as Error).message.split("\n")[0]}`,
            )
        }
    }

    await fs.writeFile(OUTPUT, JSON.stringify(profiles), { encoding: "utf-8" })
    console.log(
        `[track-profiles] wrote ${OUTPUT} with ` +
            `${Object.keys(profiles.tracks).length} tracks`,
    )
}

main()
