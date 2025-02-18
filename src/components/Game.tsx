import { ReactNode, useState } from "react"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"

export default function Game({ children }: { children: ReactNode }) {
    const [show, setShow] = useState(false)

    return (
        <>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton={false}>
                    <Modal.Title></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <section>{children}</section>
                    <Button onClick={() => setShow(false)}>End training</Button>
                </Modal.Body>
            </Modal>
            <Button onClick={() => setShow(true)}>Start training</Button>
        </>
    )
}
