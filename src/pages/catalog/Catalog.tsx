import boolifyString from "boolify-string"
import equal from "deep-equal"
import natsort from "natsort"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import DemoPlayer from "../../components/DemoPlayer"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import Pagination from "../../components/Pagination"
import ProductCard from "../../components/ProductCard"
import { OperatingSystem } from "../../entities/OperatingSystem"
import Product from "../../entities/Product"
import {
    createProductFilter,
    createProductSearchParams,
} from "../../entities/ProductFilter"
import CatalogService from "../../services/CatalogService"
import Search from "./Search"

const RESULTS_PER_PAGE: number = 20

export function Component() {
    let catalog = useMemo(() => {
        return new CatalogService()
    }, [])
    let sorter = useMemo(() => natsort(), [])
    let [demoUrl, setDemoUrl] = useState("")
    let [startIndex, setStartIndex] = useState(0)
    let [products, setProducts] = useState([] as Product[])
    let [searchParams, setSearchParams] = useSearchParams()
    let [filter, setFilter] = useState(createProductFilter())
    let headRef = useRef<HTMLElement>(null)

    useEffect(() => {
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

        let free = searchParams.get("free")

        if (free && free !== "") paramFilter.free = boolifyString(free)

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
                        .includes(o.toUpperCase()),
                )
                .map(
                    (o) =>
                        OperatingSystem[
                            o.toUpperCase() as keyof typeof OperatingSystem
                        ],
                )

        if (!equal(paramFilter, filter)) setFilter(paramFilter)
    }, [catalog, filter, searchParams])

    useEffect(() => {
        setProducts(catalog.getProducts(filter))
        setStartIndex(0)

        if (headRef.current) headRef.current.focus()
    }, [filter, catalog])

    return (
        <>
            <Head title="Accessible Audio Plugin And Software Catalog" />
            <FA
                ref={headRef}
                title="Accessible Audio Plugin And Software Catalog"
            />
            <Link to="/catalog/submit">Submit a new entry</Link>
            <Search
                filter={filter}
                setFilter={(filter) => {
                    setFilter(filter)

                    let up = createProductSearchParams(filter)
                    setSearchParams(up as any)
                }}
                catalog={catalog}
            />
            {products.length > 0 ? (
                <h3>
                    Results {(startIndex + 1).toString()} to{" "}
                    {Math.min(
                        startIndex + RESULTS_PER_PAGE,
                        products.length,
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
                                products.length + 1,
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
        </>
    )
}
