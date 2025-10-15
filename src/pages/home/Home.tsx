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
                        Ear Dojo, previously known as Musical Sight, aims to provide
                        useful information about music theory, notes, scales and
                        alot more. Most of the stuff shown here is common
                        knowledge to sighted people who are able to communicate
                        knowledge via slides, video material and more, while
                        blind people often have to stick with learning through
                        their ears only. To help them understand things a bit
                        better, Ear Dojo will try to organize information in a
                        way that is more useful for blind people, including note
                        and scale sound previews. Keep in mind however that this
                        is still a fan website. Neither do I guarantee the
                        correctness of all the information that is shown here,
                        nor can I be made responsible for any potential damage
                        that is caused to you by using this website.
                    </Card.Text>
                </Card.Body>
            </Card>
            <h3>Donations</h3>
            If you want to support me and my projects with a tiny financial
            donation, feel free to drop me a dollar via PayPal. You'll find an
            overview of some of my biggest projects there as well.
            <form
                action="https://www.paypal.com/donate"
                method="post"
                target="_top"
            >
                <input
                    type="hidden"
                    name="hosted_button_id"
                    value="BFUALVK8MQYVN"
                />
                <input
                    type="image"
                    src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
                    // @ts-ignore
                    border="0"
                    name="submit"
                    title="PayPal - The safer, easier way to pay online!"
                    alt="Donate with PayPal button"
                />
                <img
                    alt=""
                    // @ts-ignore
                    border="0"
                    src="https://www.paypal.com/en_DE/i/scr/pixel.gif"
                    width="1"
                    height="1"
                />
            </form>
        </>
    )
}

export default Home
