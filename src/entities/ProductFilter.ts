// not a class, but only an object
// redux can only store objects, classes aren't serializable

export interface ProductFilter {
    searchQuery: string
    enabled: boolean
    vendors: string[]
    prizeFrom: number
    prizeTo: number
}

export const createProductFilter = (): ProductFilter => {
    return {
        searchQuery: "",
        enabled: false,
        vendors: [],
        prizeFrom: 0,
        prizeTo: 0,
    }
}
