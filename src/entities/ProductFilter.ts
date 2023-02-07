// not a class, but only an object
// redux can only store objects, classes aren't serializable

export interface ProductFilter {
    searchQuery: string;
}

export const createProductFilter = (): ProductFilter => {
    return {
        searchQuery: "",
    };
};
