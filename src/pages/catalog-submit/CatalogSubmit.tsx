import natsort from "natsort"
import { useMemo, useState } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import slugify from "slugify"
import dedent from "ts-dedent"
import Head from "../../components/Head"
import {
    getOperatingSystemString,
    OperatingSystem,
} from "../../entities/OperatingSystem"
import { getProductTypeString, ProductType } from "../../entities/ProductType"
import CatalogService from "../../services/CatalogService"
import ResponseModal from "./ResponseModal"

const createFormData = () => ({
    name: "",
    type: ProductType[0] as string,
    url: "",
    demo: "",
    size: undefined as number | undefined,
    prize: undefined as number | undefined,
    nks: "no",
    nks_additional: "",
    description: "",
    accessibility_description: "",
    oss: [] as string[],
    vendor: "",
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

    return (
        <>
            <Head title="Submit a catalog entry" />
            <h3>Submit a product to the catalog</h3>
            <p>
                In the case that you know a product which doesn't yet exist in
                this catalog, you can enter all relevant data below and send it
                to us. Please note however that the entry will not be inserted
                automatically and it'll most likely take some time for the
                catalog to update. Thank you for helping this catalog grow!
            </p>
            <ResponseModal
                response={response}
                onClose={(clean) => {
                    if (clean) setData(createFormData())
                    setResponse({
                        type: "",
                        message: "",
                    })
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
                    <Form.Label for="form-details-type">
                        Product type *
                    </Form.Label>
                    <Form.Select
                        id="form-details-type"
                        required
                        value={data.type}
                        onChange={(evt) =>
                            setData({ ...data, type: evt.target.value })
                        }
                    >
                        {Object.keys(ProductType)
                            .filter((t) => !isNaN(parseInt(t)))
                            .map((t) => (
                                <option
                                    value={ProductType[
                                        parseInt(t)
                                    ].toLowerCase()}
                                >
                                    {getProductTypeString(
                                        parseInt(t) as ProductType
                                    )}
                                </option>
                            ))}
                    </Form.Select>
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
                    <Form.Label for="form-details-prize">
                        Prize in USD (enter 0 if the product is free, leave
                        empty if unknown)
                    </Form.Label>
                    <Form.Control
                        type="number"
                        id="form-details-prize"
                        value={data.prize !== undefined ? data.prize : ""}
                        onChange={(evt) =>
                            setData({
                                ...data,
                                prize:
                                    evt.target.value !== ""
                                        ? parseInt(evt.target.value)
                                        : undefined,
                            })
                        }
                    />
                    <Form.Label for="form-details-nks">NKS Support</Form.Label>
                    <Form.Select
                        value={data.nks}
                        id="form-details-nks"
                        onChange={(evt) =>
                            setData({ ...data, nks: evt.target.value })
                        }
                    >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </Form.Select>
                    <Form.Label for="form-details-nks-details">
                        Additional NKS information?
                    </Form.Label>
                    <Form.Control
                        disabled={data.nks !== "yes"}
                        as="textarea"
                        id="form-details-nks-details"
                        placeholder="Enter additional information when necessary"
                        value={data.nks_additional}
                        onChange={(evt) =>
                            setData({
                                ...data,
                                nks_additional: evt.target.value,
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

msg += '\n'
                        } else {
                            vendorId = data.vendor
                        }

                        msg += dedent`[${vendorId}.products.${productId}]
    name = "${data.name}"
    type = "${data.type.toLowerCase()}"`
                        msg += "\n"

                        if (data.size !== undefined)
                            msg += `size = ${data.size}\n`
                        if (data.url !== "") msg += `url = "${data.url}"\n`
                        if (data.demo !== "") msg += `demo = "${data.demo}"\n`
                        if (data.prize !== undefined)
                            msg += `prize = ${data.prize}\n`
                        if (data.nks === "yes") {
                            if (data.nks_additional !== "")
                                msg += `nks = "${data.nks_additional}"\n`
                            else msg += "nks = true\n"
                        }
                        if (data.description !== "") {
                            msg += dedent`description = """\
${data.description}"""`
msg += '\n'
}
                        if (data.accessibility_description !== "") {
                            msg += dedent`accessibility_description = """\
${data.description}"""`
msg += '\n'
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
                                subject: `APIAC Product submission for product ${data.name}`,
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
                    Submit product
                </Button>
            </Form>
        </>
    )
}

export default CatalogSubmit
