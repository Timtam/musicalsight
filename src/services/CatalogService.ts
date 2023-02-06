// comment
import { plainToClass } from "class-transformer";
import raw from "raw.macro";
import toml from "toml";
import Product from "../entities/Product";
import ProductFilter from "../entities/ProductFilter";
import Vendor from "../entities/Vendor";

class CatalogService {
    vendors: Vendor[];
    products: Product[];

    constructor() {
        this.vendors = [];
        this.products = [];
        let data = toml.parse(raw("../data/catalog.toml"));

        for (const [key, value] of Object.entries(data)) {
            let vendor = plainToClass(Vendor, value, {
                excludeExtraneousValues: true,
                exposeDefaultValues: true,
            });

            vendor.id = key;

            if (typeof (value as any).products === "object") {
                for (const [k, v] of Object.entries((value as any).products)) {
                    let p = plainToClass(Product, v, {
                        excludeExtraneousValues: true,
                        exposeDefaultValues: true,
                    });

                    p.vendor = vendor;
                    p.id = `${vendor.id}-${k}`;

                    this.products.push(p);
                }
            }

            this.vendors.push(vendor);
        }
    }

    getProducts(filter: ProductFilter): Product[] {
        return this.products.filter((p) =>
            this.filterMatchesProduct(p, filter)
        );
    }

    filterMatchesProduct(p: Product, f: ProductFilter): boolean {
        return true;
    }

    getProductById(id: string): Product | undefined {
        return this.products.find((p) => p.id === id);
    }

    getProductsByVendor(id: string): Product[] {
        return this.products.filter((p) => p.vendor.id === id);
    }
}

export default CatalogService;
