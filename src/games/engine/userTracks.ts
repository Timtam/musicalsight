import Asset from "../../entities/Asset"
import {
    PROFILE_VERSION,
    profileChannels,
    SAMPLE_RATE,
    WINDOW_SECONDS,
    type TrackProfile,
} from "./profiler"
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
const STORE = "tracks"

/**
 * The IndexedDB schema version. Bump it and add a case to `migrate`.
 *
 * This is the SHAPE of the store — its name, its key, its indexes. It is not
 * the shape of a profile, which changes far more often and is versioned
 * separately; see `profileVersion` on the record.
 */
const DB_VERSION = 1

/**
 * The largest file that will be accepted.
 *
 * Not arbitrary: decodeAudioData has no streaming form, so the whole track
 * becomes float32 in memory at once — roughly 11 MB per stereo minute at
 * 48 kHz, whatever the file's own compression. 150 MB of input is already a
 * very long recording, and refusing it with a reason beats a tab that dies.
 */
const MAX_FILE_BYTES = 150 * 1e6

export interface UserTrack {
    id: string
    /** The key the profile is filed under. Matches Asset.file. */
    file: string
    title: string
    credits: string
    /** Bytes as chosen, so playback uses the original encoding. */
    blob: Blob
    profile: TrackProfile
    /**
     * Which profiler produced `profile`.
     *
     * This is the field that makes the store survive the future. The games
     * will want measurements this profiler does not take yet — a different
     * loudness figure, finer bands, something nobody has thought of — and
     * when that happens every stored profile is suddenly a profile of the
     * wrong thing, silently.
     *
     * Keeping the audio is what makes that recoverable: a stale profile is
     * not lost data, it is a recomputation. `allUserTracks` re-measures
     * anything below PROFILE_VERSION from the blob it already has and writes
     * the result back, so a player who returns after an update finds their
     * tracks measured the new way without doing anything.
     */
    profileVersion: number
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

/**
 * Schema migrations, applied in order from whatever version is on disk.
 *
 * Deliberately a fallthrough switch rather than "create it if missing": a
 * browser can be two or five versions behind, and each step has to run. A
 * record's own contents are not migrated here — IndexedDB stores whole
 * objects and a field added tomorrow is simply absent on yesterday's records,
 * which the reader handles.
 */
function migrate(db: IDBDatabase, from: number): void {
    /* eslint-disable no-fallthrough */
    switch (from) {
        case 0:
            db.createObjectStore(STORE, { keyPath: "id" })
        // case 1: the next change goes here, with no break above it.
    }
}

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (event) => {
            migrate(request.result, event.oldVersion)
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
            reject(request.error ?? new Error("IndexedDB refused to open"))
        request.onblocked = () =>
            reject(
                new Error(
                    "Another tab has this database open on an older version. " +
                        "Close the other tabs and reload.",
                ),
            )
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

/**
 * Every stored track, brought up to the current profiler on the way out.
 *
 * A track whose profile predates the running PROFILE_VERSION is measured
 * again from the audio it was stored with, and the fresh profile is written
 * back so the work happens once rather than on every visit. If that fails —
 * a codec the browser has since dropped, a quota that is now full — the old
 * profile is handed over anyway: a slightly stale measurement still plays,
 * and refusing to return the track would lose it for good.
 */
export async function allUserTracks(): Promise<UserTrack[]> {
    const stored = await run<UserTrack[]>("readonly", (store) => store.getAll())

    const tracks = stored.sort((a, b) => a.addedAt - b.addedAt)
    const fresh: UserTrack[] = []

    for (const track of tracks) {
        if ((track.profileVersion ?? 0) >= PROFILE_VERSION) {
            fresh.push(track)
            continue
        }

        try {
            const buffer = await decode(await track.blob.arrayBuffer())
            const updated: UserTrack = {
                ...track,
                profile: profileChannels(
                    buffer.getChannelData(0),
                    buffer.numberOfChannels > 1
                        ? buffer.getChannelData(1)
                        : null,
                    buffer.sampleRate,
                ),
                profileVersion: PROFILE_VERSION,
            }

            await run("readwrite", (store) => store.put(updated))
            fresh.push(updated)
        } catch {
            fresh.push(track)
        }
    }

    return fresh
}

/** Renames a stored track. The profile and the audio are untouched. */
export async function renameUserTrack(
    id: string,
    title: string,
): Promise<void> {
    const trimmed = title.trim()

    if (trimmed === "") throw new Error("A track needs a name.")

    const track = await run<UserTrack | undefined>("readonly", (store) =>
        store.get(id),
    )

    if (!track) throw new Error("That track is no longer here.")

    await run("readwrite", (store) => store.put({ ...track, title: trimmed }))
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

function analyse(
    left: ArrayBuffer,
    right: ArrayBuffer | null,
    sampleRate: number,
): Promise<TrackProfile> {
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

        // Transferred, not copied: the main thread gives up these buffers
        // entirely, so the audio exists in one place rather than two while
        // the analysis runs.
        worker.postMessage(
            { left, right, sampleRate } satisfies ProfileRequest,
            right ? [left, right] : [left],
        )
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
    if (file.size > MAX_FILE_BYTES)
        throw new Error(
            `That file is ${Math.round(file.size / 1e6)} MB. The limit is ` +
                `${Math.round(MAX_FILE_BYTES / 1e6)} MB, because the whole ` +
                `track has to be decoded into memory at once to measure it.`,
        )

    onStage?.("decoding")

    let buffer: AudioBuffer | null

    try {
        // The File is kept as the stored blob, so the bytes are read once and
        // handed straight to the decoder, which detaches them. Reading them
        // into a variable and copying for the Blob held the file three times
        // over for no reason.
        buffer = await decode(await file.arrayBuffer())
    } catch {
        throw new Error(
            "The browser could not decode that file. MP3, WAV, FLAC, M4A and " +
                "Ogg usually work; anything else depends on the browser.",
        )
    }

    if (buffer.duration < WINDOW_SECONDS) {
        const seconds = buffer.duration

        buffer = null
        throw new TrackTooShortError(seconds)
    }

    onStage?.("analysing")

    // Copied out and the AudioBuffer dropped before the worker starts, so the
    // decoded audio is not held twice while the analysis runs.
    const sampleRate = buffer.sampleRate
    const left = new Float32Array(buffer.getChannelData(0)).buffer
    const right =
        buffer.numberOfChannels > 1
            ? new Float32Array(buffer.getChannelData(1)).buffer
            : null

    buffer = null

    const profile = await analyse(left, right, sampleRate)

    onStage?.("saving")

    const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.round(Math.random() * 1e9)}`

    const track: UserTrack = {
        id,
        profileVersion: PROFILE_VERSION,
        file: `user:${id}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        credits: "Your own file, stored in this browser only.",
        // The File itself: already a Blob, already the original encoding.
        blob: file,
        profile,
        addedAt: Date.now(),
    }

    try {
        await run("readwrite", (store) => store.put(track))
    } catch (error) {
        const name = (error as DOMException)?.name

        throw new Error(
            name === "QuotaExceededError"
                ? "There is no room left in this browser's storage for that " +
                  "track. Remove one you no longer need and try again."
                : `That track could not be saved: ${(error as Error).message}`,
        )
    }

    return track
}
