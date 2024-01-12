import natsort from "natsort"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import DemoPlayer from "../../components/DemoPlayer"
import FA from "../../components/FocusAnchor"
import Head from "../../components/Head"
import Pagination from "../../components/Pagination"
import ProductCard from "../../components/ProductCard"
import Product from "../../entities/Product"
import { createProductFilter } from "../../entities/ProductFilter"
import Vendor from "../../entities/Vendor"
import CatalogService from "../../services/CatalogService"
import Loading from "../loading/Loading"
import NotFound from "../not-found/NotFound"

const RESULTS_PER_PAGE: number = 20

function CatalogVendor() {
    let catalog = useMemo(() => new CatalogService(), [])
    let sorter = useMemo(() => natsort(), [])
    let [demoUrl, setDemoUrl] = useState("")
    let [startIndex, setStartIndex] = useState(0)
    let { vendorId } = useParams<{
        vendorId: string
    }>()
    let [vendor, setVendor] = useState(undefined as Vendor | undefined)
    let [products, setProducts] = useState([] as Product[])
    let [loading, setLoading] = useState(true)

    useEffect(() => {
        if (vendorId !== undefined && vendorId !== "") {
            let v = catalog.getVendorById(vendorId)
            setVendor(v)

            setProducts(
                catalog.getProducts({
                    ...createProductFilter(),
                    vendors: [vendorId],
                }),
            )
            setLoading(false)
        }
    }, [vendorId, catalog])

    if (loading) return <Loading />

    if (!loading && vendor === undefined) return <NotFound />

    return (
        <>
            <Head title={`${vendor!.name} - vendor`} />
            <FA title={`Vendor details for ${vendor!.name}`} />
            <p>
                Website: <a href={vendor!.url}>{vendor!.url}</a>
            </p>
            {products.length > 0 ? (
                <h3>
                    Showing {(startIndex + 1).toString()} to{" "}
                    {Math.min(
                        startIndex + RESULTS_PER_PAGE,
                        products.length,
                    ).toString()}{" "}
                    out of {products.length.toString()} products
                </h3>
            ) : (
                <h3>No products in this catalog!</h3>
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

export default CatalogVendor
