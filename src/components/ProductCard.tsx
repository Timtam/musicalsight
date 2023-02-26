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
                        Vendor:{" "}
                        <Link to={"/catalog/vendor/" + product.vendor.id}>
                            {product.vendor.name}
                        </Link>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        {"Price: " +
                            (product.price === undefined
                                ? "unknown"
                                : product.price === 0
                                ? "free"
                                : `$${product.price}`)}
                    </ListGroup.Item>
                    <ListGroup.Item>{`Categories: ${product.categories
                        .map((c) => c.getName())
                        .sort(sorter)
                        .join(", ")}`}</ListGroup.Item>
                    <ListGroup.Item>{`OS: ${product.os
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
                    <ListGroup.Item>
                        Size:{" "}
                        {product.size !== undefined
                            ? filesize(product.size, {
                                  base: 2,
                                  standard: "jedec",
                              }).toString()
                            : "unknown"}
                    </ListGroup.Item>
                    <ListGroup.Item>
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