import { useId, useRef, useState } from "react"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import { addUserTrack } from "../../games/engine/userTracks"
import {
    trackLibraryChanged,
    useTrackLibrary,
} from "../../games/engine/useTrackLibrary"

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const rest = Math.round(seconds % 60)

    return `${minutes} minutes ${rest} seconds`
}

function formatSize(bytes: number): string {
    return bytes >= 1e6
        ? `${(bytes / 1e6).toFixed(1)} MB`
        : `${Math.round(bytes / 1e3)} kB`
}

export default function MyTracks() {
    const library = useTrackLibrary()
    const inputId = useId()
    const input = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const [status, setStatus] = useState("")
    const [error, setError] = useState("")

    async function onFiles(files: FileList | null) {
        if (!files || files.length === 0 || busy) return

        setBusy(true)
        setError("")

        const chosen = [...files]
        const failures: string[] = []

        for (let i = 0; i < chosen.length; i++) {
            const file = chosen[i]
            const position =
                chosen.length > 1 ? ` (${i + 1} of ${chosen.length})` : ""

            try {
                await addUserTrack(file, (stage) => {
                    setStatus(
                        stage === "decoding"
                            ? `Reading ${file.name}${position}.`
                            : stage === "analysing"
                              ? `Measuring ${file.name}${position}. This takes a few seconds.`
                              : `Saving ${file.name}${position}.`,
                    )
                })
            } catch (e) {
                failures.push(`${file.name}: ${(e as Error).message}`)
            }
        }

        trackLibraryChanged()

        const added = chosen.length - failures.length

        setStatus(
            added === 0
                ? "Nothing was added."
                : `${added} ${added === 1 ? "track is" : "tracks are"} ready to play.`,
        )
        setError(failures.join(" "))
        setBusy(false)

        // The picker keeps its selection, so choosing the same file twice in
        // a row would otherwise fire no change event at all.
        if (input.current) input.current.value = ""
    }

    return (
        <>
            <Head title="My tracks" />
            <FA title="My tracks" />

            <Card>
                <Card.Body>
                    <Card.Title as="h4">Play with your own music</Card.Title>
                    <Card.Text>
                        Add your own audio files and the games will use them
                        alongside the bundled music. Each file is measured once
                        when you add it, which takes a few seconds: the games
                        need to know which frequencies a passage actually
                        contains, how loud it is, and whether it has a stereo
                        image, or they would ask questions the music cannot
                        answer.
                    </Card.Text>
                    <Card.Text>
                        Everything happens in this browser. The file is read,
                        decoded and measured on your own machine, and stored
                        here — nothing is uploaded, and nobody else can reach
                        it. Clearing your browser data removes it again.
                    </Card.Text>
                </Card.Body>
            </Card>

            <Form.Label htmlFor={inputId}>
                Audio files — MP3, WAV, FLAC, M4A or Ogg
            </Form.Label>
            <Form.Control
                id={inputId}
                ref={input}
                type="file"
                accept="audio/*"
                multiple
                aria-describedby={`${inputId}-hint`}
                disabled={busy}
                onChange={(event) =>
                    void onFiles(
                        (event.currentTarget as HTMLInputElement).files,
                    )
                }
            />
            <p id={`${inputId}-hint`}>
                A track needs to be at least 8 seconds long. Longer files take
                longer to measure — roughly 3 seconds for 5 minutes of music.
            </p>

            {/*
                Polite, not assertive: this reports progress the player asked
                for by choosing a file, and cutting off whatever they are
                reading to say "measuring" would be worse than waiting.
            */}
            <p role="status">{status}</p>
            {error !== "" && <p role="alert">{error}</p>}

            <h4>Your tracks</h4>
            {!library.ready ? (
                <p>Looking for tracks you have added.</p>
            ) : library.own.length === 0 ? (
                <p>
                    None yet. The games are using the {library.tracks.length}{" "}
                    bundled tracks.
                </p>
            ) : (
                <ul>
                    {library.own.map((track) => (
                        <li key={track.id}>
                            {track.title} —{" "}
                            {formatDuration(track.durationSeconds)},{" "}
                            {formatSize(track.bytes)},{" "}
                            {track.stereoWindows === 0
                                ? "no stereo image, so it is skipped in stereo width rounds"
                                : `${track.stereoWindows} of ${track.windows} passages carry a stereo image`}
                            .{" "}
                            <Button
                                variant="link"
                                onClick={() => void library.remove(track.id)}
                            >
                                Remove {track.title}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}
