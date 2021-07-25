import { Component } from "react";
import * as Tone from "tone";

class Playback<T> extends Component<T, {}> {
    synth: Tone.PolySynth;

    constructor(props: T) {
        super(props);

        this.synth = new Tone.PolySynth(Tone.Synth);

        this.synth.toDestination();
    }

    async playNote(note: string) {
        await Tone.start();

        this.synth.triggerAttackRelease(note, "8n");
    }

    async playChord(notes: string[]) {
        await Tone.start();

        this.synth.triggerAttackRelease(notes, "8n");
    }
}

export default Playback;
