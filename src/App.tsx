import { Outlet } from "react-router-dom"
import Footer from "./components/Footer"
import Announcer from "./components/game/Announcer"
import Navigation from "./components/Navigation"

function App() {
    // Announcer holds the announcement state for the whole app and survives
    // every route change. The regions themselves are rendered by the game,
    // inside its dialog — under aria-modal a live region outside the dialog
    // is not reliably observed.
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
