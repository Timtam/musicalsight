import { filesize } from "filesize"
import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
import Button from "react-bootstrap/Button"
import ReactMarkdown from "react-markdown"
import { Link, useParams } from "react-router-dom"
import DemoPlayer from "../../components/DemoPlayer"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import { getOperatingSystemString } from "../../entities/OperatingSystem"
import Product from "../../entities/Product"
import CatalogService from "../../services/CatalogService"
import Loading from "../loading/Loading"
import NotFound from "../not-found/NotFound"

function CatalogProduct() {
    let sorter = useMemo(() => natsort(), [])
    let catalog = useMemo(() => new CatalogService(), [])
    let [demoUrl, setDemoUrl] = useState("")
    let { productId } = useParams<{
        productId: string
    }>()
    let [product, setProduct] = useState(undefined as Product | undefined)
    let [loading, setLoading] = useState(true)

    useEffect(() => {
        if (productId !== undefined && productId !== "") {
            let p = catalog.getProductById(productId)
            setProduct(p)
            setLoading(false)
        }
    }, [productId, catalog])

    if (loading) return <Loading />

    if (!loading && product === undefined) return <NotFound />

    return (
        <>
            <Head title={`${product!.name} - ${product!.vendor.name}`} />
            <FA
                title={`Product details for ${product!.name} by ${
                    product!.vendor.name
                }`}
            />
            <DemoPlayer url={demoUrl} onClose={() => setDemoUrl("")} />
            <ul>
                <li>
                    Demo:{" "}
                    {product!.demo === "" ? (
                        "no demo available"
                    ) : (
                        <Button
                            onClick={() => {
                                setDemoUrl(product!.demo)
                            }}
                        >
                            Play demo
                        </Button>
                    )}
                </li>
                <li>
                    Vendor:{" "}
                    <Link to={`/catalog/vendor/${product!.vendor.id}`}>
                        {product!.vendor.name}
                    </Link>
                </li>
                {product!.url !== "" ? (
                    <li>
                        Website: <a href={product!.url}>{product!.url}</a>
                    </li>
                ) : (
                    ""
                )}
                <li>
                    {"Price: " +
                        (product!.price === undefined
                            ? "unknown"
                            : product!.price === 0
                            ? "free"
                            : `$${product!.price}`)}
                </li>
                <li>{`Categories: ${product!.categories
                    .map((c) => c.getName())
                    .sort(sorter)
                    .join(", ")}`}</li>
                <li>{`OS: ${product!.os
                    .map((os) => getOperatingSystemString(os))
                    .join(", ")}`}</li>
                {product!.requires.length > 0 ? (
                    <li>
                        Requirements:{" "}
                        {product!.requires.map((r) => (
                            <Link to={`/catalog/product/${r.product.id}`}>
                                {r.version
                                    ? `${r.product.name} (minimum version ${r.version}`
                                    : r.product.name}
                            </Link>
                        ))}
                    </li>
                ) : (
                    ""
                )}
                <li>
                    Size:{" "}
                    {product!.size !== undefined
                        ? filesize(product!.size, {
                              base: 2,
                              standard: "jedec",
                          }).toString()
                        : "unknown"}
                </li>
                <li>
                    NKS compatible:{" "}
                    {product!.nks
                        ? typeof product!.nks === "string"
                            ? `yes (${product!.nks})`
                            : "yes"
                        : "no"}
                </li>
            </ul>
            {product!.description !== "" ? (
                <>
                    <h4>Product description</h4>
                    <ReactMarkdown>{product!.description}</ReactMarkdown>
                </>
            ) : (
                <h4>No product description available</h4>
            )}
            {product!.accessibility_description !== "" ? (
                <>
                    <h4>Accessibility description</h4>
                    <ReactMarkdown>
                        {product!.accessibility_description}
                    </ReactMarkdown>
                </>
            ) : (
                <h4>No accessibility description available</h4>
            )}
            <h3>Seeing something unexpected?</h3>
            <p>
                In the case that you expected something else to show up here, or
                you know that the information displayed on this page is wrong,
                why not take a minute and update this product?{" "}
                <Link to={`/catalog/submit?p=${product!.id}`}>
                    Just follow this link
                </Link>
                , I promise it won't take to long.
            </p>
        </>
    )
}

export default CatalogProduct
