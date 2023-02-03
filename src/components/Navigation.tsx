import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, Route, Switch } from "react-router-dom";
import { Chord } from "../pages/chord/Chord";
import Chords from "../pages/chords/Chords";
import Home from "../pages/home/Home";
import Imprint from "../pages/imprint/Imprint";
import { Note } from "../pages/note/Note";
import Notes from "../pages/notes/Notes";
import { Scale } from "../pages/scale/Scale";
import Scales from "../pages/scales/Scales";

function Navigation() {
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
                                <Nav.Link as={Link} to="/chords">
                                    Chords
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
                    <Route exact path="/notes/:note">
                        <Note />
                    </Route>
                    <Route exact path="/scales/:scale/:note?">
                        <Scale />
                    </Route>
                    <Route exact path="/scales" component={Scales} />
                    <Route exact path="/chords" component={Chords} />
                    <Route exact path="/chords/:chord/:note?">
                        <Chord />
                    </Route>
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

export default Navigation;
