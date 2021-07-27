import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import Playback from "../../components/Playback";
import { mapLinkToNote } from "../../utilities";

type PathParamsType = {
    note: string;
};

export type PropsType = RouteComponentProps<PathParamsType> & {};

class NoteComponent extends Playback<PropsType, {}> {
    note: string;

    constructor(props: PropsType) {
        super(props);

        // parsing the note out of the url parameter
        this.note = mapLinkToNote(this.props.match.params.note);
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
                    onClick={async () => {
                        await this.initialize();
                        this.playNote(this.note + "4");
                    }}
                >
                    Listen now
                </button>
            </>
        );
    }
}

export const Note = withRouter(NoteComponent);
