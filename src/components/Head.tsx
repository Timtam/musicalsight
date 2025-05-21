import { Helmet } from "react-helmet-async"

interface HeadProps {
    title: string
}

function Head({ title }: HeadProps) {
    return (
        <Helmet>
            <title>{title} - Ear Dojo</title>
        </Helmet>
    )
}

export default Head
