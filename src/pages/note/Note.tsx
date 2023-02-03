import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Redirect, useParams } from "react-router-dom";
import PlaybackService from "../../services/PlaybackService";
import { isNoteLink, mapLinkToNote } from "../../utilities";

function NoteComponent() {
    let playback: PlaybackService = useMemo(() => {
        return new PlaybackService();
    }, []);
    let { note } = useParams<{
        note: string;
    }>();

    useEffect(() => {
        (async () => {
            await playback.initialize();
        })();
    }, [playback]);

    if (!isNoteLink(note)) return <Redirect to="/not-found" />;

    note = mapLinkToNote(note);

    let toString = () => {
        return note[0].toUpperCase() + note.substr(1);
    };

    return (
        <>
            <Helmet>
                <title>{toString()} - Musical Sight</title>
            </Helmet>

            <h3>{toString()}</h3>

            <button
                onClick={() => {
                    playback.playNote(note + "4");
                }}
            >
                Listen now
            </button>
        </>
    );
}

export const Note = NoteComponent;
