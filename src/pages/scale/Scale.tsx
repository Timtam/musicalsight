import TonalNote from "@tonaljs/note";
import TonalScale from "@tonaljs/scale";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";
import { titleCase } from "title-case";
import * as Tone from "tone";
import Playback from "../../components/Playback";
import { mapNoteToLink, mapNoteToName } from "../../utilities";

type PathParamsType = {
    scale: string;
};

type PropsType = RouteComponentProps<PathParamsType> & {};

type StateType = {
    currentNote: string;
};

class Scale extends Playback<PropsType, StateType> {
    constructor(props: PropsType) {
        super(props);

        this.state = {
            currentNote: "c",
        };
    }

    toString() {
        return titleCase(unescape(this.props.match.params.scale) + " scale");
    }

    async playScale() {
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

        await this.initialize();

        let when: number = Tone.now();

        for (let i = 0; i < notes.length; i++) {
            let note = TonalNote.simplify(notes[i]);
            let length = lengths[i];
            this.playNote(note, length, when);
            when += Tone.Time(length).toSeconds();
        }
    }

    renderScale() {
        return (
            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h4">
                        {mapNoteToName(this.state.currentNote)}
                    </Card.Title>
                    <Card.Text>
                        The following notes are included in this scale:{" "}
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
                    <Card.Link onClick={async () => await this.playScale()}>
                        Listen to the scale
                    </Card.Link>
                </Card.Body>
            </Card>
        );
    }

    render() {
        return (
            <>
                <Helmet>
                    <title>{this.toString()} - Musical Sight</title>
                </Helmet>
                <h3>{this.toString()}</h3>
                Select the root note to choose the key for:
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
                        <Dropdown.Item
                            onClick={() =>
                                this.setState({
                                    currentNote: note,
                                })
                            }
                        >
                            {mapNoteToName(note)}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
                {this.renderScale()}
            </>
        );
    }
}

export default withRouter(Scale);
