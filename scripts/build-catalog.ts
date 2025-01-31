import fs from "fs/promises"
import toml from "@iarna/toml"

const main = async () => {
    let catalog = {
        vendors: {},
        categories: {},
        products: {},
    }
    let vendors: string
    let categories: string
    let products: string

    try {
        vendors = await fs.readFile("./etc/vendors.toml", {
            encoding: "utf-8",
        })
        categories = await fs.readFile("./etc/categories.toml", {
            encoding: "utf-8",
        })
        products = await fs.readFile("./etc/products.toml", {
            encoding: "utf-8",
        })
    } catch (err) {
        return
    }

    catalog.vendors = toml.parse(vendors)
    catalog.categories = toml.parse(categories)
    catalog.products = toml.parse(products)
    fs.writeFile("./src/catalog.json", JSON.stringify(catalog), {
        encoding: "utf-8",
    })
}

main()
