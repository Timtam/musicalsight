import TonalChord from "@tonaljs/chord";
import TonalChordType from "@tonaljs/chord-type";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import { LinkContainer } from "react-router-bootstrap";
import { titleCase } from "title-case";
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

    toString() {
        return titleCase(
            TonalChord.getChord(
                unescape(this.props.match.params.chord),
                this.state.currentNote
            ).name
        );
    }

    render() {
        return (
            <>
                <Helmet>
                    <title>{this.toString()} - Musical Sight</title>
                </Helmet>
                <h3>{this.toString()}</h3>
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
            </>
        );
    }
}

export const Chord = withRouter(ChordComponent);
