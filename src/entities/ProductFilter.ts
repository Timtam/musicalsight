import { OperatingSystem } from "./OperatingSystem"

// not a class, but only an object
// redux can only store objects, classes aren't serializable

export interface ProductFilter {
    searchQuery: string
    enabled: boolean
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
        enabled: false,
        vendors: [],
        priceFrom: 0,
        priceTo: 0,
        categories: [],
        nks: undefined,
        oss: [],
    }
}
