import Card from "react-bootstrap/Card"
import Head from "../../components/Head"

function Home() {
    return (
        <>
            <Head title="Home" />

            <Card className="text-center">
                <Card.Body>
                    <Card.Title as="h3">Welcome!</Card.Title>
                    <Card.Text>
                        Ear Dojo, previously known as Musical Sight, aims to provide useful information about
                        music theory, notes, scales and alot more. Most of the
                        stuff shown here is common knowledge to sighted people
                        who are able to communicate knowledge via slides, video
                        material and more, while blind people often have to
                        stick with learning through their ears only. To help
                        them understand things a bit better, Ear Dojo will
                        try to organize information in a way that is more useful
                        for blind people, including note and scale sound
                        previews. Keep in mind however that this is still a fan
                        website. Neither do I guarantee the correctness of all
                        the information that is shown here, nor can I be made
                        responsible for any potential damage that is caused to
                        you by using this website.
                    </Card.Text>
                </Card.Body>
            </Card>
        </>
    )
}

export default Home
