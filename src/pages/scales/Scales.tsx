import ScaleType from "@tonaljs/scale-type";
import React, { Component } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet";
import { LinkContainer } from "react-router-bootstrap";

class Scales extends Component {
    render() {
        return (
            <>
                <Helmet>
                    <title>Scales - Musical Sight</title>
                </Helmet>

                <ListGroup>
                    {ScaleType.names()
                        .sort()
                        .map((scale) => (
                            <LinkContainer to={"/scale/" + escape(scale)}>
                                <ListGroup.Item action>{scale}</ListGroup.Item>
                            </LinkContainer>
                        ))}
                </ListGroup>
            </>
        );
    }
}

export default Scales;
