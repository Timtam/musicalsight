import { useCallback, useEffect, useState } from "react"
import Assets from "../../assets"
import type Asset from "../../entities/Asset"
import { forgetProfile, registerProfile } from "./profile"
import {
    allUserTracks,
    deleteUserTrack,
    summarise,
    toAsset,
    type TrackSummary,
    type UserTrack,
} from "./userTracks"

/**
 * The tracks a game may draw from: the bundled ones, plus whatever the player
 * has added in this browser.
 *
 * Two things are module level rather than component state, on purpose.
 *
 * The asset cache, because toAsset mints an object URL and the games hand
 * those to an audio element across rounds and across pages. Minting a new one
 * per mount would leak a URL per visit and, worse, swap the URL under a track
 * that is currently playing.
 *
 * The subscriber list, because adding a track on one page has to reach the
 * game pages without a reload. There is no store in this app and one library
 * does not justify adding one.
 */
const ASSETS = new Map<string, Asset>()
const LISTENERS = new Set<() => void>()

function assetFor(track: UserTrack): Asset {
    const cached = ASSETS.get(track.id)

    if (cached) return cached

    const asset = toAsset(track)

    ASSETS.set(track.id, asset)

    return asset
}

function announceChange(): void {
    for (const listener of LISTENERS) listener()
}

export interface TrackLibrary {
    /** Bundled first, then the player's own, in the order they were added. */
    tracks: readonly Asset[]
    own: readonly TrackSummary[]
    /** False only while the first read of IndexedDB is in flight. */
    ready: boolean
    remove(id: string): Promise<void>
    refresh(): void
}

export function useTrackLibrary(): TrackLibrary {
    const [own, setOwn] = useState<readonly UserTrack[]>([])
    const [ready, setReady] = useState(false)

    const load = useCallback(() => {
        allUserTracks()
            .then((tracks) => {
                // Registered before the assets are handed out, so a game that
                // starts on the same tick already has the profile it needs.
                for (const track of tracks)
                    registerProfile(track.file, track.profile)

                setOwn(tracks)
            })
            .catch(() => {
                // A private window can refuse IndexedDB outright. The bundled
                // tracks still work, which is the whole app minus this feature.
                setOwn([])
            })
            .finally(() => setReady(true))
    }, [])

    useEffect(() => {
        load()

        LISTENERS.add(load)

        return () => {
            LISTENERS.delete(load)
        }
    }, [load])

    const remove = useCallback(async (id: string) => {
        const track = (await allUserTracks()).find((t) => t.id === id)

        await deleteUserTrack(id)

        if (track) {
            forgetProfile(track.file)

            const asset = ASSETS.get(id)

            if (asset) URL.revokeObjectURL(asset.url)

            ASSETS.delete(id)
        }

        announceChange()
    }, [])

    return {
        tracks: [...Assets, ...own.map(assetFor)],
        own: own.map(summarise),
        ready,
        remove,
        refresh: announceChange,
    }
}

/** Called after a track is added, so every mounted library picks it up. */
export function trackLibraryChanged(): void {
    announceChange()
}
