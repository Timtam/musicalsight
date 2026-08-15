import profiles from "../../track-profiles.json"
import type { GridPoint } from "./grid"

/**
 * Reads the spectral profiles built by scripts/build-track-profiles.ts and
 * answers the only question the games have: at this point in this track, is
 * that frequency actually there?
 *
 * Without this, a round can boost a band the passage does not contain. The
 * result sounds exactly like the original, and the only way to answer is by
 * elimination — which trains nothing. Measured across the bundled tracks,
 * the same track swings by up to 28 dB in a treble band between passages,
 * and even 100 Hz drops by 30 dB in places, so this has to be judged per
 * passage rather than per track.
 */

export interface Passage {
    /** Where playback starts, as a fraction of the track duration. */
    at: number
    /** Grid indices whose band is audibly present in this passage. */
    gridIndices: number[]
}

interface ProfileWindow {
    at: number
    levelDb: number
    bands: number[]
}

const DATA = profiles as {
    version: number
    anchorHz: number
    bandsPerOctave: number
    firstBand: number
    lastBand: number
    windowSeconds: number
    tracks: Record<
        string,
        {
            durationSeconds: number
            lufs: number | null
            windows: ProfileWindow[]
        }
    >
}

/**
 * The quietest track sets the reference, so every adjustment is an
 * attenuation. Normalising upwards could push a track into clipping once a
 * game adds a boost of up to 12 dB on top of it, and there is no limiter in
 * the chain.
 */
const REFERENCE_LUFS = (() => {
    const measured = Object.values(DATA.tracks)
        .map((track) => track.lufs)
        .filter((value): value is number => typeof value === "number")

    return measured.length > 0 ? Math.min(...measured) : null
})()

/**
 * How much to attenuate a track so all tracks play at the same perceived
 * loudness. Returns 0 when the loudness was never measured.
 *
 * The bundled tracks span 8.4 dB of integrated loudness, so without this the
 * level jumps audibly every time the game moves to another track — which on
 * headphones is unpleasant and makes the volume setting useless between
 * rounds. It says nothing about which frequencies are present; that is what
 * usablePassages is for.
 */
export function trackGainDb(file: string): number {
    const lufs = DATA.tracks[file]?.lufs

    if (typeof lufs !== "number" || REFERENCE_LUFS === null) return 0

    return Math.min(0, REFERENCE_LUFS - lufs)
}

export interface PassageQuery {
    /**
     * How far below the passage's median band a band may sit and still count
     * as present, in decibels.
     */
    thresholdDb: number
    /** Passages quieter than this relative to the track are skipped. */
    minLevelDb: number
    earliestFraction: number
    latestFraction: number
}

/** Total power of one game band, summed from the profile's finer bands. */
function bandPower(
    window: ProfileWindow,
    gridIndex: number,
    stepsPerOctave: number,
): number {
    const centre = (gridIndex * DATA.bandsPerOctave) / stepsPerOctave
    const halfWidth = DATA.bandsPerOctave / (2 * stepsPerOctave)

    const from = Math.round(centre - halfWidth) - DATA.firstBand
    const to = Math.round(centre + halfWidth) - DATA.firstBand

    let power = 0

    for (
        let i = Math.max(0, from);
        i <= Math.min(window.bands.length - 1, to);
        i++
    ) {
        power += Math.pow(10, window.bands[i] / 10)
    }

    return power
}

function median(values: number[]): number {
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)

    return sorted[Math.floor(sorted.length / 2)]
}

/**
 * Every usable passage of a track, with the grid points that can honestly be
 * asked about in each.
 *
 * Returns an empty array when the track has no profile — a newly added track
 * whose profile has not been rebuilt, or a checkout without ffmpeg. Callers
 * must fall back to their previous behaviour rather than break.
 */
export function usablePassages(
    file: string,
    grid: GridPoint[],
    stepsPerOctave: number,
    query: PassageQuery,
): Passage[] {
    const profile = DATA.tracks[file]

    if (!profile) return []

    const candidates = grid.filter((point) => point.answerable)

    if (candidates.length === 0) return []

    const passages: Passage[] = []

    for (const window of profile.windows) {
        if (window.at < query.earliestFraction) continue
        if (window.at > query.latestFraction) continue
        if (window.levelDb < query.minLevelDb) continue

        const powers = candidates.map((point) =>
            bandPower(window, point.index, stepsPerOctave),
        )
        const reference = median(powers)

        if (reference <= 0) continue

        const gridIndices = candidates
            .filter(
                (_, i) =>
                    powers[i] > 0 &&
                    10 * Math.log10(powers[i] / reference) >= query.thresholdDb,
            )
            .map((point) => point.index)

        if (gridIndices.length > 0)
            passages.push({ at: window.at, gridIndices })
    }

    return passages
}

/**
 * Every passage of a track that is loud enough to judge, as start fractions.
 *
 * The band-level half of usablePassages does not apply to every game: a level
 * change, a pan move or a compressor is broadband, so there is no band that
 * has to be present. What still applies is the level gate — a 3 dB change in a
 * fade or a gap between phrases is not quiet, it is inaudible, and the round
 * is then unanswerable for a reason the player cannot hear.
 *
 * Same contract as usablePassages: empty means no profile, and the caller has
 * to fall back rather than break.
 */
export function loudPassages(
    file: string,
    query: Omit<PassageQuery, "thresholdDb">,
): number[] {
    const profile = DATA.tracks[file]

    if (!profile) return []

    return profile.windows
        .filter(
            (window) =>
                window.at >= query.earliestFraction &&
                window.at <= query.latestFraction &&
                window.levelDb >= query.minLevelDb,
        )
        .map((window) => window.at)
}

/** True when any profile data was built at all. */
export function hasProfiles(): boolean {
    return Object.keys(DATA.tracks).length > 0
}
