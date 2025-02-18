import Container from "react-bootstrap/Container"
import Nav from "react-bootstrap/Nav"
import Navbar from "react-bootstrap/Navbar"
import NavDropdown from "react-bootstrap/NavDropdown"
import { Link } from "react-router-dom"

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
                            <NavDropdown title="Music Theory">
                                <NavDropdown.Item as="div">
                                    <Nav.Link as={Link} to="/notes">
                                        Notes
                                    </Nav.Link>
                                </NavDropdown.Item>
                                <NavDropdown.Item as="div">
                                    <Nav.Link as={Link} to="/scales">
                                        Scales
                                    </Nav.Link>
                                </NavDropdown.Item>
                                <NavDropdown.Item as="div">
                                    <Nav.Link as={Link} to="/chords">
                                        Chords
                                    </Nav.Link>
                                </NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown title="Ear Training">
                                <NavDropdown.Item as="div">
                                    <Nav.Link
                                        as={Link}
                                        to="/frequency-identifier"
                                    >
                                        Frequency Identifier (WIP)
                                    </Nav.Link>
                                </NavDropdown.Item>
                            </NavDropdown>
                            <Nav.Item>
                                <Nav.Link as={Link} to="/catalog" active>
                                    Accessible Audio Plugin And Software Catalog
                                    (APS)
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
        </div>
    )
}

export default Navigation
