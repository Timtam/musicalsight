import { Helmet } from "react-helmet";
import { RouteComponentProps, withRouter } from "react-router";
import { titleCase } from "title-case";
import Playback from "../../components/Playback";

type PathParamsType = {
    scale: string;
};

type PropsType = RouteComponentProps<PathParamsType> & {};

class Scale extends Playback<PropsType> {
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
            </>
        );
    }
}

export default withRouter(Scale);
