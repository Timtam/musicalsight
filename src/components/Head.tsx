import { Helmet } from "react-helmet-async"

interface HeadProps {
    title: string
}

function Head({ title }: HeadProps) {
    return (
        <Helmet>
            <title>{title} - Musical Sight</title>
        </Helmet>
    )
}

export default Head
