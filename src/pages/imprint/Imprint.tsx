import Card from "react-bootstrap/Card";
import { Helmet } from "react-helmet";

function Imprint() {
    return (
        <>
            <Helmet>
                <title>Imprint - Musical Sight</title>
            </Helmet>

            <Card className="text-center">
                <Card.Body>
                    <Card.Title>Imprint and related information</Card.Title>
                    <Card.Text>
                        Find all the relevant information here!
                    </Card.Text>
                </Card.Body>
            </Card>
        </>
    );
}

export default Imprint;
