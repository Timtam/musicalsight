import { Component } from "react";
import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import PlaybackService from "../../services/PlaybackService";
import { mapLinkToNote } from "../../utilities";

type PathParamsType = {
    note: string;
};

export type PropsType = RouteComponentProps<PathParamsType> & {};

class NoteComponent extends Component<PropsType, {}> {
    note: string;
    playback: PlaybackService;

    constructor(props: PropsType) {
        super(props);

        // parsing the note out of the url parameter
        this.note = mapLinkToNote(this.props.match.params.note);
        this.playback = new PlaybackService();
    }

    async componentDidMount() {
        await this.playback.initialize();
    }

    toString() {
        return this.note[0].toUpperCase() + this.note.substr(1);
    }

    render() {
        return (
            <>
                <Helmet>
                    <title>{this.toString()} - Musical Sight</title>
                </Helmet>

                <h3>{this.toString()}</h3>

                <button
                    onClick={() => {
                        this.playback.playNote(this.note + "4");
                    }}
                >
                    Listen now
                </button>
            </>
        );
    }
}

export const Note = withRouter(NoteComponent);
