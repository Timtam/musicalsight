import React, { Component } from "react";
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

                <ListGroup>
                    <LinkContainer to="/notes/c">
                        <ListGroup.Item action>C</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/c-sharp">
                        <ListGroup.Item action>C sharp</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/d">
                        <ListGroup.Item action>D</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/d-sharp">
                        <ListGroup.Item action>D sharp</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/e">
                        <ListGroup.Item action>E</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/f">
                        <ListGroup.Item action>F</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/f-sharp">
                        <ListGroup.Item action>F sharp</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/g">
                        <ListGroup.Item action>G</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/g-sharp">
                        <ListGroup.Item action>G sharp</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/a">
                        <ListGroup.Item action>A</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/a-sharp">
                        <ListGroup.Item action>A sharp</ListGroup.Item>
                    </LinkContainer>
                    <LinkContainer to="/notes/b">
                        <ListGroup.Item action>B</ListGroup.Item>
                    </LinkContainer>
                </ListGroup>
            </>
        );
    }
}

export default Notes;
