import { OperatingSystem } from "./OperatingSystem"
import { ProductType } from "./ProductType"

// not a class, but only an object
// redux can only store objects, classes aren't serializable

export interface ProductFilter {
    searchQuery: string
    enabled: boolean
    vendors: string[]
    prizeFrom: number
    prizeTo: number
    nks: boolean | undefined
    types: ProductType[]
    oss: OperatingSystem[]
}

export const createProductFilter = (): ProductFilter => {
    return {
        searchQuery: "",
        enabled: false,
        vendors: [],
        prizeFrom: 0,
        prizeTo: 0,
        nks: undefined,
        types: [],
        oss: [],
    }
}
