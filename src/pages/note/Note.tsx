import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import Playback from "../../components/Playback";

type PathParamsType = {
    note: string;
};

type PropsType = RouteComponentProps<PathParamsType> & {};

class Note extends Playback<PropsType> {
    note: string;

    constructor(props: PropsType) {
        super(props);

        // parsing the note out of the url parameter
        this.note = this.props.match.params.note.charAt(0)

        if(this.props.match.params.note.match(/[a-g]-(sharp|flat)/i))
            this.note += "#"

    }

    render() {
        return (
            <>
                <Helmet>
                    <title>
                        {this.note.toUpperCase()} - Musical Sight
                    </title>
                </Helmet>

                <button onClick={async () => { await this.playChord([ this.note + "4", "e4", "g4"])}}>Just play it</button>
            </>
        );
    }
}

export default withRouter(Note);
