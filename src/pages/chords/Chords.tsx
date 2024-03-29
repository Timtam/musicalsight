import ChordType from "@tonaljs/chord-type"
import Card from "react-bootstrap/Card"
import ListGroup from "react-bootstrap/ListGroup"
import { LinkContainer } from "react-router-bootstrap"
import Head from "../../components/Head"

function Chords() {
    return (
        <>
            <Head title="Chords" />

            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h3">Chords</Card.Title>
                    <Card.Text>
                        You will find the alphabetically sorted list of all
                        common chords below. Follow the links to find more
                        information about the chords, including audio examples.
                    </Card.Text>
                </Card.Body>
            </Card>

            <h3>Chords List</h3>

            <ListGroup>
                {ChordType.names()
                    .sort()
                    .map((chord) => (
                        <LinkContainer to={"/chords/" + escape(chord)}>
                            <ListGroup.Item action>{chord}</ListGroup.Item>
                        </LinkContainer>
                    ))}
            </ListGroup>
        </>
    )
}

export default Chords
