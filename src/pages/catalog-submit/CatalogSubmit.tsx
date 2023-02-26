import natsort from "natsort"
import { useEffect, useMemo, useRef, useState } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import { useNavigate, useSearchParams } from "react-router-dom"
import slugify from "slugify"
import dedent from "ts-dedent"
import CategoryChecker from "../../components/CategoryChecker"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import {
    getOperatingSystemString,
    OperatingSystem,
} from "../../entities/OperatingSystem"
import Product from "../../entities/Product"
import { createProductFilter } from "../../entities/ProductFilter"
import CatalogService from "../../services/CatalogService"
import ResponseModal from "./ResponseModal"

const createFormData = (p?: Product) => ({
    name: p?.name || "",
    categories: p?.categories
        ? p.categories.map((c) => c.id)
        : ([] as string[]),
    url: p?.url || "",
    demo: p?.demo || "",
    size: p?.size ? p.size / 1024 / 1024 : (undefined as number | undefined),
    price: p?.price || (undefined as number | undefined),
    nks: p?.nks || (false as boolean | string),
    description: p?.description || "",
    accessibility_description: p?.accessibility_description || "",
    oss: (p?.os.map((os) => OperatingSystem[os].toLowerCase()) ||
        []) as string[],
    requires: p?.requires
        ? p.requires
        : ([] as {
              product: Product
              version?: string
          }[]),
    vendor: p?.vendor.id || "",
    vendorName: "",
    vendorUrl: "",
    userName: "",
    userEmail: "",
})

function CatalogSubmit() {
    let catalog = useMemo(() => new CatalogService(), [])
    let sorter = useMemo(() => natsort(), [])
    let [data, setData] = useState(createFormData())
    let [response, setResponse] = useState({
        type: "" as "error" | "success" | "",
        message: "",
    })
    let [searchParams] = useSearchParams()
    let [update, setUpdate] = useState(false)
    let [selectedRequirement, setSelectedRequirement] = useState({
        product: "none" as string,
        version: "" as string,
    })
    let [insertingRequirement, setInsertingRequirement] = useState(false)
    let headRef = useRef<HTMLElement>(null)
    let navigate = useNavigate()

    useEffect(() => {
        let productId = searchParams.get("p")

        if (productId && productId !== "") {
            let product = catalog.getProductById(productId)
            if (product) {
                setData(createFormData(product))
                setUpdate(true)
            }
        }
    }, [searchParams, catalog])

    return (
        <>
            <Head
                title={
                    update ? "Update a catalog entry" : "Submit a catalog entry"
                }
            />
            <FA
                ref={headRef}
                title={
                    update
                        ? "Update a product within the catalog"
                        : "Submit a product to the catalog"
                }
            />
            {update ? (
                <p>
                    All the product's data was autofilled into the form below.
                    Feel free to update whatever information you want to correct
                    and submit the changed entry by clicking the button on the
                    bottom of the page. Thanks for your help!
                </p>
            ) : (
                <p>
                    In the case that you know a product which doesn't yet exist
                    in this catalog, you can enter all relevant data below and
                    send it to us. Please note however that the entry will not
                    be inserted automatically and it'll most likely take some
                    time for the catalog to update. Thank you for helping this
                    catalog grow!
                </p>
            )}
            <ResponseModal
                response={response}
                onClose={(clean) => {
                    if (clean) {
                        setData(createFormData())

                        if (update) {
                            let productId = searchParams.get("p")

                            if (productId && productId !== "")
                                navigate(`/catalog/product/${productId}`)
                        }
                    }

                    setResponse({
                        type: "",
                        message: "",
                    })
                }}
                onClosed={() => {
                    if (headRef.current) headRef.current.focus()
                }}
            />
            <h4>Product information</h4>
            <Form>
                <h5>Product details</h5>
                <Form.Group>
                    <Form.Label for="form-details-name">
                        Product name *
                    </Form.Label>
                    <Form.Control
                        id="form-details-name"
                        required
                        type="input"
                        placeholder="Enter the product title"
                        value={data.name}
                        onChange={(evt) =>
                            setData({ ...data, name: evt.target.value })
                        }
                    />
                    <Form.Label for="form-details-url">Product URL</Form.Label>
                    <Form.Control
                        id="form-details-url"
                        type="input"
                        placeholder="https://www.vendor.com/product"
                        value={data.url}
                        onChange={(evt) =>
                            setData({ ...data, url: evt.target.value })
                        }
                    />
                    <Form.Label for="form-details-demo-url">
                        Audio demo URL (YouTube, SoundCloud or anything
                        comparable)
                    </Form.Label>
                    <Form.Control
                        id="form-details-demo-url"
                        type="input"
                        placeholder="https://www.youtube.com/watch?v=abc012345"
                        value={data.demo}
                        onChange={(evt) =>
                            setData({ ...data, demo: evt.target.value })
                        }
                    />
                    <Form.Label for="form-details-size">
                        Size in MB (leave empty if unknown)
                    </Form.Label>
                    <Form.Control
                        id="form-details-size"
                        type="number"
                        value={data.size !== undefined ? data.size : ""}
                        onChange={(evt) =>
                            setData({
                                ...data,
                                size:
                                    evt.target.value !== ""
                                        ? parseInt(evt.target.value)
                                        : undefined,
                            })
                        }
                    />
                    <Form.Label for="form-details-price">
                        Price in USD (enter 0 if the product is free, leave
                        empty if unknown)
                    </Form.Label>
                    <Form.Control
                        type="number"
                        id="form-details-price"
                        value={data.price !== undefined ? data.price : ""}
                        onChange={(evt) =>
                            setData({
                                ...data,
                                price:
                                    evt.target.value !== ""
                                        ? parseInt(evt.target.value)
                                        : undefined,
                            })
                        }
                    />
                    <Form.Label for="form-details-nks">NKS Support</Form.Label>
                    <Form.Select
                        value={
                            data.nks === true || typeof data.nks === "string"
                                ? "yes"
                                : "no"
                        }
                        id="form-details-nks"
                        onChange={(evt) =>
                            setData({
                                ...data,
                                nks: evt.target.value === "yes" ? true : false,
                            })
                        }
                    >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </Form.Select>
                    <Form.Label for="form-details-nks-details">
                        Additional NKS information?
                    </Form.Label>
                    <Form.Control
                        disabled={data.nks !== true}
                        as="textarea"
                        id="form-details-nks-details"
                        placeholder="Enter additional information when necessary"
                        value={typeof data.nks === "string" ? data.nks : ""}
                        onChange={(evt) =>
                            setData({
                                ...data,
                                nks:
                                    evt.target.value !== ""
                                        ? evt.target.value
                                        : true,
                            })
                        }
                    />
                    <Form.Label for="form-details-description">
                        Product description
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        id="form-details-description"
                        placeholder="Enter product description"
                        value={data.description}
                        onChange={(evt) =>
                            setData({ ...data, description: evt.target.value })
                        }
                    />
                    <Form.Label for="form-details-accessibility-description">
                        Accessibility description
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        id="form-details-accessibility-description"
                        placeholder="Enter a description of the product accessibility"
                        value={data.accessibility_description}
                        onChange={(evt) =>
                            setData({
                                ...data,
                                accessibility_description: evt.target.value,
                            })
                        }
                    />
                </Form.Group>
                <h5>Vendor</h5>
                <Form.Group>
                    <Form.Label for="form-vendor-select">
                        Select vendor
                    </Form.Label>
                    <Form.Select
                        value={data.vendor}
                        id="form-vendor-select"
                        onChange={(evt) =>
                            setData({ ...data, vendor: evt.target.value })
                        }
                    >
                        <option value=""></option>
                        <option value="new">
                            (not listed here, enter details below)
                        </option>
                        {catalog
                            .getVendors()
                            .sort((a, b) => sorter(a.name, b.name))
                            .map((v) => (
                                <option value={v.id}>{v.name}</option>
                            ))}
                    </Form.Select>
                    <Form.Label for="form-vendor-name">
                        Vendor name *
                    </Form.Label>
                    <Form.Control
                        id="form-vendor-name"
                        required
                        type="input"
                        placeholder="Enter vendor name"
                        disabled={data.vendor !== "new"}
                        value={data.vendorName}
                        onChange={(evt) =>
                            setData({ ...data, vendorName: evt.target.value })
                        }
                    />
                    <Form.Label for="form-vendor-url">Vendor URL *</Form.Label>
                    <Form.Control
                        required
                        type="input"
                        id="form-vendor-url"
                        placeholder="Enter vendor website URL"
                        disabled={data.vendor !== "new"}
                        value={data.vendorUrl}
                        onChange={(evt) =>
                            setData({ ...data, vendorUrl: evt.target.value })
                        }
                    />
                </Form.Group>
                <h5>Product Categories</h5>
                <Form.Group controlId="formCategories">
                    {catalog
                        .getCategories()
                        .filter((c) => !c.parent)
                        .sort((a, b) => sorter(a.name, b.name))
                        .map((c) => (
                            <CategoryChecker
                                category={c}
                                catalog={catalog}
                                checked={(category) =>
                                    data.categories.includes(category.id)
                                }
                                onChange={(category, checked) => {
                                    if (checked) {
                                        if (
                                            !data.categories.includes(
                                                category.id
                                            )
                                        )
                                            setData({
                                                ...data,
                                                categories: [
                                                    ...data.categories,
                                                    category.id,
                                                ],
                                            })
                                    } else {
                                        if (
                                            data.categories.includes(
                                                category.id
                                            )
                                        )
                                            setData({
                                                ...data,
                                                categories:
                                                    data.categories.filter(
                                                        (cs) =>
                                                            cs !== category.id
                                                    ),
                                            })
                                    }
                                }}
                            />
                        ))}
                </Form.Group>
                <h5>Supported operating systems</h5>
                <Form.Group>
                    {Object.keys(OperatingSystem)
                        .filter(
                            (os) =>
                                !isNaN(parseInt(os)) &&
                                parseInt(os) !== OperatingSystem.UNKNOWN
                        )
                        .map((os) => (
                            <Form.Check
                                id={`form-os-${os}`}
                                type="checkbox"
                                label={getOperatingSystemString(
                                    parseInt(os) as OperatingSystem
                                )}
                                checked={data.oss.includes(
                                    OperatingSystem[parseInt(os)].toLowerCase()
                                )}
                                onChange={(evt) => {
                                    if (evt.target.checked === true) {
                                        if (
                                            !data.oss.includes(
                                                OperatingSystem[
                                                    parseInt(os)
                                                ].toLowerCase()
                                            )
                                        )
                                            setData({
                                                ...data,
                                                oss: [
                                                    ...data.oss,
                                                    OperatingSystem[
                                                        parseInt(os)
                                                    ].toLowerCase(),
                                                ],
                                            })
                                    } else {
                                        if (
                                            data.oss.includes(
                                                OperatingSystem[
                                                    parseInt(os)
                                                ].toLowerCase()
                                            )
                                        )
                                            setData({
                                                ...data,
                                                oss: data.oss.filter(
                                                    (osn) =>
                                                        osn !==
                                                        OperatingSystem[
                                                            parseInt(os)
                                                        ].toLowerCase()
                                                ),
                                            })
                                    }
                                }}
                            />
                        ))}
                </Form.Group>
                <h5>Product requirements</h5>
                <Form.Group>
                    {data.requires.length > 0 ? (
                        <div role="list" aria-label="Required products">
                            {data.requires.map((r) => (
                                <div role="listitem">
                                    <p>
                                        {r.version
                                            ? `${r.product.name} (minimum version ${r.version}) by ${r.product.vendor.name}`
                                            : `${r.product.name} by ${r.product.vendor.name}`}
                                    </p>
                                    <Button
                                        ref={(e: any) => {
                                            if (e && insertingRequirement) {
                                                e.focus()
                                                setInsertingRequirement(false)
                                            }
                                        }}
                                        onClick={(evt) => {
                                            if (data.requires.includes(r))
                                                setData({
                                                    ...data,
                                                    requires:
                                                        data.requires.filter(
                                                            (re) => re !== r
                                                        ),
                                                })
                                        }}
                                    >
                                        Remove this requirement
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No requirements added so far.</p>
                    )}
                    <Form.Label for="form-requirements-selector">
                        Select the required product
                    </Form.Label>
                    <Form.Select
                        id="form-requirements-selector"
                        value={selectedRequirement.product}
                        onChange={(evt) => {
                            setInsertingRequirement(true)
                            setSelectedRequirement({
                                product: evt.target.value,
                                version: selectedRequirement.version,
                            })
                        }}
                    >
                        <option value="none">
                            (select a product this product should require)
                        </option>
                        {catalog
                            .getProducts(createProductFilter())
                            .sort((a, b) =>
                                sorter(
                                    `${a.name} ${a.vendor.name}`,
                                    `${b.name} ${b.vendor.name}`
                                )
                            )
                            .map((p) => (
                                <option
                                    value={p.id}
                                >{`${p.name} by ${p.vendor.name}`}</option>
                            ))}
                    </Form.Select>
                    <Form.Label for="form-requirements-version">
                        Required minimum version (optional)
                    </Form.Label>
                    <Form.Control
                        id="form-requirements-version"
                        type="input"
                        disabled={selectedRequirement.product === "none"}
                        value={selectedRequirement.version}
                        onChange={(evt) => {
                            setSelectedRequirement({
                                product: selectedRequirement.product,
                                version: evt.target.value,
                            })
                        }}
                    />
                    <Form.Label for="form-requirements-submit">
                        Add new requirement
                    </Form.Label>
                    <Form.Control
                        id="form-requirements-submit"
                        type="button"
                        disabled={selectedRequirement.product === "none"}
                        onClick={(evt) => {
                            setData({
                                ...data,
                                requires: [
                                    ...data.requires,
                                    {
                                        product: catalog.getProductById(
                                            selectedRequirement.product
                                        )!,
                                        version:
                                            selectedRequirement.version !== ""
                                                ? selectedRequirement.version
                                                : undefined,
                                    },
                                ],
                            })
                            setSelectedRequirement({
                                product: "none",
                                version: "",
                            })
                        }}
                    />
                </Form.Group>
                <h5>Personal information</h5>
                <p>
                    You don't need to enter those details, they're only
                    necessary if I should be able to get back to you in the case
                    that questions come up or important details are missing.
                </p>
                <Form.Group>
                    <Form.Label for="form-user-name">Your Name</Form.Label>
                    <Form.Control
                        id="form-user-name"
                        type="input"
                        value={data.userName}
                        onChange={(evt) =>
                            setData({ ...data, userName: evt.target.value })
                        }
                    />
                    <Form.Label for="form-user-email">Your Email</Form.Label>
                    <Form.Control
                        id="form-user-email"
                        type="email"
                        value={data.userEmail}
                        onChange={(evt) =>
                            setData({ ...data, userEmail: evt.target.value })
                        }
                    />
                </Form.Group>
                <Button
                    disabled={
                        data.name === "" ||
                        data.vendor === "" ||
                        (data.vendor === "new" &&
                            (data.vendorName === "" || data.vendorUrl === ""))
                    }
                    onClick={async (evt) => {
                        let formatRequirements = (
                            reqs: {
                                product: Product
                                version?: string
                            }[]
                        ): string => {
                            return JSON.stringify(
                                reqs.map((r) => {
                                    if (r.version)
                                        return [r.product.id, r.version]
                                    else return r.product.id
                                }) as (string | string[])[]
                            )
                        }
                        let msg = ""
                        let vendorId = ""
                        let productId = slugify(data.name, {
                            lower: true,
                        })

                        evt.preventDefault()

                        if (data.vendor === "new") {
                            vendorId = slugify(data.vendorName, {
                                lower: true,
                            })

                            msg += dedent`[${vendorId}]
    name = "${data.vendorName}"
    url = "${data.vendorUrl}"`

                            msg += "\n"
                        } else {
                            vendorId = data.vendor
                        }

                        msg += dedent`[${productId}]
    vendor = "${vendorId}"
    name = "${data.name}"`
                        msg += "\n"

                        if (data.categories.length > 0)
                            msg += `categories = ${JSON.stringify(
                                data.categories
                            )}\n`
                        if (data.requires.length > 0)
                            msg += `requires = ${formatRequirements(
                                data.requires
                            )}\n`
                        if (data.size !== undefined)
                            msg += `size = ${data.size}\n`
                        if (data.url !== "") msg += `url = "${data.url}"\n`
                        if (data.demo !== "") msg += `demo = "${data.demo}"\n`
                        if (data.price !== undefined)
                            msg += `price = ${data.price}\n`
                        if (typeof data.nks === "string")
                            msg += `nks = "${data.nks}"\n`
                        else if (data.nks === true) msg += `nks = ${data.nks}\n`
                        if (data.description !== "") {
                            msg += dedent`description = """\
${data.description}"""`
                            msg += "\n"
                        }
                        if (data.accessibility_description !== "") {
                            msg += dedent`accessibility_description = """\
${data.accessibility_description}"""`
                            msg += "\n"
                        }
                        if (data.oss.length > 0)
                            msg += `os = ${JSON.stringify(data.oss)}\n`

                        try {
                            let body: {
                                message: string
                                accessKey: string
                                email?: string
                                replyTo?: string
                                name?: string
                                subject: string
                            } = {
                                message: msg.replaceAll("\n", "<br />"),
                                subject: update
                                    ? `APIAC Product update for product ${data.name}`
                                    : `APIAC Product submission for product ${data.name}`,
                                accessKey:
                                    "56f0885e-efe6-4378-9bf4-673bc7b3b00d",
                            }

                            if (data.userName !== "")
                                body["name"] = data.userName

                            if (data.userEmail !== "") {
                                body["email"] = data.userEmail
                                body["replyTo"] = "@"
                            }

                            let res = await fetch(
                                "https://api.staticforms.xyz/submit",
                                {
                                    method: "POST",
                                    body: JSON.stringify(body),
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                }
                            )

                            let json = await res.json()

                            if (json.success) {
                                setResponse({
                                    type: "success",
                                    message: "",
                                })
                            } else {
                                setResponse({
                                    type: "error",
                                    message: json.message,
                                })
                            }
                        } catch (e) {
                            setResponse({
                                type: "error",
                                message: e as string,
                            })
                        }
                    }}
                    variant="primary"
                >
                    {update ? "Submit update" : "Submit product"}
                </Button>
            </Form>
        </>
    )
}

export default CatalogSubmit
