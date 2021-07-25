import ScaleType from "@tonaljs/scale-type";
import React, { Component } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet";

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
                            <ListGroup.Item
                                action
                                href={"/scale/" + escape(scale)}
                            >
                                {scale}
                            </ListGroup.Item>
                        ))}
                </ListGroup>
            </>
        );
    }
}

export default Scales;
