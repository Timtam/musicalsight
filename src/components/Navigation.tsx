import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, Route, Switch } from "react-router-dom";
import Home from "../pages/home/Home";
import Imprint from "../pages/imprint/Imprint";
import Note from "../pages/note/Note";
import Notes from "../pages/notes/Notes";
import Scales from "../pages/scales/Scales";

class Navigation extends Component {
    render() {
        return (
            <div>
                <Container>
                    <Navbar className="fixed-top" bg="light" variant="light">
                        <Navbar.Collapse>
                            <Nav className="mr-auto">
                                <Nav.Item>
                                    <Nav.Link
                                        as={Link}
                                        to={process.env.PUBLIC_URL + "/"}
                                        active
                                    >
                                        Home
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        as={Link}
                                        to={process.env.PUBLIC_URL + "/notes"}
                                    >
                                        Notes
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        as={Link}
                                        to={process.env.PUBLIC_URL + "/scales"}
                                    >
                                        Scales
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        as={Link}
                                        to={process.env.PUBLIC_URL + "/imprint"}
                                    >
                                        Imprint
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                </Container>
                <div>
                    <Switch>
                        <Route
                            exact
                            path={process.env.PUBLIC_URL + "/"}
                            component={Home}
                        />
                        <Route
                            exact
                            path={process.env.PUBLIC_URL + "/imprint"}
                            component={Imprint}
                        />
                        <Route
                            exact
                            path={process.env.PUBLIC_URL + "/notes"}
                            component={Notes}
                        />
                        <Route
                            path={
                                process.env.PUBLIC_URL + "/notes/:note([a-g])"
                            }
                            component={Note}
                        />
                        <Route
                            path={
                                process.env.PUBLIC_URL +
                                "/notes/:note([a-g]-sharp)"
                            }
                            component={Note}
                        />
                        <Route
                            path={
                                process.env.PUBLIC_URL +
                                "/notes/:note([a-g]-flat)"
                            }
                            component={Note}
                        />
                        <Route
                            exact
                            path={process.env.PUBLIC_URL + "/scales"}
                            component={Scales}
                        />
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
