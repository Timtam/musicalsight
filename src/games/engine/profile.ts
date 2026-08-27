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
    /** Side over mid energy. Absent in profiles built before version 2. */
    sideRatio?: number
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

type Profile = {
    durationSeconds: number
    lufs: number | null
    windows: ProfileWindow[]
}

/**
 * Profiles measured in this browser, for the player's own material.
 *
 * An overlay rather than a merge, so the bundled data stays exactly what the
 * build produced and a user track can be forgotten by removing one entry.
 * Everything below looks here first, which is what lets the games treat both
 * kinds of track identically — the only difference is where the numbers were
 * computed, and they are computed by the same code either way.
 */
const OVERLAY = new Map<string, Profile>()

export function registerProfile(file: string, profile: Profile): void {
    OVERLAY.set(file, profile)
}

export function forgetProfile(file: string): void {
    OVERLAY.delete(file)
}

function profileOf(file: string): Profile | undefined {
    return OVERLAY.get(file) ?? DATA.tracks[file]
}

/**
 * The quietest track sets the reference, so every adjustment is an
 * attenuation. Normalising upwards could push a track into clipping once a
 * game adds a boost of up to 12 dB on top of it, and there is no limiter in
 * the chain.
 *
 * Recomputed on every call rather than fixed at import: a player who adds a
 * quieter track of their own moves the reference for everything, and a stale
 * one would leave that track louder than the rest by exactly the amount this
 * exists to remove.
 */
function referenceLufs(): number | null {
    const measured = [...Object.values(DATA.tracks), ...OVERLAY.values()]
        .map((track) => track.lufs)
        .filter((value): value is number => typeof value === "number")

    return measured.length > 0 ? Math.min(...measured) : null
}

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
    const lufs = profileOf(file)?.lufs
    const reference = referenceLufs()

    if (typeof lufs !== "number" || reference === null) return 0

    return Math.min(0, reference - lufs)
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
    const profile = profileOf(file)

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
    const profile = profileOf(file)

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

/**
 * Every passage that is loud enough AND carries a real stereo image.
 *
 * The width question needs side signal the way a boost needs the band to be
 * present: a stretch that is already close to mono has nothing to narrow, and
 * every answer sounds the same. Measured across the bundled tracks, 47 of 157
 * passages sit below a side-to-mid ratio of 0.02 — three of the seven tracks
 * are near-mono for most of their length — so this is not a rare edge case,
 * it is nearly a third of the material.
 *
 * Profiles built before version 2 carry no sideRatio. Those windows are
 * treated as unusable rather than assumed fine, so a stale profile makes the
 * caller fall back loudly instead of quietly serving unfair rounds.
 */
export function stereoPassages(
    file: string,
    query: Omit<PassageQuery, "thresholdDb"> & { minSideRatio: number },
): number[] {
    const profile = profileOf(file)

    if (!profile) return []

    return profile.windows
        .filter(
            (window) =>
                window.at >= query.earliestFraction &&
                window.at <= query.latestFraction &&
                window.levelDb >= query.minLevelDb &&
                (window.sideRatio ?? 0) >= query.minSideRatio,
        )
        .map((window) => window.at)
}

/** True when any profile data was built at all. */
export function hasProfiles(): boolean {
    return Object.keys(DATA.tracks).length > 0 || OVERLAY.size > 0
}
