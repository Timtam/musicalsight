import Asset from "./entities/Asset"

const CREDITS_JPR =
    "Music by Jean-Philippe Rykiel (https://jeanphilipperykiel.com/)"
const CREDITS_LDSM =
    "Music by Leo Da Slowly Movin (https://distrokid.com/hyperfollow/leodaslowlymovin/improvised-thoughts)"
const CREDITS_ONDROSIK =
    "Music by Ondrosik, available at https://audio.com/ondrosik"

export default [
    {
        url: new URL(
            "../tracks/Jean-Philippe Rykiel - Ode to Vangelis.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_JPR,
        title: "Ode to Vangelis",
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Leo Da Slowly Movin - Bolando.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_LDSM,
        title: "Bolando",
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Leo Da Slowly Movin - Chimes Too I.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_LDSM,
        title: "Chimes Too I",
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Leo Da Slowly Movin - Switch Up Reverted.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_LDSM,
        title: "Switch Up Reverted",
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Ondrosik - Dobrú noc Má milá.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_ONDROSIK,
        title: "Dobrú noc Má milá",
    } satisfies Asset,
    {
        url: new URL("../tracks/Ondrosik - Fairitale.opus", import.meta.url)
            .href,
        credits: CREDITS_ONDROSIK,
        title: "Fairitale",
    } satisfies Asset,
    {
        url: new URL(
            "../tracks/Ondrosik - Procrastination.opus",
            import.meta.url,
        ).href,
        credits: CREDITS_ONDROSIK,
        title: "Procrastination",
    } satisfies Asset,
]
