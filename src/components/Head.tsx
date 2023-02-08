import Helmet from "react-helmet"

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
