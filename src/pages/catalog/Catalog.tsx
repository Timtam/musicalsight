import { useEffect, useMemo, useState } from "react";
import Head from "../../components/Head";
import Product from "../../entities/Product";
import CatalogService from "../../services/CatalogService";
import { useAppSelector } from "../../state/hooks";
import DemoPlayer from "./DemoPlayer";
import Pagination from "./Pagination";
import ProductCard from "./ProductCard";

const RESULTS_PER_PAGE: number = 20;

function Catalog() {
    let catalog = useMemo(() => {
        return new CatalogService();
    }, []);
    let filter = useAppSelector((state) => state.catalogFilter);
    let [demoUrl, setDemoUrl] = useState("");
    let [startIndex, setStartIndex] = useState(0);
    let [products, setProducts] = useState([] as Product[]);

    useEffect(() => {
        setProducts(catalog.getProducts(filter));
    }, [filter, catalog]);

    return (
        <>
            <Head title="Audio Plugin And Instrument Accessibility Catalog" />
            <h3>Audio Plugin And Instrument Accessibility Catalog</h3>
            <h3>
                Results {(startIndex + 1).toString()} to{" "}
                {Math.min(
                    startIndex + RESULTS_PER_PAGE,
                    products.length
                ).toString()}{" "}
                out of {products.length.toString()}
            </h3>
            <DemoPlayer url={demoUrl} onClose={() => setDemoUrl("")} />
            {products
                .filter((p, idx) => {
                    return (
                        idx >= startIndex &&
                        idx <
                            Math.min(
                                startIndex + RESULTS_PER_PAGE,
                                products.length + 1
                            )
                    );
                })
                .map((p) => {
                    return (
                        <ProductCard
                            id={p.id}
                            catalog={catalog}
                            playDemo={(url: string) => {
                                setDemoUrl(url);
                            }}
                        />
                    );
                })}
            <Pagination
                pages={Math.floor(products.length / RESULTS_PER_PAGE) + 1}
                currentPage={startIndex / RESULTS_PER_PAGE + 1}
                setPage={(page: number) =>
                    setStartIndex(page * RESULTS_PER_PAGE)
                }
            />
        </>
    );
}

export default Catalog;
