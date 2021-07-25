import React, { Component } from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet";
import { LinkContainer } from "react-router-bootstrap";

class Notes extends Component {
    render() {
        return (
            <>
                <Helmet>
                    <title>Notes - Musical Sight</title>
                </Helmet>

                <Card className="text-center">
                    <Card.Body>
                        <Card.Title as="h3">Notes</Card.Title>
                        <Card.Text>
                            All melodies and chords consist of the same 12 notes
                            distributed over multiple octaves, starting from
                            octave 0 up to octave 7. Notes are usually written
                            with their corresponding octave number appended to
                            them, the note C in octave 4 being written as C4. C4
                            is also known as the middle C.
                        </Card.Text>
                        <Card.Text>
                            This page lists all 12 notes in ascending order,
                            with all the sharp/flat notes being known as the
                            black keys on a keyboard and every other note being
                            a white key. The highest note (B) is followed by a C
                            again, but within the next octave and vice versa.
                            You can click on any note listed here to open its
                            corresponding page, where you will find listening
                            example and more information on the note, its keys
                            and so on.
                        </Card.Text>
                    </Card.Body>
                </Card>

                <h3>Notes List</h3>

                <ListGroup>
                    {Object.entries({
                        C: "c",
                        "C sharp": "c-sharp",
                        D: "d",
                        "D sharp": "d-sharp",
                        E: "e",
                        F: "f",
                        "F sharp": "f-sharp",
                        G: "g",
                        "G sharp": "g-sharp",
                        A: "a",
                        "A sharp": "a-sharp",
                        B: "b",
                    }).map((note) => (
                        <LinkContainer to={"/notes/" + note[1]}>
                            <ListGroup.Item action>{note[0]}</ListGroup.Item>
                        </LinkContainer>
                    ))}
                </ListGroup>
            </>
        );
    }
}

export default Notes;
