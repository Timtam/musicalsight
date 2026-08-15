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
    const [session, setSession] = useState<"practice" | "timed" | "calibrate">(
        "practice",
    )
    const [seed] = useState(randomSeed)

    // A level may rule out time attack, so the choice cannot simply be
    // trusted — it has to be checked against the selected level.
    const timeAttackAllowed =
        EQ_CONFIG.levels.find((option) => option.id === level)
            ?.supportsTimeAttack !== false
    const timeAttack = session === "timed" && timeAttackAllowed
    const calibrating = session === "calibrate"
    const calibrationRounds =
        EQ_CONFIG.calibration.trials + EQ_CONFIG.calibration.catchTrials

    const spec = useMemo(() => createEqDetective(), [])
    const engineSettings = useMemo(
        () => ({
            level,
            timeAttackSeconds: timeAttack ? EQ_CONFIG.timeAttackSeconds : null,
            // A measurement runs a fixed number of trials and has no wrong
            // answers to lose a life over.
            maxRounds: calibrating ? calibrationRounds : null,
            livesEnabled: !calibrating,
            seed,
            game: { ...settings, calibrate: calibrating },
        }),
        [level, timeAttack, calibrating, calibrationRounds, settings, seed],
    )

    const api = useGame(spec, engineSettings, Assets)

    // Settings are snapshotted when start() runs, so changes during a
    // session take effect in the next one. Hence aria-disabled with an
    // ignored handler rather than disabled, which would drop the controls
    // out of the tab order without saying so.
    const running = api.state.phase !== "idle" && api.state.phase !== "over"

    const heading =
        api.state.phase === "over"
            ? calibrating
                ? "Calibration finished"
                : "Training finished"
            : calibrating
              ? "EQ Detective calibration"
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
                <legend>How hard it is to hear</legend>
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
                    checked={session === "practice"}
                    onChange={() => {
                        if (!running) setSession("practice")
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
                        if (!running && timeAttackAllowed) setSession("timed")
                    }}
                />
                <Form.Check
                    type="radio"
                    name="eqd-session"
                    id="eqd-session-calibrate"
                    label={`Calibration — ${calibrationRounds} rounds, finds a good starting depth for you`}
                    aria-disabled={running || undefined}
                    checked={calibrating}
                    onChange={() => {
                        if (!running) setSession("calibrate")
                    }}
                />
            </fieldset>

            {calibrating && (
                <p>
                    Calibration ignores the level and the depth above. The music
                    starts unchanged and one band drifts away from flat very
                    slowly; press the button the moment you notice. Some rounds
                    change nothing at all.
                </p>
            )}

            <GameShell api={api} heading={heading} />
        </>
    )
}
