import { useEffect, useState } from "react"
import Modal from "react-bootstrap/Modal"

function ResponseModal({
    response,
    onClose,
}: {
    response: {
        type: "error" | "success" | ""
        message: string
    }
    onClose: (clean: boolean) => void
}) {
    let [show, setShow] = useState(false)

    useEffect(() => setShow(response.type !== ""), [response])

    return (
        <Modal
            show={show}
            onHide={() => {
                if (response.type === "error") onClose(false)
                else onClose(true)
                setShow(false)
                response = {
                    type: "",
                    message: "",
                }
            }}
        >
            {response.type !== "" ? (
                <>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {response.type === "success"
                                ? "Product submitted successfully!"
                                : "Error while submitting the product"}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {response.type === "success" ? (
                            <p>
                                Thank you for submitting the new product! It'll
                                be added as soon as possible.
                            </p>
                        ) : (
                            <p>
                                An error occurred while submitting your product.
                                Please try again later or get in touch to
                                receive further support. The error is:{" "}
                                {response.message}
                            </p>
                        )}
                    </Modal.Body>
                </>
            ) : (
                ""
            )}
        </Modal>
    )
}

export default ResponseModal
