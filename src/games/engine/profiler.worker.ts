/**
 * Runs the track analysis off the main thread.
 *
 * Only the arithmetic lives here. Decoding stays with the caller, because
 * OfflineAudioContext is not available in a worker in the browsers that
 * matter — so the main thread decodes (which the browser does natively and
 * asynchronously anyway) and hands the raw channels over.
 *
 * Measured on the longest bundled track, 5 min 32 s: the part that runs here
 * is about 1.8 s of solid arithmetic. On the main thread that is 1.8 s of
 * frozen page, including a screen reader that cannot move.
 */
import { profileChannels, type TrackProfile } from "./profiler"

export interface ProfileRequest {
    left: ArrayBuffer
    right: ArrayBuffer | null
    sampleRate: number
}

export type ProfileResponse =
    | { ok: true; profile: TrackProfile }
    | { ok: false; message: string }

self.onmessage = (event: MessageEvent<ProfileRequest>) => {
    const { left, right, sampleRate } = event.data

    try {
        const profile = profileChannels(
            new Float32Array(left),
            right ? new Float32Array(right) : null,
            sampleRate,
        )

        const response: ProfileResponse = { ok: true, profile }

        self.postMessage(response)
    } catch (error) {
        const response: ProfileResponse = {
            ok: false,
            message: (error as Error).message,
        }

        self.postMessage(response)
    }
}
