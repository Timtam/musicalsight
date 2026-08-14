import Asset from "./entities/Asset"

const CREDITS_JPR =
    "Music by Jean-Philippe Rykiel (https://jeanphilipperykiel.com/)"
const CREDITS_LDSM =
    "Music by Leo Da Slowly Movin (https://distrokid.com/hyperfollow/leodaslowlymovin/improvised-thoughts)"
const CREDITS_ONDROSIK =
    "Music by Ondrosik, available at https://audio.com/ondrosik"

/**
 * The file name is written once and the bundled URL derives from it, so the
 * two can never drift apart. `file` is what links a track to its entry in
 * the generated track-profiles.json; Vite hashes `url` in production, which
 * makes it useless as a key.
 *
 * To add a track: drop the file into tracks/, add a line here, and run the
 * build once so its spectral profile is measured.
 */
function track(file: string, title: string, credits: string): Asset {
    return {
        file,
        title,
        credits,
        url: new URL(`../tracks/${file}`, import.meta.url).href,
    }
}

export default [
    track(
        "Jean-Philippe Rykiel - Ode to Vangelis.opus",
        "Ode to Vangelis",
        CREDITS_JPR,
    ),
    track("Leo Da Slowly Movin - Bolando.opus", "Bolando", CREDITS_LDSM),
    track(
        "Leo Da Slowly Movin - Chimes Too I.opus",
        "Chimes Too I",
        CREDITS_LDSM,
    ),
    track(
        "Leo Da Slowly Movin - Switch Up Reverted.opus",
        "Switch Up Reverted",
        CREDITS_LDSM,
    ),
    track(
        "Ondrosik - Dobrú noc Má milá.opus",
        "Dobrú noc Má milá",
        CREDITS_ONDROSIK,
    ),
    track("Ondrosik - Fairitale.opus", "Fairitale", CREDITS_ONDROSIK),
    track(
        "Ondrosik - Procrastination.opus",
        "Procrastination",
        CREDITS_ONDROSIK,
    ),
]
