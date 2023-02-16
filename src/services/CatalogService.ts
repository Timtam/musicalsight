import { plainToClass } from "class-transformer"
import Fuse from "fuse.js"
import raw from "raw.macro"
import toml from "toml"
import Category from "../entities/Category"
import { OperatingSystem } from "../entities/OperatingSystem"
import Product from "../entities/Product"
import { ProductFilter } from "../entities/ProductFilter"
import Vendor from "../entities/Vendor"

class CatalogService {
    categories: Map<string, Category>
    vendors: Map<string, Vendor>
    products: Product[]

    constructor() {
        this.categories = new Map()
        this.vendors = new Map()
        this.products = []

        let vendors = toml.parse(raw("../data/vendors.toml"))

        for (const [key, value] of Object.entries(vendors)) {
            let vendor = plainToClass(Vendor, value, {
                excludeExtraneousValues: true,
                exposeDefaultValues: true,
            })

            vendor.id = key

            this.vendors.set(key, vendor)
        }

        let categories = toml.parse(raw("../data/categories.toml"))

        for (const [key, value] of Object.entries(categories)) {
            this.parseCategory(key, value as object)
        }

        let products = toml.parse(raw("../data/products.toml"))

        for (const [key, value] of Object.entries(products)) {
            let p = plainToClass(Product, value, {
                excludeExtraneousValues: true,
                exposeDefaultValues: true,
            })

            if (this.vendors.has((value as any).vendor)) {
                p.vendor = this.vendors.get((value as any).vendor)!
                p.id = `${p.vendor.id}-${key}`
            } else {
                console.log(
                    `invalid product: ${key}, vendor not found: ${
                        (value as any).vendor
                    }`
                )
                continue
            }

            if (!(value as any).categories)
                p.categories = [this.categories.get("unclassified")!]
            else {
                p.categories = (value as any).categories.map((c: string) => {
                    let cat = this.categories.get(c)

                    if (!cat) {
                        console.log(`invalid category ${c} for product ${p.id}`)
                        return null
                    }
                    return cat
                })
            }

            // special cases for product types and os support
            if (
                ["kontakt4", "kontakt5", "kontakt6", "kontakt7"].filter(
                    (k) =>
                        (value as any).categories &&
                        (value as any).categories.includes(k)
                ).length > 0
            )
                p.os = [
                    OperatingSystem.WINDOWS,
                    OperatingSystem.MAC_INTEL,
                    OperatingSystem.MAC_ARM,
                ]

            this.products.push(p)
        }
    }

    getProducts(filter: ProductFilter): Product[] {
        let products: Product[]

        if (filter.searchQuery !== "") {
            let fs = new Fuse(this.products, {
                includeScore: true,
                keys: ["name", "description"],
            })

            products = fs
                .search(filter.searchQuery)
                .filter((r) => r.score! <= 0.5)
                .map((r) => r.item)
        } else products = this.products

        return products.filter((p) => this.filterMatchesProduct(p, filter))
    }

    filterMatchesProduct(p: Product, f: ProductFilter): boolean {
        if (f.enabled === true) {
            if (f.vendors.length > 0 && !f.vendors.includes(p.vendor.id))
                return false

            if (
                p.price !== undefined &&
                (f.priceFrom > 0 || f.priceTo > 0) &&
                (p.price < f.priceFrom || p.price > f.priceTo)
            )
                return false

            if (f.nks !== undefined && f.nks !== !!p.nks) return false

            if (
                f.categories.length > 0 &&
                p.categories.filter((c) => f.categories.includes(c.id))
                    .length === 0
            )
                return false

            if (
                f.oss.length > 0 &&
                p.os.filter((os) => f.oss.includes(os)).length === 0
            )
                return false
        }

        return true
    }

    getProductById(id: string): Product | undefined {
        return this.products.find((p) => p.id === id)
    }

    getVendorById(id: string): Vendor | undefined {
        return this.vendors.get(id)
    }

    getVendors(): Vendor[] {
        return Array.from(this.vendors.values())
    }

    parseCategory(id: string, cat: object): Category {
        let ocat = plainToClass(Category, cat, {
            excludeExtraneousValues: true,
        })

        ocat.id = id
        ocat.subcategories = []

        for (const [key, value] of Object.entries(cat)) {
            if (!Object.keys(ocat).includes(key)) {
                let subcat = this.parseCategory(`${id}.${key}`, value as object)
                subcat.parent = ocat
                ocat.subcategories.push(subcat)
                this.categories.set(`${subcat.id}`, subcat)
            }
        }

        this.categories.set(id, ocat)

        return ocat
    }

    getCategories(): Category[] {
        return Array.from(this.categories.values())
    }
}

export default CatalogService
