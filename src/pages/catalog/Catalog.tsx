import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
import Head from "../../components/Head"
import Product from "../../entities/Product"
import CatalogService from "../../services/CatalogService"
import { useAppDispatch, useAppSelector } from "../../state/hooks"
import DemoPlayer from "./DemoPlayer"
import Pagination from "./Pagination"
import ProductCard from "./ProductCard"
import Search from "./Search"

const RESULTS_PER_PAGE: number = 20

function Catalog() {
    let catalog = useMemo(() => {
        return new CatalogService()
    }, [])
    let sorter = useMemo(() => natsort(), [])
    let filter = useAppSelector((state) => state.catalogFilter)
    let dispatch = useAppDispatch()
    let [demoUrl, setDemoUrl] = useState("")
    let [startIndex, setStartIndex] = useState(0)
    let [products, setProducts] = useState([] as Product[])

    useEffect(() => {
        setProducts(catalog.getProducts(filter))
    }, [filter, catalog])

    return (
        <>
            <Head title="Audio Plugin And Instrument Accessibility Catalog" />
            <h3>Audio Plugin And Instrument Accessibility Catalog</h3>
            <Search
                filter={filter}
                setFilter={(filter) =>
                    dispatch({ type: "filter/update", payload: filter })
                }
                catalog={catalog}
            />
            {products.length > 0 ? (
                <h3>
                    Results {(startIndex + 1).toString()} to{" "}
                    {Math.min(
                        startIndex + RESULTS_PER_PAGE,
                        products.length
                    ).toString()}{" "}
                    out of {products.length.toString()}
                </h3>
            ) : (
                <h3>No results!</h3>
            )}
            <DemoPlayer url={demoUrl} onClose={() => setDemoUrl("")} />
            {[...products]
                .sort((a, b) => sorter(a.name, b.name))
                .filter((p, idx) => {
                    return (
                        idx >= startIndex &&
                        idx <
                            Math.min(
                                startIndex + RESULTS_PER_PAGE,
                                products.length + 1
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
            {products.length > RESULTS_PER_PAGE ? (
                <Pagination
                    pages={Math.floor(products.length / RESULTS_PER_PAGE) + 1}
                    currentPage={startIndex / RESULTS_PER_PAGE + 1}
                    setPage={(page: number) =>
                        setStartIndex(page * RESULTS_PER_PAGE)
                    }
                />
            ) : (
                ""
            )}
        </>
    )
}

export default Catalog
