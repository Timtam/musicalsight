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
    createEqDetective,
    EQ_CONFIG,
    type EqSettings,
} from "../../games/eq-detective/EqDetective"

export default function EqDetective() {
    const [level, setLevel] = useState(EQ_CONFIG.levels[0].id)
    const [settings, setSettings] = useState<EqSettings>(
        EQ_CONFIG.defaultSettings,
    )
    const [timed, setTimed] = useState(false)
    const [seed] = useState(randomSeed)

    // A level may rule out time attack, so the choice cannot simply be
    // trusted — it has to be checked against the selected level.
    const timeAttackAllowed =
        EQ_CONFIG.levels.find((option) => option.id === level)
            ?.supportsTimeAttack !== false
    const timeAttack = timed && timeAttackAllowed

    const spec = useMemo(() => createEqDetective(), [])
    const engineSettings = useMemo(
        () => ({
            level,
            timeAttackSeconds: timeAttack ? EQ_CONFIG.timeAttackSeconds : null,
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
            : "EQ Detective training"

    return (
        <>
            <Head title="EQ Detective" />
            <FA title="EQ Detective" />

            <Card>
                <Card.Body>
                    <Card.Title as="h4">How it works</Card.Title>
                    <Card.Text>
                        You hear a few seconds of music untouched, then the same
                        music with one frequency band boosted or cut. Switch
                        between the two as often as you like, then name the
                        band. A wrong answer tells you how far off you were, so
                        you learn the distance and not just the miss.
                    </Card.Text>
                </Card.Body>
            </Card>

            <fieldset>
                <legend>Level</legend>
                {EQ_CONFIG.levels.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="eqd-level"
                        id={`eqd-level-${option.id}`}
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
                <legend>What happens to the frequency</legend>
                {EQ_CONFIG.modes.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="eqd-mode"
                        id={`eqd-mode-${option.id}`}
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
                <legend>How obvious it is</legend>
                {EQ_CONFIG.depths.map((option) => (
                    <Form.Check
                        key={option.id}
                        type="radio"
                        name="eqd-depth"
                        id={`eqd-depth-${option.id}`}
                        label={`${option.label} — ${option.gainDb} decibels`}
                        aria-disabled={running || undefined}
                        checked={settings.depth === option.id}
                        onChange={() => {
                            if (!running)
                                setSettings((s) => ({ ...s, depth: option.id }))
                        }}
                    />
                ))}
            </fieldset>

            <fieldset>
                <legend>Session</legend>
                <Form.Check
                    type="radio"
                    name="eqd-session"
                    id="eqd-session-practice"
                    label={`Practice — ${EQ_CONFIG.lives} lives, no time limit`}
                    aria-disabled={running || undefined}
                    checked={!timeAttack}
                    onChange={() => {
                        if (!running) setTimed(false)
                    }}
                />
                <Form.Check
                    type="radio"
                    name="eqd-session"
                    id="eqd-session-timed"
                    label={
                        timeAttackAllowed
                            ? `Time attack — ${EQ_CONFIG.timeAttackSeconds} seconds, as many as you can`
                            : `Time attack — not available on this level`
                    }
                    aria-disabled={running || !timeAttackAllowed || undefined}
                    checked={timeAttack}
                    onChange={() => {
                        if (!running && timeAttackAllowed) setTimed(true)
                    }}
                />
            </fieldset>

            <GameShell api={api} heading={heading} />
        </>
    )
}
