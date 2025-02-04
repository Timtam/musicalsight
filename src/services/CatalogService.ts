import { plainToClass } from "class-transformer"
import Fuse from "fuse.js"
import catalog from "../catalog.json"
import Category from "../entities/Category"
import { OperatingSystem } from "../entities/OperatingSystem"
import Product from "../entities/Product"
import { ProductFilter } from "../entities/ProductFilter"
import Vendor from "../entities/Vendor"

class CatalogService {
    categories: Map<string, Category>
    vendors: Map<string, Vendor>
    products: Map<string, Product>

    constructor() {
        this.categories = new Map()
        this.vendors = new Map()
        this.products = new Map()

        for (const [key, value] of Object.entries(catalog.vendors)) {
            let vendor = plainToClass(Vendor, value, {
                excludeExtraneousValues: true,
                exposeDefaultValues: true,
            })

            vendor.id = key

            this.vendors.set(key, vendor)
        }

        for (const [key, value] of Object.entries(catalog.categories)) {
            this.parseCategory(key, value as object)
        }

        for (const [key, value] of Object.entries(catalog.products)) {
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
                    }`,
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

            p.requires = []

            this.products.set(p.id, p)
        }

        // we need to do a second run through products to properly resolve product references
        for (const [key, value] of Object.entries(catalog.products)) {
            if (Array.isArray((value as any).requires)) {
                let p = this.products.get(`${(value as any).vendor}-${key}`)
                p!.requires = (value as any).requires.map(
                    (r: string | string[]) => {
                        let or: Product | undefined

                        if (typeof r === "string") or = this.products.get(r)
                        else or = this.products.get(r[0])
                        if (!or) {
                            console.log(
                                `invalid product requirement ${r} for product ${
                                    p!.id
                                }`,
                            )
                            return null
                        }
                        return {
                            product: or,
                            version: Array.isArray(r) ? r[1] : undefined,
                        }
                    },
                )

                // special cases for product types and os support
                if (
                    p!.os.length === 1 &&
                    p!.os[0] === OperatingSystem.UNKNOWN &&
                    p!.requires.length > 0
                )
                    p!.os = p!.requires
                        .map((r) => r.product.os)
                        .reduce((p, c) => p.filter((e) => c.includes(e)))
            }
        }
    }

    getProducts(filter: ProductFilter): Product[] {
        let products: Product[]

        if (filter.searchQuery !== "") {
            let fs = new Fuse(Array.from(this.products.values()), {
                ignoreFieldNorm: true,
                ignoreLocation: true,
                includeScore: true,
                keys: ["name", "description"],
            })

            products = fs
                .search(filter.searchQuery)
                .filter((r) => r.score! <= 0.03)
                .map((r) => r.item)
        } else products = Array.from(this.products.values())

        return products.filter((p) => this.filterMatchesProduct(p, filter))
    }

    filterMatchesProduct(p: Product, f: ProductFilter): boolean {
        if (f.vendors.length > 0 && !f.vendors.includes(p.vendor.id))
            return false

        let priceTo = f.priceTo

        if (priceTo < f.priceFrom)
            priceTo = Math.max(
                ...this.products
                    .values()
                    .map((p) => (p.price === undefined ? 0 : p.price)),
            )

        if (
            (f.free && (p.price === undefined || p.price > 0)) ||
            ((f.priceFrom > 0 || priceTo > 0) &&
                (p.price === undefined ||
                    p.price < f.priceFrom ||
                    p.price > priceTo))
        )
            return false

        if (f.nks !== undefined && f.nks !== !!p.nks) return false

        if (
            f.categories.length > 0 &&
            f.categories.filter((f) =>
                p.categories.some((c) => c.id.startsWith(f)),
            ).length === 0
        )
            return false

        if (
            f.oss.length > 0 &&
            p.os.filter((os) => f.oss.includes(os)).length === 0
        )
            return false

        return true
    }

    getProductById(id: string): Product | undefined {
        return this.products.get(id)
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

    getCategoryById(id: string): Category | undefined {
        return this.categories.get(id)
    }
}

export default CatalogService
