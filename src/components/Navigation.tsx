import ScaleType from "@tonaljs/scale-type";
import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, Route, Switch } from "react-router-dom";
import Home from "../pages/home/Home";
import Imprint from "../pages/imprint/Imprint";
import Note from "../pages/note/Note";
import Notes from "../pages/notes/Notes";
import Scale from "../pages/scale/Scale";
import Scales from "../pages/scales/Scales";

class Navigation extends Component {
    render() {
        return (
            <div>
                <Container>
                    <h2>Navigation</h2>
                    <Navbar className="fixed-top" bg="light" variant="light">
                        <Navbar.Collapse>
                            <Nav className="mr-auto">
                                <Nav.Item>
                                    <Nav.Link as={Link} to="/" active>
                                        Home
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} to="/notes">
                                        Notes
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} to="/scales">
                                        Scales
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} to="/imprint">
                                        Imprint
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                </Container>
                <div>
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/imprint" component={Imprint} />
                        <Route exact path="/notes" component={Notes} />
                        <Route path="/notes/:note([a-g])" component={Note} />
                        <Route
                            path="/notes/:note([a-g]-sharp)"
                            component={Note}
                        />
                        <Route
                            path="/notes/:note([a-g]-flat)"
                            component={Note}
                        />
                        {ScaleType.names().map((scale) => (
                            <Route
                                path={
                                    "/scales/:scale(" +
                                    scale.replace("#", "%23") +
                                    ")"
                                }
                                component={Scale}
                            />
                        ))}
                        <Route exact path="/scales" component={Scales} />
                        <Route
                            render={function () {
                                return <p>Not found</p>;
                            }}
                        />
                    </Switch>
                </div>
            </div>
        );
    }
}

export default Navigation;
