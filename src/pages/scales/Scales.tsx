import ScaleType from "@tonaljs/scale-type"
import Card from "react-bootstrap/Card"
import ListGroup from "react-bootstrap/ListGroup"
import { LinkContainer } from "react-router-bootstrap"
import { Link } from "react-router-dom"
import Head from "../../components/Head"

function Scales() {
    return (
        <>
            <Head title="Scales" />

            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h3">Scales</Card.Title>
                    <Card.Text>
                        Musical theory describes scales to be a set of intervals
                        that can be applied to any given note to find other
                        notes that can be used together to create a musically
                        appealing melody. There are alot different scales, but
                        the most common ones in western music are probably the{" "}
                        <Link to="/scales/major">major</Link> and the{" "}
                        <Link to="/scales/aeolian">
                            natural minor (also known as aeolian)
                        </Link>{" "}
                        scales.
                    </Card.Text>
                    <Card.Text>
                        You will find the alphabetically sorted list of all
                        common scales below. Follow the links to find more
                        information about the scales, find the keys associated
                        with them and audio examples as well.
                    </Card.Text>
                </Card.Body>
            </Card>

            <h3>Scales List</h3>

            <ListGroup>
                {ScaleType.names()
                    .sort()
                    .map((scale) => (
                        <LinkContainer to={"/scales/" + escape(scale)}>
                            <ListGroup.Item action>{scale}</ListGroup.Item>
                        </LinkContainer>
                    ))}
            </ListGroup>
        </>
    )
}

export default Scales
