import TonalChord from "@tonaljs/chord"
import TonalChordType from "@tonaljs/chord-type"
import TonalNote from "@tonaljs/note"
import { useEffect, useMemo, useState } from "react"
import Card from "react-bootstrap/Card"
import Dropdown from "react-bootstrap/Dropdown"
import DropdownButton from "react-bootstrap/DropdownButton"
import { LinkContainer } from "react-router-bootstrap"
import { Link, useParams } from "react-router-dom"
import { titleCase } from "title-case"
import Head from "../../components/Head"
import PlaybackService from "../../services/PlaybackService"
import {
    isNoteLink,
    mapLinkToNote,
    mapNoteToLink,
    mapNoteToName,
} from "../../utilities"
import NotFound from "../not-found/NotFound"

function Chord() {
    const playback: PlaybackService = useMemo(() => {
        return new PlaybackService()
    }, [])

    let { note, chord } = useParams<{
        note: string
        chord: string
    }>()

    if (note === undefined) note = "c"

    let [currentNote, setCurrentNote] = useState(note)
    useEffect(() => {
        ;(async () => {
            await playback.initialize()
        })()
    }, [playback])

    if (
        chord === undefined ||
        !TonalChordType.names().includes(chord) ||
        !isNoteLink(note)
    )
        return <NotFound />

    note = mapLinkToNote(note)

    return (
        <>
            <Head
                title={titleCase(
                    TonalChord.getChord(unescape(chord), currentNote).name +
                        " chord",
                )}
            />
            <h3>
                {titleCase(
                    TonalChord.getChord(unescape(chord)).name + " chord",
                )}
            </h3>
            Select the current chord:
            <DropdownButton
                title={
                    "Selected chord: " +
                    titleCase(TonalChord.getChord(unescape(chord)).name)
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
                                mapNoteToLink(currentNote)
                            }
                        >
                            <Dropdown.Item>{titleCase(chord)}</Dropdown.Item>
                        </LinkContainer>
                    ))}
            </DropdownButton>
            Select the tonic note for this chord:
            <DropdownButton title={"Tonic note: " + mapNoteToName(currentNote)}>
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
                            escape(chord!) +
                            "/" +
                            mapNoteToLink(note)
                        }
                    >
                        <Dropdown.Item onClick={() => setCurrentNote(note)}>
                            {mapNoteToName(note)}
                        </Dropdown.Item>
                    </LinkContainer>
                ))}
            </DropdownButton>
            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h4">
                        {titleCase(
                            TonalChord.getChord(unescape(chord), currentNote)
                                .name + " chord",
                        )}
                    </Card.Title>
                    <Card.Text>
                        The following notes are included in this chord:{" "}
                        {TonalChord.getChord(
                            unescape(chord),
                            currentNote,
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
                        onClick={() => {
                            playback.playChord(
                                TonalChord.getChord(
                                    unescape(chord!),
                                    currentNote + "4",
                                ).notes,
                                "4n",
                            )
                        }}
                    >
                        Listen to the slowly arpeggiated chord
                    </Card.Link>
                    <Card.Link
                        onClick={() => {
                            playback.playChord(
                                TonalChord.getChord(
                                    unescape(chord!),
                                    currentNote + "4",
                                ).notes,
                                "32n",
                            )
                        }}
                    >
                        Listen to the quickly arpeggiated chord
                    </Card.Link>
                    <Card.Link
                        onClick={() => {
                            playback.playChord(
                                TonalChord.getChord(
                                    unescape(chord!),
                                    currentNote + "4",
                                ).notes,
                            )
                        }}
                    >
                        Listen to the full chord
                    </Card.Link>
                </Card.Body>
            </Card>
        </>
    )
}

export default Chord
