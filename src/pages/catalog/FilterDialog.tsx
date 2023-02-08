import { useEffect, useState } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import Modal from "react-bootstrap/Modal"
import { ProductFilter } from "../../entities/ProductFilter"
import CatalogService from "../../services/CatalogService"

function FilterDialog({
    filter,
    catalog,
    onApply,
    onClose,
}: {
    filter: ProductFilter | undefined
    catalog: CatalogService
    onApply: (filter: ProductFilter) => void
    onClose: () => void
}) {
    let [show, setShow] = useState(false)
    let [vendors, setVendors] = useState([] as string[])

    useEffect(() => {
        setVendors(filter === undefined ? [] : filter.vendors)
        setShow(filter !== undefined)
    }, [filter])

    return (
        <Modal
            show={show}
            onHide={() => {
                filter = undefined
                setShow(false)
                onClose()
            }}
        >
            <Modal.Header closeButton closeLabel="Cancel">
                <Modal.Title>Configure filter</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {show ? (
                    <Form>
                        <Form.Group controlId="formVendors">
                            {catalog.getVendors().map((v) => (
                                <Form.Check
                                    id={"form-vendor-" + v.id}
                                    type="checkbox"
                                    label={`${v.name} (${
                                        catalog.getProductsByVendor(v.id).length
                                    })`}
                                    checked={
                                        vendors.find((vs) => vs === v.id) !==
                                        undefined
                                    }
                                    onChange={(evt) => {
                                        if (evt.target.checked === true) {
                                            if (
                                                vendors.find(
                                                    (vs) => vs === v.id
                                                ) === undefined
                                            )
                                                setVendors([...vendors, v.id])
                                        } else {
                                            if (
                                                vendors.find(
                                                    (vs) => vs === v.id
                                                ) !== undefined
                                            )
                                                setVendors(
                                                    vendors.filter(
                                                        (vs) => vs !== v.id
                                                    )
                                                )
                                        }
                                    }}
                                />
                            ))}
                        </Form.Group>
                    </Form>
                ) : (
                    ""
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={() => {
                        filter = undefined
                        setShow(false)
                        onClose()
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={() => {
                        setShow(false)
                        onApply({
                            ...(filter as unknown as ProductFilter),
                            vendors: vendors,
                            enabled: true,
                        })
                        filter = undefined
                    }}
                >
                    Apply filter
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default FilterDialog
