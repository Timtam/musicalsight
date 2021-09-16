import TonalChord from "@tonaljs/chord";
import TonalChordType from "@tonaljs/chord-type";
import TonalNote from "@tonaljs/note";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import { LinkContainer } from "react-router-bootstrap";
import { Link } from "react-router-dom";
import { titleCase } from "title-case";
import * as Tone from "tone";
import Playback from "../../components/Playback";
import { mapLinkToNote, mapNoteToLink, mapNoteToName } from "../../utilities";

type PathParamsType = {
    chord: string;
    note: string;
};

export type PropsType = RouteComponentProps<PathParamsType> & {};

type StateType = {
    currentNote: string;
};

class ChordComponent extends Playback<PropsType, StateType> {
    constructor(props: PropsType) {
        super(props);

        let note = "c";

        if (this.props.match.params.note !== undefined)
            note = mapLinkToNote(this.props.match.params.note);

        this.state = {
            currentNote: note,
        };
    }

    async playArpeggiatedChord(offset: string) {
        let notes = TonalChord.getChord(
            unescape(this.props.match.params.chord),
            this.state.currentNote + "4"
        ).notes;
        let lengths: number[] = notes.map(
            (note, i, arr) =>
                Tone.Time("2n").toSeconds() +
                Tone.Time(offset).toSeconds() * (notes.length - i)
        );

        await this.initialize();

        let when: number = Tone.now();

        for (let i = 0; i < notes.length; i++) {
            this.playNote(TonalNote.simplify(notes[i]), lengths[i], when);
            when += Tone.Time(offset).toSeconds();
        }
    }

    async playChord() {
        let notes = TonalChord.getChord(
            unescape(this.props.match.params.chord),
            this.state.currentNote + "4"
        ).notes;

        await this.initialize();

        let when: number = Tone.now();

        for (let i = 0; i < notes.length; i++) {
            this.playNote(TonalNote.simplify(notes[i]), "2n", when);
        }
    }

    render() {
        return (
            <>
                <Helmet>
                    <title>
                        {titleCase(
                            TonalChord.getChord(
                                unescape(this.props.match.params.chord),
                                this.state.currentNote
                            ).name + " chord"
                        )}{" "}
                        - Musical Sight
                    </title>
                </Helmet>
                <h3>
                    {titleCase(
                        TonalChord.getChord(
                            unescape(this.props.match.params.chord)
                        ).name + " chord"
                    )}
                </h3>
                Select the current chord:
                <DropdownButton
                    title={
                        "Selected chord: " +
                        titleCase(
                            TonalChord.getChord(
                                unescape(this.props.match.params.chord)
                            ).name
                        )
                    }
                >
                    {TonalChordType.names()
                        .sort()
                        .map((chord) => (
                            <LinkContainer
                                to={
                                    "/chords/" +
                                    escape(chord) +
                                    "/" +
                                    mapNoteToLink(this.state.currentNote)
                                }
                            >
                                <Dropdown.Item>
                                    {titleCase(chord)}
                                </Dropdown.Item>
                            </LinkContainer>
                        ))}
                </DropdownButton>
                Select the tonic note for this chord:
                <DropdownButton
                    title={
                        "Tonic note: " + mapNoteToName(this.state.currentNote)
                    }
                >
                    {[
                        "c",
                        "c#",
                        "d",
                        "d#",
                        "e",
                        "f",
                        "f#",
                        "g",
                        "g#",
                        "a",
                        "a#",
                        "b",
                    ].map((note) => (
                        <LinkContainer
                            replace
                            to={
                                "/chords/" +
                                escape(this.props.match.params.chord) +
                                "/" +
                                mapNoteToLink(note)
                            }
                        >
                            <Dropdown.Item
                                onClick={() =>
                                    this.setState({ currentNote: note })
                                }
                            >
                                {mapNoteToName(note)}
                            </Dropdown.Item>
                        </LinkContainer>
                    ))}
                </DropdownButton>
                <Card className="text-center">
                    <Card.Body>
                        <Card.Title as="h4">
                            {titleCase(
                                TonalChord.getChord(
                                    unescape(this.props.match.params.chord),
                                    this.state.currentNote
                                ).name + " chord"
                            )}
                        </Card.Title>
                        <Card.Text>
                            The following notes are included in this chord:{" "}
                            {TonalChord.getChord(
                                unescape(this.props.match.params.chord),
                                this.state.currentNote
                            ).notes.map((note) => (
                                <Link
                                    to={
                                        "/notes/" +
                                        mapNoteToLink(TonalNote.simplify(note))
                                    }
                                >
                                    {mapNoteToName(TonalNote.simplify(note))}
                                </Link>
                            ))}
                        </Card.Text>
                        <Card.Link
                            onClick={async () =>
                                await this.playArpeggiatedChord("4n")
                            }
                        >
                            Listen to the slowly arpeggiated chord
                        </Card.Link>
                        <Card.Link
                            onClick={async () =>
                                await this.playArpeggiatedChord("32n")
                            }
                        >
                            Listen to the quickly arpeggiated chord
                        </Card.Link>
                        <Card.Link onClick={async () => await this.playChord()}>
                            Listen to the full chord
                        </Card.Link>
                    </Card.Body>
                </Card>
            </>
        );
    }
}

export const Chord = withRouter(ChordComponent);
