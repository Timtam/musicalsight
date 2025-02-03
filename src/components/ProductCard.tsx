import { filesize } from "filesize"
import natsort from "natsort"
import { useMemo } from "react"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import ListGroup from "react-bootstrap/ListGroup"
import { Link } from "react-router-dom"
import { getOperatingSystemString } from "../entities/OperatingSystem"
import CatalogService from "../services/CatalogService"

function ProductCard({
    catalog,
    id,
    playDemo,
}: {
    catalog: CatalogService
    id: string
    playDemo: (url: string) => void
}) {
    let sorter = useMemo(() => natsort(), [])
    let product = catalog.getProductById(id)

    if (product === undefined) return <p>Product not found!</p>

    return (
        <>
            <Card>
                <Card.Header as="h4">
                    <Link to={"/catalog/product/" + product.id}>
                        {product.name}
                    </Link>{" "}
                    (
                    {product!.demo === "" ? (
                        "no demo available"
                    ) : (
                        <Button onClick={() => playDemo(product!.demo)}>
                            Play demo
                        </Button>
                    )}
                    )
                </Card.Header>
                <ListGroup>
                    <ListGroup.Item>
                        <Link to={"/catalog/vendor/" + product.vendor.id}>
                            Vendor: {product.vendor.name}
                        </Link>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        Price:{" "}
                        {product.price === undefined ? (
                            "unknown"
                        ) : product.price === 0 ? (
                            "free"
                        ) : product.vendor.aaf ? (
                            <>
                                ${product.price.toFixed(2)} USD ($
                                {(product.price / 2).toFixed(2)} USD for{" "}
                                <a href="https://ableartist.org/">
                                    Able Artist Foundation members
                                </a>
                                )
                            </>
                        ) : (
                            `$${product.price.toFixed(2)} USD`
                        )}
                    </ListGroup.Item>
                    <ListGroup.Item>
                        Categories:{" "}
                        {product.categories
                            .sort((a, b) => sorter(a.getName(), b.getName()))
                            .map((c) => {
                                return (
                                    <Link to={`/catalog?c=${c.id}`}>
                                        {c.getName()}
                                    </Link>
                                )
                            })}
                    </ListGroup.Item>
                    <ListGroup.Item disabled>{`OS: ${product.os
                        .map((os) => getOperatingSystemString(os))
                        .join(", ")}`}</ListGroup.Item>
                    {product.requires.length > 0 ? (
                        <ListGroup.Item>
                            Requirements:{" "}
                            {product.requires.map((r) => (
                                <Link to={`/catalog/product/${r.product.id}`}>
                                    {r.version
                                        ? `${r.product.name} (minimum version ${r.version})`
                                        : r.product.name}
                                </Link>
                            ))}
                        </ListGroup.Item>
                    ) : (
                        ""
                    )}
                    <ListGroup.Item disabled>
                        Size:{" "}
                        {product.size !== undefined
                            ? filesize(product.size, {
                                  base: 2,
                                  standard: "jedec",
                              }).toString()
                            : "unknown"}
                    </ListGroup.Item>
                    <ListGroup.Item disabled>
                        NKS compatible:{" "}
                        {product.nks
                            ? typeof product.nks === "string"
                                ? `yes (${product.nks})`
                                : "yes"
                            : "no"}
                    </ListGroup.Item>
                </ListGroup>
            </Card>
        </>
    )
}

export default ProductCard
