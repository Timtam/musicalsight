import { Outlet } from "react-router-dom"
import Footer from "./components/Footer"
import Announcer from "./components/game/Announcer"
import Navigation from "./components/Navigation"

function App() {
    // The two live regions are mounted here so they exist from the very
    // first render and survive every route change. A region that is
    // inserted together with its first message swallows exactly that
    // message in most screen readers. Announcer renders them after its
    // children, so they sit at the end of the document rather than ahead
    // of the h1.
    return (
        <Announcer>
            <h1>Ear Dojo</h1>
            <Navigation />
            <Outlet />
            <Footer />
        </Announcer>
    )
}

export default App
