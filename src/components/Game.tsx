import { useLocalStorage } from "@uidotdev/usehooks"
import { ReactNode, useState } from "react"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"

export default function Game({ children }: { children: ReactNode }) {
    const [show, setShow] = useState(false)
    const [gameVolume, setGameVolume] = useLocalStorage("gameVolume", "1.0")

    return (
        <>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton={false}>
                    <Modal.Title></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <section>
                        <h1>Global controls</h1>
                        <label
                            htmlFor="gameVolumeSlider"
                            className="form-label"
                        >
                            Volume
                        </label>
                        <input
                            className="form-range"
                            type="range"
                            id="gameVolumeSlider"
                            min="1"
                            max="100"
                            step="1"
                            value={parseFloat(gameVolume) * 100}
                            onChange={(e) =>
                                setGameVolume(
                                    (
                                        parseFloat(e.currentTarget.value) / 100
                                    ).toString(),
                                )
                            }
                        />
                    </section>
                    <section>{children}</section>
                    <Button onClick={() => setShow(false)}>End training</Button>
                </Modal.Body>
            </Modal>
            <Button onClick={() => setShow(true)}>Start training</Button>
        </>
    )
}
