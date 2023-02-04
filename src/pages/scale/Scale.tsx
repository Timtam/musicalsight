import TonalChord from "@tonaljs/chord";
import TonalNote from "@tonaljs/note";
import TonalScale from "@tonaljs/scale";
import TonalScaleType from "@tonaljs/scale-type";
import { useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Table from "react-bootstrap/Table";
import { Helmet } from "react-helmet";
import { LinkContainer } from "react-router-bootstrap";
import { Link, useParams } from "react-router-dom";
import { titleCase } from "title-case";
import * as Tone from "tone";
import PlaybackService from "../../services/PlaybackService";
import {
    isNoteLink,
    mapLinkToNote,
    mapNoteToLink,
    mapNoteToName,
    mapToIntervalName,
} from "../../utilities";
import NotFound from "../not-found/NotFound";

function ScaleComponent() {
    let playback: PlaybackService = useMemo(() => {
        return new PlaybackService();
    }, []);
    let { note, scale } = useParams<{
        note: string;
        scale: string;
    }>();

    if (note === undefined) note = "c";

    useEffect(() => {
        (async () => {
            await playback.initialize();
        })();
    }, [playback]);

    let found = true;

    if (
        scale === undefined ||
        !TonalScaleType.names().includes(scale) ||
        !isNoteLink(note)
    )
        found = false;
    else note = mapLinkToNote(note);

    let [currentNote, setCurrentNote] = useState(note!);

    if (!found) return <NotFound />;

    let toString = () => {
        return titleCase(unescape(scale!) + " scale");
    };

    let playKey = async () => {
        let notes: string[] = [
            ...TonalScale.get(currentNote + "4 " + unescape(scale!)).notes,
            currentNote + "5",
            ...TonalScale.get(
                currentNote + "4 " + unescape(scale!)
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
            playback.playNote(note, length, when);
            when += Tone.Time(length).toSeconds();
        }
    };

    let renderNotes = () => {
        return (
            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h4">
                        Key of{" "}
                        {mapNoteToName(currentNote) +
                            " " +
                            titleCase(unescape(scale!))}
                    </Card.Title>
                    <Card.Text>
                        The following notes are included in this scale by
                        applying the above intervals to the selected root note:{" "}
                        {TonalScale.get(
                            currentNote + "4 " + unescape(scale!)
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
                    <Card.Link onClick={playKey}>Listen to the notes</Card.Link>
                </Card.Body>
            </Card>
        );
    };

    let renderChords = () => {
        return (
            <>
                <Card className="text-center">
                    <Card.Body>
                        <Card.Title as="h4">
                            Chords rooted at {mapNoteToName(currentNote)} within
                            the {titleCase(unescape(scale!))} scale{" "}
                        </Card.Title>
                    </Card.Body>
                    <Card.Text>
                        The following chords can be built by using{" "}
                        {mapNoteToName(currentNote)} as your root note within
                        the {titleCase(unescape(scale!))} scale. You can follow
                        the links to get more information on the specific chords
                        or use the preview buttons to preview them from scratch.
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
                            currentNote + " " + unescape(scale!)
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
                                            currentNote
                                        }
                                    >
                                        {titleCase(
                                            TonalChord.getChord(
                                                chord,
                                                currentNote
                                            ).name
                                        )}
                                    </Link>
                                </td>
                                <td>
                                    <Button
                                        onClick={async () => {
                                            playback.playChord(
                                                TonalChord.getChord(
                                                    chord,
                                                    currentNote + "4"
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
                                            playback.playChord(
                                                TonalChord.getChord(
                                                    chord,
                                                    currentNote + "4"
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
                                            playback.playChord(
                                                TonalChord.getChord(
                                                    chord,
                                                    currentNote + "4"
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
    };

    return (
        <>
            <Helmet>
                <title>
                    {mapNoteToName(currentNote) + " " + toString()} - Musical
                    Sight
                </title>
            </Helmet>
            <h3>{toString()}</h3>
            Select the current scale:
            <DropdownButton
                title={"Selected scale: " + titleCase(unescape(scale!))}
            >
                {TonalScaleType.names()
                    .sort()
                    .map((scale) => (
                        <LinkContainer
                            to={
                                "/scales/" +
                                escape(scale) +
                                "/" +
                                mapNoteToLink(currentNote)
                            }
                        >
                            <Dropdown.Item>{titleCase(scale)}</Dropdown.Item>
                        </LinkContainer>
                    ))}
            </DropdownButton>
            <h3>
                {"General information about the " +
                    titleCase(unescape(scale!)) +
                    " scale"}
            </h3>
            <Card className="text-center">
                <Card.Body>
                    <Card.Title>Intervals</Card.Title>
                    <Card.Text>
                        A scale consists of a root note and a certain amount of
                        intervals applied to the root note to find the next note
                        of the scale.
                    </Card.Text>
                    <Card.Text>
                        The following intervals determine this scale:{" "}
                        <ul>
                            {TonalScale.get(unescape(scale!)).intervals.map(
                                (interval) => (
                                    <li>{mapToIntervalName(interval)}</li>
                                )
                            )}
                        </ul>
                    </Card.Text>
                </Card.Body>
            </Card>
            Select the root note to apply the scale to:
            <DropdownButton
                title={"Selected note: " + mapNoteToName(currentNote)}
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
                        to={"/scales/" + scale! + "/" + mapNoteToLink(note)}
                    >
                        <Dropdown.Item onClick={() => setCurrentNote(note)}>
                            {mapNoteToName(note)}
                        </Dropdown.Item>
                    </LinkContainer>
                ))}
            </DropdownButton>
            {renderNotes()}
            {renderChords()}
        </>
    );
}

export const Scale = ScaleComponent;
