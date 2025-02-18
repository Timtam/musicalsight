import Asset from "./entities/Asset"

const CREDITS_JPR =
    "Music by Jean-Philippe Rykiel (https://jeanphilipperykiel.com/)"
const CREDITS_ONDROSIK =
    "Music by Ondrosik, available at https://audio.com/ondrosik"

export default [
    {
        url: new URL(
            "../tracks/Jean-Philippe Rykiel - Ode to Vangelis.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_JPR,
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Ondrosik - Dobrú noc Má milá.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_ONDROSIK,
    } satisfies Asset,
    {
        url: new URL("../tracks/Ondrosik - Fairitale.opus", import.meta.url)
            .href,
        credits: CREDITS_ONDROSIK,
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Ondrosik - Procrastination.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_ONDROSIK,
    } satisfies Asset,
]
