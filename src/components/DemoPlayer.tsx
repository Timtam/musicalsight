import { useEffect, useState } from "react"
import Modal from "react-bootstrap/Modal"
import ReactPlayer from "react-player"

function DemoPlayer({ url, onClose }: { url: string; onClose: () => void }) {
    let [show, setShow] = useState(false)

    useEffect(() => setShow(url !== ""), [url])

    return (
        <Modal
            show={show}
            onHide={() => {
                url = ""
                setShow(false)
                onClose()
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Demo player</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {show ? (
                    <ReactPlayer
                        url={url}
                        playing={true}
                        stopOnUnmount={true}
                    />
                ) : (
                    ""
                )}
            </Modal.Body>
        </Modal>
    )
}

export default DemoPlayer
