import Note from "@tonaljs/note"
import { Piano } from "@tonejs/piano"
import * as Tone from "tone"

class PlaybackService {
    initialized: boolean
    piano: Piano

    constructor() {
        this.initialized = false
        this.piano = new Piano()

        this.piano.toDestination()
    }

    async initialize() {
        if (this.initialized) return

        await Tone.start()
        await this.piano.load()
        this.initialized = true
    }

    playNote(
        note: string,
        length: string | number = "8n",
        when: number = Tone.now(),
    ) {
        this.piano.keyDown({
            note: note,
            time: when,
        })

        this.piano.keyUp({
            note: note,
            time:
                when +
                (typeof length === "number"
                    ? length
                    : Tone.Time(length).toSeconds()),
        })
    }

    playChord(notes: string[], offset?: string) {
        let lengths: number[] = notes.map(
            (note, i, arr) =>
                Tone.Time("2n").toSeconds() +
                (offset === undefined
                    ? 0
                    : Tone.Time(offset).toSeconds() * (notes.length - i)),
        )

        let when: number = Tone.now()

        for (let i = 0; i < notes.length; i++) {
            this.playNote(Note.simplify(notes[i]), lengths[i], when)
            when += offset === undefined ? 0 : Tone.Time(offset).toSeconds()
        }
    }
}

export default PlaybackService
