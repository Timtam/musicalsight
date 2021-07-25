import React, { Component } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet";

class Notes extends Component {
    render() {
        return (
            <>
                <Helmet>
                    <title>Notes - Musical Sight</title>
                </Helmet>

                <ListGroup>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/c"}
                    >
                        C
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/c-sharp"}
                    >
                        C sharp
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/d"}
                    >
                        D
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/d-sharp"}
                    >
                        D sharp
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/e"}
                    >
                        E
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/f"}
                    >
                        F
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/f-sharp"}
                    >
                        F sharp
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/g"}
                    >
                        G
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/g-sharp"}
                    >
                        G sharp
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/a"}
                    >
                        A
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/a-sharp"}
                    >
                        A sharp
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        href={process.env.PUBLIC_URL + "/notes/b"}
                    >
                        B
                    </ListGroup.Item>
                </ListGroup>
            </>
        );
    }
}

export default Notes;
