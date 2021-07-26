import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import Playback from "../../components/Playback";

type PathParamsType = {
    note: string;
};

type PropsType = RouteComponentProps<PathParamsType> & {};

class Note extends Playback<PropsType, {}> {
    note: string;

    constructor(props: PropsType) {
        super(props);

        // parsing the note out of the url parameter
        this.note = this.props.match.params.note.charAt(0);

        if (this.props.match.params.note.match(/[a-g]-sharp/i))
            this.note += "#";
        else if (this.props.match.params.note.match(/[a-g]-flat/i))
            this.note += "b";
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

export default withRouter(Note);
