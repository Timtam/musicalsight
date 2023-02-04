import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import PlaybackService from "../../services/PlaybackService";
import { isNoteLink, mapLinkToNote } from "../../utilities";
import NotFound from "../not-found/NotFound";

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

    if (note === undefined || !isNoteLink(note)) return <NotFound />;

    note = mapLinkToNote(note);

    let toString = () => {
        return note![0].toUpperCase() + note!.substr(1);
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
