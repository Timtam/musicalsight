import { Piano } from "@tonejs/piano";
import { Component } from "react";
import * as Tone from "tone";

class Playback<T1, T2> extends Component<T1, T2> {
    initialized: boolean;
    piano: Piano;

    constructor(props: T1) {
        super(props);

        this.initialized = false;
        this.piano = new Piano();

        this.piano.toDestination();
    }

    async initialize() {
        if (this.initialized) return;

        await Tone.start();
        await this.piano.load();
        this.initialized = true;
    }

    playNote(note: string, length: string = "8n", when: number = Tone.now()) {
        this.piano.keyDown({
            note: note,
            time: when,
        });

        this.piano.keyUp({
            note: note,
            time: when + Tone.Time(length).toSeconds(),
        });
    }
}

export default Playback;
