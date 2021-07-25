import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import { titleCase } from "title-case";
import Playback from "../../components/Playback";

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
            currentNote: "C",
        };
    }

    toString() {
        return titleCase(unescape(this.props.match.params.scale) + " scale");
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
                    title={"Selected note: " + this.state.currentNote}
                >
                    {[
                        "C",
                        "C sharp",
                        "D",
                        "D sharp",
                        "E",
                        "F",
                        "F sharp",
                        "G",
                        "G sharp",
                        "A",
                        "A sharp",
                        "B",
                    ].map((note) => (
                        <Dropdown.Item
                            onClick={() => this.setState({ currentNote: note })}
                        >
                            {note}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
            </>
        );
    }
}

export default withRouter(Scale);
