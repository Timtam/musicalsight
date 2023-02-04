import { Helmet } from "react-helmet";

function NotFound() {
    return (
        <>
            <Helmet>
                <title>Page Not Found - Musical Sight</title>
            </Helmet>
            <p>The page you're looking for cannot be found.</p>
        </>
    );
}

export default NotFound;
