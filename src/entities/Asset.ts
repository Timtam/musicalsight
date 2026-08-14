export default class Asset {
    url: string
    /**
     * The file name inside tracks/, exactly as on disk. Vite hashes `url` in
     * production, so this is what links a track to its entry in the
     * generated track-profiles.json.
     */
    file: string
    credits: string
    title: string
}
