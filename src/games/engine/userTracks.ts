import Asset from "../../entities/Asset"
import { SAMPLE_RATE, WINDOW_SECONDS, type TrackProfile } from "./profiler"
import type { ProfileRequest, ProfileResponse } from "./profiler.worker"

/**
 * The player's own music: stored in the browser, measured in the browser,
 * and never sent anywhere.
 *
 * The audio itself has to be kept, not just a reference to it. A File chosen
 * from disk survives only as long as the page does, and an object URL dies
 * with it, so the bytes go into IndexedDB and a fresh object URL is minted
 * each session. The profile is tiny next to the audio; keeping both together
 * means a track is analysed once rather than on every visit.
 */

const DB_NAME = "eardojo-tracks"
const DB_VERSION = 1
const STORE = "tracks"

export interface UserTrack {
    id: string
    /** The key the profile is filed under. Matches Asset.file. */
    file: string
    title: string
    credits: string
    /** Bytes as chosen, so playback uses the original encoding. */
    blob: Blob
    profile: TrackProfile
    addedAt: number
}

export interface TrackSummary {
    id: string
    file: string
    title: string
    durationSeconds: number
    windows: number
    lufs: number | null
    /** Windows carrying a stereo image, which the width game needs. */
    stereoWindows: number
    bytes: number
    addedAt: number
}

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = () => {
            const db = request.result

            if (!db.objectStoreNames.contains(STORE))
                db.createObjectStore(STORE, { keyPath: "id" })
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
            reject(request.error ?? new Error("IndexedDB refused to open"))
    })
}

function run<T>(
    mode: IDBTransactionMode,
    body: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    return open().then(
        (db) =>
            new Promise<T>((resolve, reject) => {
                const tx = db.transaction(STORE, mode)
                const request = body(tx.objectStore(STORE))

                request.onsuccess = () => resolve(request.result)
                request.onerror = () =>
                    reject(
                        request.error ?? new Error("IndexedDB request failed"),
                    )
                tx.oncomplete = () => db.close()
            }),
    )
}

export function allUserTracks(): Promise<UserTrack[]> {
    return run<UserTrack[]>("readonly", (store) => store.getAll()).then(
        (tracks) => tracks.sort((a, b) => a.addedAt - b.addedAt),
    )
}

export function deleteUserTrack(id: string): Promise<void> {
    return run("readwrite", (store) => store.delete(id)).then(() => undefined)
}

export function summarise(track: UserTrack): TrackSummary {
    return {
        id: track.id,
        file: track.file,
        title: track.title,
        durationSeconds: track.profile.durationSeconds,
        windows: track.profile.windows.length,
        lufs: track.profile.lufs,
        stereoWindows: track.profile.windows.filter((w) => w.sideRatio >= 0.02)
            .length,
        bytes: track.blob.size,
        addedAt: track.addedAt,
    }
}

/**
 * A stored track as the games see it.
 *
 * The object URL is created here and deliberately never revoked while the
 * app is running: the games hand these to an audio element repeatedly, and a
 * revoked URL fails silently as a track that will not play.
 */
export function toAsset(track: UserTrack): Asset {
    return {
        file: track.file,
        title: track.title,
        credits: track.credits,
        url: URL.createObjectURL(track.blob),
    }
}

/**
 * Decodes at the profiler's sample rate, whatever the file's own rate is.
 *
 * The context's rate drives decodeAudioData's resampling, which is what
 * ffmpeg's `-ar 48000` does on the build side. Checked against ffmpeg on the
 * bundled tracks: same frame count, channel RMS equal to 0.000 dB.
 */
async function decode(bytes: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = new OfflineAudioContext({
        numberOfChannels: 2,
        length: 128,
        sampleRate: SAMPLE_RATE,
    })

    return await ctx.decodeAudioData(bytes)
}

function analyse(buffer: AudioBuffer): Promise<TrackProfile> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            new URL("./profiler.worker.ts", import.meta.url),
            { type: "module" },
        )

        worker.onmessage = (event: MessageEvent<ProfileResponse>) => {
            worker.terminate()

            if (event.data.ok) resolve(event.data.profile)
            else reject(new Error(event.data.message))
        }

        worker.onerror = (event) => {
            worker.terminate()
            reject(new Error(event.message || "the analysis worker failed"))
        }

        // Copied rather than referenced, because getChannelData hands back a
        // view onto the AudioBuffer and a transfer would detach it.
        const left = new Float32Array(buffer.getChannelData(0)).buffer
        const right =
            buffer.numberOfChannels > 1
                ? new Float32Array(buffer.getChannelData(1)).buffer
                : null

        const request: ProfileRequest = {
            left,
            right,
            sampleRate: buffer.sampleRate,
        }

        worker.postMessage(request, right ? [left, right] : [left])
    })
}

export class TrackTooShortError extends Error {
    constructor(seconds: number) {
        super(
            `That file is ${Math.round(seconds)} seconds long. A track needs ` +
                `at least ${WINDOW_SECONDS} seconds, because the analysis ` +
                `works in ${WINDOW_SECONDS} second passages.`,
        )
        this.name = "TrackTooShortError"
    }
}

/**
 * Reads a file the player chose, measures it, and keeps both.
 *
 * The whole thing happens locally: the bytes are read with FileReader, decoded
 * by the browser's own codecs, analysed in a worker, and written to IndexedDB.
 * Nothing is uploaded, which is worth saying out loud to anyone who wonders
 * where their music went.
 */
export async function addUserTrack(
    file: File,
    onStage?: (stage: "decoding" | "analysing" | "saving") => void,
): Promise<UserTrack> {
    const bytes = await file.arrayBuffer()

    onStage?.("decoding")

    let buffer: AudioBuffer

    try {
        // decodeAudioData detaches the buffer it is given, and the same bytes
        // are still needed for the Blob, so it gets a copy.
        buffer = await decode(bytes.slice(0))
    } catch {
        throw new Error(
            "The browser could not decode that file. MP3, WAV, FLAC, M4A and " +
                "Ogg usually work; anything else depends on the browser.",
        )
    }

    if (buffer.duration < WINDOW_SECONDS)
        throw new TrackTooShortError(buffer.duration)

    onStage?.("analysing")

    const profile = await analyse(buffer)

    onStage?.("saving")

    const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.round(Math.random() * 1e9)}`

    const track: UserTrack = {
        id,
        file: `user:${id}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        credits: "Your own file, stored in this browser only.",
        blob: new Blob([bytes], { type: file.type || "audio/*" }),
        profile,
        addedAt: Date.now(),
    }

    await run("readwrite", (store) => store.put(track))

    return track
}
