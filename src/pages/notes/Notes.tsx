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
                    <ListGroup.Item action href="/notes/c">
                        C
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/c-sharp">
                        C sharp
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/d">
                        D
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/d-sharp">
                        D sharp
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/e">
                        E
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/f">
                        F
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/f-sharp">
                        F sharp
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/g">
                        G
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/g-sharp">
                        G sharp
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/a">
                        A
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/a-sharp">
                        A sharp
                    </ListGroup.Item>
                    <ListGroup.Item action href="/notes/b">
                        B
                    </ListGroup.Item>
                </ListGroup>
            </>
        );
    }
}

export default Notes;
