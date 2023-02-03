import TonalChord from "@tonaljs/chord";
import TonalNote from "@tonaljs/note";
import TonalScale from "@tonaljs/scale";
import TonalScaleType from "@tonaljs/scale-type";
import { Component } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Table from "react-bootstrap/Table";
import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import { LinkContainer } from "react-router-bootstrap";
import { Link } from "react-router-dom";
import { titleCase } from "title-case";
import * as Tone from "tone";
import PlaybackService from "../../services/PlaybackService";
import {
    mapLinkToNote,
    mapNoteToLink,
    mapNoteToName,
    mapToIntervalName,
} from "../../utilities";

type PathParamsType = {
    note: string;
    scale: string;
};

export type PropsType = RouteComponentProps<PathParamsType> & {};

type StateType = {
    currentNote: string;
};

class ScaleComponent extends Component<PropsType, StateType> {
    playback: PlaybackService;

    constructor(props: PropsType) {
        super(props);

        let note = "c";

        this.playback = new PlaybackService();

        if (this.props.match.params.note !== undefined)
            note = mapLinkToNote(this.props.match.params.note);

        this.state = {
            currentNote: note,
        };
    }

    async componentDidMount() {
        await this.playback.initialize();
    }

    toString() {
        return titleCase(unescape(this.props.match.params.scale) + " scale");
    }

    async playKey() {
        let notes: string[] = [
            ...TonalScale.get(
                this.state.currentNote +
                    "4 " +
                    unescape(this.props.match.params.scale)
            ).notes,
            this.state.currentNote + "5",
            ...TonalScale.get(
                this.state.currentNote +
                    "4 " +
                    unescape(this.props.match.params.scale)
            ).notes.reverse(),
        ];
        let lengths: string[] = notes.map((note, i, arr) => {
            if (i === arr.length - 1) return "2n";
            return "4n";
        });

        let when: number = Tone.now();

        for (let i = 0; i < notes.length; i++) {
            let note = TonalNote.simplify(notes[i]);
            let length = lengths[i];
            this.playback.playNote(note, length, when);
            when += Tone.Time(length).toSeconds();
        }
    }

    renderNotes() {
        return (
            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h4">
                        Key of{" "}
                        {mapNoteToName(this.state.currentNote) +
                            " " +
                            titleCase(unescape(this.props.match.params.scale))}
                    </Card.Title>
                    <Card.Text>
                        The following notes are included in this scale by
                        applying the above intervals to the selected root note:{" "}
                        {TonalScale.get(
                            this.state.currentNote +
                                "4 " +
                                unescape(this.props.match.params.scale)
                        ).notes.map((note) => (
                            <Link
                                to={
                                    "/notes/" +
                                    mapNoteToLink(
                                        TonalNote.simplify(note.slice(0, -1))
                                    )
                                }
                            >
                                {mapNoteToName(
                                    TonalNote.simplify(note.slice(0, -1))
                                )}
                            </Link>
                        ))}
                    </Card.Text>
                    <Card.Link onClick={async () => await this.playKey()}>
                        Listen to the notes
                    </Card.Link>
                </Card.Body>
            </Card>
        );
    }

    renderChords() {
        return (
            <>
                <Card className="text-center">
                    <Card.Body>
                        <Card.Title as="h4">
                            Chords rooted at{" "}
                            {mapNoteToName(this.state.currentNote)} within the{" "}
                            {titleCase(unescape(this.props.match.params.scale))}{" "}
                            scale{" "}
                        </Card.Title>
                    </Card.Body>
                    <Card.Text>
                        The following chords can be built by using{" "}
                        {mapNoteToName(this.state.currentNote)} as your root
                        note within the{" "}
                        {titleCase(unescape(this.props.match.params.scale))}{" "}
                        scale. You can follow the links to get more information
                        on the specific chords or use the preview buttons to
                        preview them from scratch.
                    </Card.Text>
                </Card>
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Preview slowly arpeggiated</th>
                            <th>Preview quickly arpeggiated</th>
                            <th>Preview full chord</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TonalScale.scaleChords(
                            this.state.currentNote +
                                " " +
                                unescape(this.props.match.params.scale)
                        ).map((chord) => (
                            <tr>
                                <td>
                                    <Link
                                        to={
                                            "/chords/" +
                                            escape(
                                                TonalChord.getChord(chord).name
                                            ) +
                                            "/" +
                                            this.state.currentNote
                                        }
                                    >
                                        {titleCase(
                                            TonalChord.getChord(
                                                chord,
                                                this.state.currentNote
                                            ).name
                                        )}
                                    </Link>
                                </td>
                                <td>
                                    <Button
                                        onClick={async () => {
                                            this.playback.playChord(
                                                TonalChord.getChord(
                                                    chord,
                                                    this.state.currentNote + "4"
                                                ).notes,
                                                "4n"
                                            );
                                        }}
                                    >
                                        Preview
                                    </Button>
                                </td>
                                <td>
                                    <Button
                                        onClick={async () => {
                                            this.playback.playChord(
                                                TonalChord.getChord(
                                                    chord,
                                                    this.state.currentNote + "4"
                                                ).notes,
                                                "32n"
                                            );
                                        }}
                                    >
                                        Preview
                                    </Button>
                                </td>
                                <td>
                                    <Button
                                        onClick={async () => {
                                            this.playback.playChord(
                                                TonalChord.getChord(
                                                    chord,
                                                    this.state.currentNote + "4"
                                                ).notes
                                            );
                                        }}
                                    >
                                        Preview
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </>
        );
    }

    render() {
        return (
            <>
                <Helmet>
                    <title>
                        {mapNoteToName(this.state.currentNote) +
                            " " +
                            this.toString()}{" "}
                        - Musical Sight
                    </title>
                </Helmet>
                <h3>{this.toString()}</h3>
                Select the current scale:
                <DropdownButton
                    title={
                        "Selected scale: " +
                        titleCase(unescape(this.props.match.params.scale))
                    }
                >
                    {TonalScaleType.names()
                        .sort()
                        .map((scale) => (
                            <LinkContainer
                                to={
                                    "/scales/" +
                                    escape(scale) +
                                    "/" +
                                    mapNoteToLink(this.state.currentNote)
                                }
                            >
                                <Dropdown.Item>
                                    {titleCase(scale)}
                                </Dropdown.Item>
                            </LinkContainer>
                        ))}
                </DropdownButton>
                <h3>
                    {"General information about the " +
                        titleCase(unescape(this.props.match.params.scale)) +
                        " scale"}
                </h3>
                <Card className="text-center">
                    <Card.Body>
                        <Card.Title>Intervals</Card.Title>
                        <Card.Text>
                            A scale consists of a root note and a certain amount
                            of intervals applied to the root note to find the
                            next note of the scale.
                        </Card.Text>
                        <Card.Text>
                            The following intervals determine this scale:{" "}
                            <ul>
                                {TonalScale.get(
                                    unescape(this.props.match.params.scale)
                                ).intervals.map((interval) => (
                                    <li>{mapToIntervalName(interval)}</li>
                                ))}
                            </ul>
                        </Card.Text>
                    </Card.Body>
                </Card>
                Select the root note to apply the scale to:
                <DropdownButton
                    title={
                        "Selected note: " +
                        mapNoteToName(this.state.currentNote)
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
                                "/scales/" +
                                escape(this.props.match.params.scale) +
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
                {this.renderNotes()}
                {this.renderChords()}
            </>
        );
    }
}

export const Scale = withRouter(ScaleComponent);
