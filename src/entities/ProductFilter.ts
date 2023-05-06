import { OperatingSystem } from "./OperatingSystem"

// not a class, but only an object
// redux can only store objects, classes aren't serializable

export interface ProductFilter {
    searchQuery: string
    vendors: string[]
    priceFrom: number
    priceTo: number
    categories: string[]
    nks: boolean | undefined
    oss: OperatingSystem[]
}

export const createProductFilter = (): ProductFilter => {
    return {
        searchQuery: "",
        vendors: [],
        priceFrom: 0,
        priceTo: 0,
        categories: [],
        nks: undefined,
        oss: [],
    }
}

export interface ProductSearchParams {
    c?: string
    nks?: string
    os?: string
    pf?: string
    pt?: string
    q?: string
    v?: string
}

export const createProductSearchParams = (
    filter: ProductFilter
): ProductSearchParams => {
    let up: ProductSearchParams = {}

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

    return up
}
