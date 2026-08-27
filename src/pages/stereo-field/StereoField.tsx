import { useMemo, useState } from "react"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import FA from "../../components/FocusAnchor"
import GameShell from "../../components/game/GameShell"
import Head from "../../components/Head"
import { randomSeed } from "../../games/engine/grid"
import { useGame } from "../../games/engine/useGame"
import { useTrackLibrary } from "../../games/engine/useTrackLibrary"
import {
    createStereoField,
    STEREO_CONFIG,
    type StereoSettings,
} from "../../games/stereo-field/StereoField"

export default function StereoField() {
    const [level, setLevel] = useState(STEREO_CONFIG.levels[0].id)
    const [settings, setSettings] = useState<StereoSettings>(
        STEREO_CONFIG.defaultSettings,
    )
    const [session, setSession] = useState<"practice" | "timed">("practice")
    const [seed] = useState(randomSeed)

    // A level may rule out time attack, so the choice cannot simply be
    // trusted — it has to be checked against the selected level.
    const timeAttackAllowed =
        STEREO_CONFIG.levels.find((option) => option.id === level)
            ?.supportsTimeAttack !== false
    const timeAttack = session === "timed" && timeAttackAllowed

    const spec = useMemo(() => createStereoField(), [])
    const engineSettings = useMemo(
        () => ({
            level,
            timeAttackSeconds: timeAttack
                ? STEREO_CONFIG.timeAttackSeconds
                : null,
            maxRounds: null,
            livesEnabled: true,
            seed,
            game: settings,
        }),
        [level, timeAttack, settings, seed],
    )

    // Bundled music plus anything the player has added in this browser.
    const library = useTrackLibrary()
    const api = useGame(spec, engineSettings, library.tracks)

    // Settings are snapshotted when start() runs, so changes during a
    // session take effect in the next one. Hence aria-disabled with an
    // ignored handler rather than disabled, which would drop the controls
    // out of the tab order without saying so.
    const running = api.state.phase !== "idle" && api.state.phase !== "over"

    const heading =
        api.state.phase === "over"
            ? "Training finished"
            : "Stereo Field training"

    // The two questions want different words, and the level steps differ
    // between them, so the level list has to say which one it is describing.
    const asking = settings.ask

    return (
        <>
            <Head title="Stereo Field" />
            <FA title="Stereo Field" />

            <Card>
                <Card.Body>
                    <Card.Title as="h4">How it works</Card.Title>
                    <Card.Text>
                        You hear a few seconds of music, then the same music
                        with its stereo image changed. Switch between the two as
                        often as you like, then say what happened. A wrong
                        answer tells you by how much you missed.
                    </Card.Text>
                    <Card.Text>
                        In a position round the music is collapsed to a single
                        point the whole time, the opening seconds included — it
                        starts centred, and the only thing that changes is where
                        that point sits, anywhere between hard left and hard
                        right. In a width round nothing is collapsed: the music
                        keeps its own stereo image, and that image is squeezed
                        towards the middle.
                    </Card.Text>
                </Card.Body>
            </Card>

            <fieldset>
                <legend>What to listen for</legend>
                {STEREO_CONFIG.asks.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="sf-ask"
                        id={`sf-ask-${option.id}`}
                        label={`${option.label} — ${option.description}`}
                        aria-disabled={running || undefined}
                        checked={settings.ask === option.id}
                        onChange={() => {
                            if (!running)
                                setSettings((s) => ({ ...s, ask: option.id }))
                        }}
                    />
                ))}
            </fieldset>

            <fieldset>
                <legend>Level</legend>
                {STEREO_CONFIG.levels.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="sf-level"
                        id={`sf-level-${option.id}`}
                        label={
                            `${option.label} — ${option.description}, ` +
                            `${
                                asking === "width"
                                    ? option.widthStepPercent
                                    : option.positionStepPercent
                            } percent apart`
                        }
                        aria-disabled={running || undefined}
                        checked={level === option.id}
                        onChange={() => {
                            if (!running) setLevel(option.id)
                        }}
                    />
                ))}
            </fieldset>

            <fieldset>
                <legend>Session</legend>
                <Form.Check
                    type="radio"
                    name="sf-session"
                    id="sf-session-practice"
                    label={`Practice — ${STEREO_CONFIG.lives} lives, no time limit`}
                    aria-disabled={running || undefined}
                    checked={session === "practice"}
                    onChange={() => {
                        if (!running) setSession("practice")
                    }}
                />
                <Form.Check
                    type="radio"
                    name="sf-session"
                    id="sf-session-timed"
                    label={
                        timeAttackAllowed
                            ? `Time attack — ${STEREO_CONFIG.timeAttackSeconds} seconds, as many as you can`
                            : `Time attack — not available on this level`
                    }
                    aria-disabled={running || !timeAttackAllowed || undefined}
                    checked={timeAttack}
                    onChange={() => {
                        if (!running && timeAttackAllowed) setSession("timed")
                    }}
                />
            </fieldset>

            <GameShell api={api} heading={heading} />
        </>
    )
}
