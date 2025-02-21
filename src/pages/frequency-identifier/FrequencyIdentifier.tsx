import { useState } from "react"
import FA from "../../components/FocusAnchor"
import Game from "../../components/Game"
import Head from "../../components/Head"
import FrequencyIdentifierGame from "../../games/frequency-identifier/FrequencyIdentifier"

export default function FrequencyIdentifier() {
    const [level, setLevel] = useState(1)

    return (
        <>
            <Head title="Frequency Identifier - Ear Training" />
            <FA title="Frequency Identifier - Ear Training" />
            <p>
                In this ear training exercise, you'll listen to a song for a few
                seconds, after which the song will be played back again, but
                with a certain frequency being bosted or attenuated. Your task
                is to guess which frequency got boosted or cut. If you guessed
                correctly, you'll get a different song with a different
                frequency and so on, until you end the game.
            </p>
            <fieldset>
                <legend>Level of prophiciency</legend>
                <div className="form-check">
                    {(
                        [
                            ["Beginner", 1],
                            ["Intermediate", 2],
                        ] as [string, number][]
                    ).map(([name, value]: [string, number]) => (
                        <>
                            <input
                                type="radio"
                                className="form-check-input"
                                id={`level-${name.toLowerCase()}`}
                                checked={level === value}
                                onClick={() => setLevel(value)}
                            />
                            <label
                                htmlFor={`level-${name.toLowerCase()}`}
                                className="form-check-label"
                            >
                                {name}
                            </label>
                        </>
                    ))}
                </div>
            </fieldset>
            <Game>
                <FrequencyIdentifierGame level={level} />
            </Game>
        </>
    )
}
