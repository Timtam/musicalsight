import { useMemo, useState } from "react"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import FA from "../../components/FocusAnchor"
import GameShell from "../../components/game/GameShell"
import Head from "../../components/Head"
import {
    COMP_CONFIG,
    createDynamics,
    type CompSettings,
} from "../../games/dynamics/Dynamics"
import { randomSeed } from "../../games/engine/grid"
import { useGame } from "../../games/engine/useGame"
import { useTrackLibrary } from "../../games/engine/useTrackLibrary"

export default function Dynamics() {
    const [level, setLevel] = useState(COMP_CONFIG.levels[0].id)
    const [settings, setSettings] = useState<CompSettings>(
        COMP_CONFIG.defaultSettings,
    )
    const [session, setSession] = useState<"practice" | "timed">("practice")
    const [seed] = useState(randomSeed)

    // A level may rule out time attack, so the choice cannot simply be
    // trusted — it has to be checked against the selected level.
    const timeAttackAllowed =
        COMP_CONFIG.levels.find((option) => option.id === level)
            ?.supportsTimeAttack !== false
    const timeAttack = session === "timed" && timeAttackAllowed

    const spec = useMemo(() => createDynamics(), [])
    const engineSettings = useMemo(
        () => ({
            level,
            timeAttackSeconds: timeAttack
                ? COMP_CONFIG.timeAttackSeconds
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
        api.state.phase === "over" ? "Training finished" : "Dynamics training"

    return (
        <>
            <Head title="Dynamics" />
            <FA title="Dynamics" />

            <Card>
                <Card.Body>
                    <Card.Title as="h4">How it works</Card.Title>
                    <Card.Text>
                        A compressor turns the loud parts down. That dulls the
                        attack of a hit, and it brings up whatever sits between
                        the hits — the room, the reverb tail, the quiet detail.
                        Those are the cues worth listening for.
                    </Card.Text>
                    <Card.Text>
                        What it also does is make the music quieter, which would
                        give the answer away for free. So every version is
                        measured while the opening seconds play and matched to
                        the untouched one. They are the same loudness on
                        purpose: if one just sounds quieter, that is not the
                        compressor, it is you.
                    </Card.Text>
                </Card.Body>
            </Card>

            <fieldset>
                <legend>What to listen for</legend>
                {COMP_CONFIG.asks.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="dy-ask"
                        id={`dy-ask-${option.id}`}
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
                {COMP_CONFIG.levels.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="dy-level"
                        id={`dy-level-${option.id}`}
                        label={
                            `${option.label} — ${option.description}, ` +
                            `threshold ${option.thresholdDb} decibels`
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
                    name="dy-session"
                    id="dy-session-practice"
                    label={`Practice — ${COMP_CONFIG.lives} lives, no time limit`}
                    aria-disabled={running || undefined}
                    checked={session === "practice"}
                    onChange={() => {
                        if (!running) setSession("practice")
                    }}
                />
                <Form.Check
                    type="radio"
                    name="dy-session"
                    id="dy-session-timed"
                    label={
                        timeAttackAllowed
                            ? `Time attack — ${COMP_CONFIG.timeAttackSeconds} seconds, as many as you can`
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
