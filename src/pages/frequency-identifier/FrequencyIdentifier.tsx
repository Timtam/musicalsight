import FA from "../../components/FocusAnchor"
import Game from "../../components/Game"
import Head from "../../components/Head"
import FrequencyIdentifierGame from "../../games/frequency-identifier/FrequencyIdentifier"

export default function FrequencyIdentifier() {
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
            <Game>
                <FrequencyIdentifierGame level={1} />
            </Game>
        </>
    )
}
