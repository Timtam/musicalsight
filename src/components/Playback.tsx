import { Component } from "react";
import * as Tone from "tone";

class Playback<T1, T2> extends Component<T1, T2> {
    synth: Tone.PolySynth;

    constructor(props: T1) {
        super(props);

        this.synth = new Tone.PolySynth(Tone.Synth);

        this.synth.toDestination();
    }

    async playNote(
        note: string,
        length: string = "8n",
        when: number | string = ""
    ) {
        await Tone.start();

        if (when === "") when = Tone.now();

        this.synth.triggerAttackRelease(note, length, when);
    }

    async playChord(notes: string[]) {
        await Tone.start();

        this.synth.triggerAttackRelease(notes, "8n");
    }
}

export default Playback;
