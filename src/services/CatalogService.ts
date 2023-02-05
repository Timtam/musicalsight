import { plainToClass } from "class-transformer";
import raw from "raw.macro";
import toml from "toml";
import Vendor from "../entities/Vendor";

class CatalogService {
    catalog: Map<string, Vendor>;

    constructor() {
        this.catalog = new Map();
        let data = toml.parse(raw("../data/catalog.toml"));

        for (const [key, value] of Object.entries(data)) {
            this.catalog.set(
                key,
                plainToClass(Vendor, value, {
                    excludeExtraneousValues: true,
                    exposeDefaultValues: true,
                })
            );
        }

        console.log(this.catalog);
    }

    getAllVendors(): string[] {
        return Array.from(this.catalog.values()).map((v) => v.name);
    }
}

export default CatalogService;
