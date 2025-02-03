import "bootstrap/dist/css/bootstrap.min.css"
import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createHashRouter } from "react-router-dom"
import "reflect-metadata"
import App from "./App"
import "./index.css"
import Chord from "./pages/chord/Chord"
import Chords from "./pages/chords/Chords"
import Home from "./pages/home/Home"
import Imprint from "./pages/imprint/Imprint"
import NotFound from "./pages/not-found/NotFound"
import Note from "./pages/note/Note"
import Notes from "./pages/notes/Notes"
import PrivacyPolicy from "./pages/privacy-policy/PrivacyPolicy"
import Scale from "./pages/scale/Scale"
import Scales from "./pages/scales/Scales"

const router = createHashRouter([
    {
        element: <App />,
        errorElement: <NotFound />,
        children: [
            {
                lazy: () => import("./pages/catalog/Catalog"),
                path: "/catalog",
            },
            {
                lazy: () => import("./pages/catalog-product/CatalogProduct"),
                path: "/catalog/product/:productId",
            },
            {
                lazy: () => import("./pages/catalog-submit/CatalogSubmit"),
                path: "/catalog/submit",
            },
            {
                lazy: () => import("./pages/catalog-vendor/CatalogVendor"),
                path: "/catalog/vendor/:vendorId",
            },
            {
                element: <Chords />,
                path: "/chords",
            },
            {
                element: <Chord />,
                path: "/chords/:chord/:note?",
            },
            {
                element: <Home />,
                path: "/",
            },
            {
                element: <Imprint />,
                path: "/imprint",
            },
            {
                element: <Notes />,
                path: "/notes",
            },
            {
                element: <Note />,
                path: "/notes/:note",
            },
            {
                element: <PrivacyPolicy />,
                path: "/privacy-policy",
            },
            {
                element: <Scales />,
                path: "/scales",
            },
            {
                element: <Scale />,
                path: "/scales/:scale/:note?",
            },
        ],
    },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
