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
        { durationSeconds: number; windows: ProfileWindow[] }
    >
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

/** True when any profile data was built at all. */
export function hasProfiles(): boolean {
    return Object.keys(DATA.tracks).length > 0
}
