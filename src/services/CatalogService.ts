import { plainToClass } from "class-transformer"
import Fuse from "fuse.js"
import raw from "raw.macro"
import toml from "toml"
import { OperatingSystem } from "../entities/OperatingSystem"
import Product from "../entities/Product"
import { ProductFilter } from "../entities/ProductFilter"
import { ProductType } from "../entities/ProductType"
import Vendor from "../entities/Vendor"

class CatalogService {
    vendors: Map<string, Vendor>
    products: Product[]

    constructor() {
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

            // special cases for product types and os support
            switch (p.type) {
                case ProductType.KONTAKT4:
                case ProductType.KONTAKT5:
                case ProductType.KONTAKT6:
                case ProductType.KONTAKT7:
                    p.os = [
                        OperatingSystem.WINDOWS,
                        OperatingSystem.MAC_INTEL,
                        OperatingSystem.MAC_ARM,
                    ]
            }

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

            if (f.types.length > 0 && !f.types.includes(p.type)) return false

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
}

export default CatalogService
