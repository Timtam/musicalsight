import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import Modal from "react-bootstrap/Modal"
import CategoryChecker from "../../components/CategoryChecker"
import {
    getOperatingSystemString,
    OperatingSystem,
} from "../../entities/OperatingSystem"
import {
    createProductFilter,
    ProductFilter,
} from "../../entities/ProductFilter"
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
    let [priceFrom, setPriceFrom] = useState(0)
    let [priceTo, setPriceTo] = useState(0)
    let [free, setFree] = useState(false)
    let [nks, setNks] = useState(undefined as boolean | undefined)
    let [categories, setCategories] = useState([] as string[])
    let [oss, setOss] = useState([] as OperatingSystem[])

    useEffect(() => {
        setVendors(filter === undefined ? [] : filter.vendors)
        setPriceFrom(filter === undefined ? 0 : filter.priceFrom)
        setPriceTo(filter === undefined ? 0 : filter.priceTo)
        setNks(filter === undefined ? undefined : filter.nks)
        setFree(filter === undefined ? false : filter.free)
        setCategories(filter === undefined ? [] : filter.categories)
        setOss(filter === undefined ? [] : filter.oss)
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
                                            catalog.getProducts({
                                                ...createProductFilter(),
                                                vendors: [v.id],
                                            }).length
                                        })`}
                                        checked={vendors.includes(v.id)}
                                        onChange={(evt) => {
                                            if (evt.target.checked === true) {
                                                if (!vendors.includes(v.id))
                                                    setVendors([
                                                        ...vendors,
                                                        v.id,
                                                    ])
                                            } else {
                                                if (vendors.includes(v.id))
                                                    setVendors(
                                                        vendors.filter(
                                                            (vs) => vs !== v.id,
                                                        ),
                                                    )
                                            }
                                        }}
                                    />
                                ))}
                        </Form.Group>
                        <h4>Price</h4>
                        <Form.Group controlId="formPrice">
                            <Form.Label>From $</Form.Label>
                            <Form.Control
                                type="number"
                                value={priceFrom}
                                disabled={free}
                                onChange={(evt) => {
                                    let n: number = parseInt(evt.target.value)

                                    if (isNaN(n)) {
                                        setPriceFrom(0)
                                        return
                                    }
                                    setPriceFrom(n)
                                }}
                            />
                            <Form.Label>To $</Form.Label>
                            <Form.Control
                                type="number"
                                value={priceTo}
                                disabled={free}
                                onChange={(evt) => {
                                    let n: number = parseInt(evt.target.value)

                                    if (isNaN(n)) {
                                        setPriceTo(0)
                                        return
                                    }
                                    setPriceTo(n)
                                }}
                            />
                            <Form.Check
                                type="checkbox"
                                checked={free}
                                label="Free products only"
                                onChange={(evt) => {
                                    setFree(evt.target.checked)
                                }}
                            />
                        </Form.Group>
                        <h4>NKS Compatibility</h4>
                        <Form.Group controlId="formNks">
                            <Form.Select
                                value={
                                    nks === undefined
                                        ? "disabled"
                                        : nks === false
                                          ? "no"
                                          : "yes"
                                }
                                onChange={(evt) => {
                                    switch (evt.target.value) {
                                        case "disabled":
                                            setNks(undefined)
                                            return
                                        case "no":
                                            setNks(false)
                                            return
                                        case "yes":
                                            setNks(true)
                                            return
                                    }
                                }}
                            >
                                <option value="disabled">Disabled</option>
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <h4>Product Categories</h4>
                        <Form.Group controlId="formCategories">
                            {catalog
                                .getCategories()
                                .filter((c) => !c.parent)
                                .sort((a, b) => sorter(a.name, b.name))
                                .map((c) => (
                                    <CategoryChecker
                                        category={c}
                                        showCounter
                                        catalog={catalog}
                                        checked={(category) =>
                                            categories.includes(category.id)
                                        }
                                        onChange={(category, checked) => {
                                            if (checked) {
                                                if (
                                                    !categories.includes(
                                                        category.id,
                                                    )
                                                )
                                                    setCategories([
                                                        ...categories,
                                                        category.id,
                                                    ])
                                            } else {
                                                if (
                                                    categories.includes(
                                                        category.id,
                                                    )
                                                )
                                                    setCategories(
                                                        categories.filter(
                                                            (cs) =>
                                                                cs !==
                                                                category.id,
                                                        ),
                                                    )
                                            }
                                        }}
                                    />
                                ))}
                        </Form.Group>
                        <h4>Operating System</h4>
                        <Form.Group controlId="formOS">
                            {Object.keys(OperatingSystem)
                                .filter((os) => !isNaN(parseInt(os)))
                                .map((os) => (
                                    <Form.Check
                                        id={`form-os-${os}`}
                                        type="checkbox"
                                        label={`${getOperatingSystemString(
                                            parseInt(os) as OperatingSystem,
                                        )} (${
                                            catalog.getProducts({
                                                ...createProductFilter(),
                                                oss: [
                                                    parseInt(
                                                        os,
                                                    ) as OperatingSystem,
                                                ],
                                            }).length
                                        })`}
                                        checked={oss.includes(
                                            parseInt(os) as OperatingSystem,
                                        )}
                                        onChange={(evt) => {
                                            if (evt.target.checked === true) {
                                                if (
                                                    !oss.includes(
                                                        parseInt(
                                                            os,
                                                        ) as OperatingSystem,
                                                    )
                                                )
                                                    setOss([
                                                        ...oss,
                                                        parseInt(
                                                            os,
                                                        ) as OperatingSystem,
                                                    ])
                                            } else {
                                                if (
                                                    oss.includes(
                                                        parseInt(
                                                            os,
                                                        ) as OperatingSystem,
                                                    )
                                                )
                                                    setOss(
                                                        oss.filter(
                                                            (osn) =>
                                                                osn !==
                                                                parseInt(os),
                                                        ),
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
                            priceFrom: priceFrom,
                            priceTo: priceTo,
                            free: free,
                            nks: nks,
                            categories: categories,
                            oss: oss,
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
