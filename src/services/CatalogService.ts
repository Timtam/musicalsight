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
    vendors: Vendor[]
    products: Product[]

    constructor() {
        this.vendors = []
        this.products = []
        let data = toml.parse(raw("../data/catalog.toml"))

        for (const [key, value] of Object.entries(data)) {
            let vendor = plainToClass(Vendor, value, {
                excludeExtraneousValues: true,
                exposeDefaultValues: true,
            })

            vendor.id = key

            if (typeof (value as any).products === "object") {
                for (const [k, v] of Object.entries((value as any).products)) {
                    let p = plainToClass(Product, v, {
                        excludeExtraneousValues: true,
                        exposeDefaultValues: true,
                    })

                    p.vendor = vendor
                    p.id = `${vendor.id}-${k}`

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

            this.vendors.push(vendor)
        }
    }

    getProducts(filter: ProductFilter): Product[] {
        let products: Product[]

        if (filter.searchQuery !== "") {
            let fs = new Fuse(this.products, {
                includeScore: true,
                keys: ["name"],
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
                p.prize !== undefined &&
                (f.prizeFrom > 0 || f.prizeTo > 0) &&
                (p.prize < f.prizeFrom || p.prize > f.prizeTo)
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

    getProductsByVendor(id: string): Product[] {
        return this.products.filter((p) => p.vendor.id === id)
    }

    getVendors(): Vendor[] {
        return [...this.vendors]
    }
}

export default CatalogService
