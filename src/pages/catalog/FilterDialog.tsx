import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
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
    let sorter = useMemo(() => natsort(), [])
    let [show, setShow] = useState(false)
    let [vendors, setVendors] = useState([] as string[])
    let [prizeFrom, setPrizeFrom] = useState(0)
    let [prizeTo, setPrizeTo] = useState(0)

    useEffect(() => {
        setVendors(filter === undefined ? [] : filter.vendors)
        setPrizeFrom(filter === undefined ? 0 : filter.prizeFrom)
        setPrizeTo(filter === undefined ? 0 : filter.prizeTo)
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
                        <h4>Vendors</h4>
                        <Form.Group controlId="formVendors">
                            {catalog
                                .getVendors()
                                .sort((a, b) => sorter(a.name, b.name))
                                .map((v) => (
                                    <Form.Check
                                        id={"form-vendor-" + v.id}
                                        type="checkbox"
                                        label={`${v.name} (${
                                            catalog.getProductsByVendor(v.id)
                                                .length
                                        })`}
                                        checked={
                                            vendors.find(
                                                (vs) => vs === v.id
                                            ) !== undefined
                                        }
                                        onChange={(evt) => {
                                            if (evt.target.checked === true) {
                                                if (
                                                    vendors.find(
                                                        (vs) => vs === v.id
                                                    ) === undefined
                                                )
                                                    setVendors([
                                                        ...vendors,
                                                        v.id,
                                                    ])
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
                        <h4>Prize</h4>
                        <Form.Group controlId="formPrize">
                            <Form.Label>From $</Form.Label>
                            <Form.Control
                                type="number"
                                value={prizeFrom}
                                onChange={(evt) => {
                                    let n: number = parseInt(evt.target.value)

                                    if (isNaN(n)) {
                                        setPrizeFrom(0)
                                        return
                                    }
                                    setPrizeFrom(n)
                                }}
                            />
                            <Form.Label>To $</Form.Label>
                            <Form.Control
                                type="number"
                                value={prizeTo}
                                onChange={(evt) => {
                                    let n: number = parseInt(evt.target.value)

                                    if (isNaN(n)) {
                                        setPrizeTo(0)
                                        return
                                    }
                                    setPrizeTo(n)
                                }}
                            />
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
                            prizeFrom: prizeFrom,
                            prizeTo: prizeTo,
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
