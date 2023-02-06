import { filesize } from "filesize";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { Link } from "react-router-dom";
import CatalogService from "../../services/CatalogService";

function ProductCard({ catalog, id }: { catalog: CatalogService; id: string }) {
    let product = catalog.getProductById(id);

    if (product === undefined) return <p>Product not found!</p>;

    return (
        <>
            <Card>
                <Card.Header as="h4">
                    <Link to={"/catalog/product/" + product.id}>
                        {product.name}
                    </Link>
                </Card.Header>
                <ListGroup variant="flush">
                    <ListGroup.Item>
                        Vendor:{" "}
                        <Link to={"/catalog/vendor/" + product.vendor.id}>
                            {product.vendor.name}
                        </Link>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        Size:{" "}
                        {filesize(product.size, {
                            base: 2,
                            standard: "jedec",
                        }).toString()}
                    </ListGroup.Item>
                    <ListGroup.Item>
                        NKS compatible: {product.nks ? "yes" : "no"}
                    </ListGroup.Item>
                </ListGroup>
            </Card>
        </>
    );
}

export default ProductCard;
