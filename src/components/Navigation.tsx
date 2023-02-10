import { Suspense } from "react"
import Container from "react-bootstrap/Container"
import Nav from "react-bootstrap/Nav"
import Navbar from "react-bootstrap/Navbar"
import NavDropdown from "react-bootstrap/NavDropdown"
import { Link, Route, Routes } from "react-router-dom"
import CatalogSubmit from "../pages/catalog-submit/CatalogSubmit"
import Catalog from "../pages/catalog/Catalog"
import Chord from "../pages/chord/Chord"
import Chords from "../pages/chords/Chords"
import Home from "../pages/home/Home"
import Imprint from "../pages/imprint/Imprint"
import Loading from "../pages/loading/Loading"
import NotFound from "../pages/not-found/NotFound"
import Note from "../pages/note/Note"
import Notes from "../pages/notes/Notes"
import Scale from "../pages/scale/Scale"
import Scales from "../pages/scales/Scales"

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
                                <NavDropdown.Item>
                                    <Nav.Link as={Link} to="/notes">
                                        Notes
                                    </Nav.Link>
                                </NavDropdown.Item>
                                <NavDropdown.Item>
                                    <Nav.Link as={Link} to="/scales">
                                        Scales
                                    </Nav.Link>
                                </NavDropdown.Item>
                                <NavDropdown.Item>
                                    <Nav.Link as={Link} to="/chords">
                                        Chords
                                    </Nav.Link>
                                </NavDropdown.Item>
                            </NavDropdown>
                            <Nav.Item>
                                <Nav.Link as={Link} to="/catalog" active>
                                    Audio Plugin And Instrument Accessibility
                                    Catalog
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
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalog" element={<Catalog />} />
                        <Route
                            path="/catalog/submit"
                            element={<CatalogSubmit />}
                        />
                        <Route path="/imprint" element={<Imprint />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/notes/:note" element={<Note />} />
                        <Route
                            path="/scales/:scale/:note?"
                            element={<Scale />}
                        />
                        <Route path="/scales" element={<Scales />} />
                        <Route path="/chords" element={<Chords />} />
                        <Route
                            path="/chords/:chord/:note?"
                            element={<Chord />}
                        />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    )
}

export default Navigation
