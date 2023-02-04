import Card from "react-bootstrap/Card";
import Head from "../../components/Head";

function Imprint() {
    return (
        <>
            <Head title="Imprint" />

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
