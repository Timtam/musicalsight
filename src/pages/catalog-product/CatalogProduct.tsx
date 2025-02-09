import { filesize } from "filesize"
import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
import Button from "react-bootstrap/Button"
import ReactMarkdown from "react-markdown"
import { Link, useParams } from "react-router-dom"
import DemoPlayer from "../../components/DemoPlayer"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import Pagination from "../../components/Pagination"
import ProductCard from "../../components/ProductCard"
import { getOperatingSystemString } from "../../entities/OperatingSystem"
import Product from "../../entities/Product"
import CatalogService from "../../services/CatalogService"
import Loading from "../loading/Loading"
import NotFound from "../not-found/NotFound"

const RESULTS_PER_PAGE: number = 20

export function Component() {
    let sorter = useMemo(() => natsort(), [])
    let catalog = useMemo(() => new CatalogService(), [])
    let [demoUrl, setDemoUrl] = useState("")
    let { productId } = useParams<{
        productId: string
    }>()
    let [product, setProduct] = useState(undefined as Product | undefined)
    let [loading, setLoading] = useState(true)
    let [bundleStartIndex, setBundleStartIndex] = useState(0)
    let [bundledStartIndex, setBundledStartIndex] = useState(0)

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
                    Price:{" "}
                    {product!.price === undefined ? (
                        "unknown"
                    ) : product!.price === 0 ? (
                        "free"
                    ) : product!.vendor.aaf ? (
                        <>
                            ${product!.price.toFixed(2)} USD ($
                            {(product!.price / 2).toFixed(2)} USD for{" "}
                            <a href="https://ableartist.org/">
                                Able Artist Foundation members
                            </a>
                            )
                        </>
                    ) : (
                        `$${product!.price.toFixed(2)} USD`
                    )}
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
                        ? filesize(product!.size * 1024 * 1024, {
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
            {Object.keys(product!.additional_links).length > 0 ? (
                <>
                    <h4>Additional Links</h4>
                    <ul aria-label="Additional Links">
                        {Object.entries(product!.additional_links).map(
                            ([k, v]) => (
                                <li>
                                    <a href={v}>{k}</a>
                                </li>
                            ),
                        )}
                    </ul>
                </>
            ) : (
                <h4>No additional links available</h4>
            )}
            {product!.contains.length > 0 ? (
                <>
                    <h4>{`This bundle contains ${product!.contains.length} products`}</h4>
                    <h4>
                        Product {(bundleStartIndex + 1).toString()} to{" "}
                        {Math.min(
                            bundleStartIndex + RESULTS_PER_PAGE,
                            product!.contains.length,
                        ).toString()}{" "}
                        out of {product!.contains.length.toString()}
                    </h4>
                    {product!.contains
                        .sort((a, b) => sorter(a.name, b.name))
                        .filter((p, idx) => {
                            return (
                                idx >= bundleStartIndex &&
                                idx <
                                    Math.min(
                                        bundleStartIndex + RESULTS_PER_PAGE,
                                        product!.contains.length + 1,
                                    )
                            )
                        })
                        .map((p) => {
                            return (
                                <ProductCard
                                    id={p.id}
                                    catalog={catalog}
                                    playDemo={(url: string) => {
                                        setDemoUrl(url)
                                    }}
                                />
                            )
                        })}
                    {product!.contains.length > RESULTS_PER_PAGE ? (
                        <Pagination
                            pages={
                                Math.floor(
                                    product!.contains.length / RESULTS_PER_PAGE,
                                ) +
                                (product!.contains.length % RESULTS_PER_PAGE > 0
                                    ? 1
                                    : 0)
                            }
                            currentPage={
                                bundleStartIndex / RESULTS_PER_PAGE + 1
                            }
                            setPage={(page: number) =>
                                setBundleStartIndex(page * RESULTS_PER_PAGE)
                            }
                        />
                    ) : (
                        ""
                    )}
                </>
            ) : (
                ""
            )}
            {product!.contained.length > 0 ? (
                <>
                    <h4>{`This product is part of ${product!.contained.length} bundles`}</h4>
                    <h4>
                        Bundle {(bundledStartIndex + 1).toString()} to{" "}
                        {Math.min(
                            bundledStartIndex + RESULTS_PER_PAGE,
                            product!.contained.length,
                        ).toString()}{" "}
                        out of {product!.contained.length.toString()}
                    </h4>
                    {product!.contained
                        .sort((a, b) => sorter(a.name, b.name))
                        .filter((p, idx) => {
                            return (
                                idx >= bundledStartIndex &&
                                idx <
                                    Math.min(
                                        bundledStartIndex + RESULTS_PER_PAGE,
                                        product!.contained.length + 1,
                                    )
                            )
                        })
                        .map((p) => {
                            return (
                                <ProductCard
                                    id={p.id}
                                    catalog={catalog}
                                    playDemo={(url: string) => {
                                        setDemoUrl(url)
                                    }}
                                />
                            )
                        })}
                    {product!.contained.length > RESULTS_PER_PAGE ? (
                        <Pagination
                            pages={
                                Math.floor(
                                    product!.contained.length /
                                        RESULTS_PER_PAGE,
                                ) +
                                (product!.contained.length % RESULTS_PER_PAGE >
                                0
                                    ? 1
                                    : 0)
                            }
                            currentPage={
                                bundledStartIndex / RESULTS_PER_PAGE + 1
                            }
                            setPage={(page: number) =>
                                setBundledStartIndex(page * RESULTS_PER_PAGE)
                            }
                        />
                    ) : (
                        ""
                    )}
                </>
            ) : (
                ""
            )}
            <h3>Seeing something unexpected?</h3>
            <p>
                In the case that you expected something else to show up here, or
                you know that the information displayed on this page is wrong,
                why not take a minute and{" "}
                <Link to={`/catalog/submit?p=${product!.id}`}>
                    update this product
                </Link>
                ? I promise it won't take to long.
            </p>
        </>
    )
}
