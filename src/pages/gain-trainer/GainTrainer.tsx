import { useMemo, useState } from "react"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import Assets from "../../assets"
import FA from "../../components/FocusAnchor"
import GameShell from "../../components/game/GameShell"
import Head from "../../components/Head"
import { randomSeed } from "../../games/engine/grid"
import { useGame } from "../../games/engine/useGame"
import {
    createGainTrainer,
    GAIN_CONFIG,
    type GainSettings,
} from "../../games/gain-trainer/GainTrainer"

export default function GainTrainer() {
    const [level, setLevel] = useState(GAIN_CONFIG.levels[0].id)
    const [settings, setSettings] = useState<GainSettings>(
        GAIN_CONFIG.defaultSettings,
    )
    const [session, setSession] = useState<"practice" | "timed">("practice")
    const [seed] = useState(randomSeed)

    // A level may rule out time attack, so the choice cannot simply be
    // trusted — it has to be checked against the selected level.
    const timeAttackAllowed =
        GAIN_CONFIG.levels.find((option) => option.id === level)
            ?.supportsTimeAttack !== false
    const timeAttack = session === "timed" && timeAttackAllowed

    const spec = useMemo(() => createGainTrainer(), [])
    const engineSettings = useMemo(
        () => ({
            level,
            timeAttackSeconds: timeAttack
                ? GAIN_CONFIG.timeAttackSeconds
                : null,
            maxRounds: null,
            livesEnabled: true,
            seed,
            game: settings,
        }),
        [level, timeAttack, settings, seed],
    )

    const api = useGame(spec, engineSettings, Assets)

    // Settings are snapshotted when start() runs, so changes during a
    // session take effect in the next one. Hence aria-disabled with an
    // ignored handler rather than disabled, which would drop the controls
    // out of the tab order without saying so.
    const running = api.state.phase !== "idle" && api.state.phase !== "over"

    const heading =
        api.state.phase === "over"
            ? "Training finished"
            : "Gain Trainer training"

    return (
        <>
            <Head title="Gain Trainer" />
            <FA title="Gain Trainer" />

            <Card>
                <Card.Body>
                    <Card.Title as="h4">How it works</Card.Title>
                    <Card.Text>
                        You hear a few seconds of music, then the same music at
                        a different level. Switch between the two as often as
                        you like, then say how far apart they are. Some rounds
                        do not change at all, so "no change" is always one of
                        the answers. A wrong answer tells you by how much you
                        missed, so you learn the size and not just the miss.
                    </Card.Text>
                </Card.Body>
            </Card>

            <fieldset>
                <legend>Level</legend>
                {GAIN_CONFIG.levels.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="gt-level"
                        id={`gt-level-${option.id}`}
                        label={`${option.label} — ${option.description}`}
                        aria-disabled={running || undefined}
                        checked={level === option.id}
                        onChange={() => {
                            if (!running) setLevel(option.id)
                        }}
                    />
                ))}
            </fieldset>

            <fieldset>
                <legend>What happens to the level</legend>
                {GAIN_CONFIG.modes.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="gt-mode"
                        id={`gt-mode-${option.id}`}
                        label={option.label}
                        aria-disabled={running || undefined}
                        checked={settings.mode === option.id}
                        onChange={() => {
                            if (!running)
                                setSettings((s) => ({ ...s, mode: option.id }))
                        }}
                    />
                ))}
            </fieldset>

            <fieldset>
                <legend>Session</legend>
                <Form.Check
                    type="radio"
                    name="gt-session"
                    id="gt-session-practice"
                    label={`Practice — ${GAIN_CONFIG.lives} lives, no time limit`}
                    aria-disabled={running || undefined}
                    checked={session === "practice"}
                    onChange={() => {
                        if (!running) setSession("practice")
                    }}
                />
                <Form.Check
                    type="radio"
                    name="gt-session"
                    id="gt-session-timed"
                    label={
                        timeAttackAllowed
                            ? `Time attack — ${GAIN_CONFIG.timeAttackSeconds} seconds, as many as you can`
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
