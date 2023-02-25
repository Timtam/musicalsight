import boolifyString from "boolify-string"
import equal from "deep-equal"
import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import DemoPlayer from "../../components/DemoPlayer"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import Pagination from "../../components/Pagination"
import ProductCard from "../../components/ProductCard"
import { OperatingSystem } from "../../entities/OperatingSystem"
import Product from "../../entities/Product"
import { createProductFilter } from "../../entities/ProductFilter"
import CatalogService from "../../services/CatalogService"
import { useAppDispatch, useAppSelector } from "../../state/hooks"
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
    let [searchParams, setSearchParams] = useSearchParams()
    let [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!loading) return

        let paramFilter = createProductFilter()

        let searchQuery = searchParams.get("q")

        if (searchQuery && searchQuery !== "")
            paramFilter.searchQuery = searchQuery

        let priceFrom = searchParams.get("pf")

        if (priceFrom && priceFrom !== "")
            paramFilter.priceFrom = parseInt(priceFrom, 10) || 0

        let priceTo = searchParams.get("pt")

        if (priceTo && priceTo !== "")
            paramFilter.priceTo = parseInt(priceTo, 10) || 0

        let vendors = searchParams.get("v")

        if (vendors && vendors !== "")
            paramFilter.vendors = vendors
                .split(",")
                .filter((v) => catalog.getVendorById(v) !== undefined)

        let nks = searchParams.get("nks")

        if (nks && nks !== "") paramFilter.nks = boolifyString(nks)

        let categories = searchParams.get("c")

        if (categories && categories !== "")
            paramFilter.categories = categories
                .split(",")
                .filter((c) => catalog.getCategoryById(c) !== undefined)

        let os = searchParams.get("os")

        if (os && os !== "")
            paramFilter.oss = os
                .split(",")
                .filter((o) =>
                    Object.keys(OperatingSystem)
                        .filter((ko) => isNaN(parseInt(ko, 10)))
                        .includes(o.toUpperCase())
                )
                .map(
                    (o) =>
                        OperatingSystem[
                            o.toUpperCase() as keyof typeof OperatingSystem
                        ]
                )

        if (
            !equal(paramFilter, createProductFilter()) &&
            !equal(paramFilter, filter)
        )
            dispatch({
                type: "filter/update",
                payload: paramFilter,
            })

        setLoading(false)
    }, [catalog, dispatch, filter, searchParams, loading])

    useEffect(() => {
        let up = {} as {
            c?: string
            nks?: string
            os?: string
            pf?: string
            pt?: string
            q?: string
            v?: string
        }

        setProducts(catalog.getProducts(filter))
        setStartIndex(0)

        if (filter.searchQuery !== "") up.q = filter.searchQuery
        if (filter.priceFrom > 0) up.pf = filter.priceFrom.toString()
        if (filter.priceTo > 0) up.pt = filter.priceTo.toString()
        if (filter.vendors.length > 0) up.v = filter.vendors.join(",")
        if (filter.nks !== undefined) up.nks = filter.nks.toString()
        if (filter.categories.length > 0) up.c = filter.categories.join(",")
        if (filter.oss.length > 0)
            up.os = filter.oss
                .map((o: OperatingSystem) => OperatingSystem[o])
                .map((o: string) => o.toLowerCase())
                .join(",")

        setSearchParams(up)
    }, [filter, catalog, setSearchParams])

    return (
        <>
            <Head title="Audio Plugin And Instrument Accessibility Catalog" />
            <FA title="Audio Plugin And Instrument Accessibility Catalog" />
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
                    pages={
                        Math.floor(products.length / RESULTS_PER_PAGE) +
                        (products.length % RESULTS_PER_PAGE > 0 ? 1 : 0)
                    }
                    currentPage={startIndex / RESULTS_PER_PAGE + 1}
                    setPage={(page: number) =>
                        setStartIndex(page * RESULTS_PER_PAGE)
                    }
                />
            ) : (
                ""
            )}
            <h3>Missing something?</h3>
            Do you know a product that we're currently missing here? You can
            help the catalog grow by{" "}
            <Link to="/catalog/submit">submitting an entry here</Link>.
        </>
    )
}

export default Catalog
