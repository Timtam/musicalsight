import { plainToClass } from "class-transformer";
import raw from "raw.macro";
import toml from "toml";
import Vendor from "../entities/Vendor";

const catalog = raw("../data/catalog.toml");

class CatalogService {
    catalog: Map<string, Vendor>;

    constructor() {
        this.catalog = new Map();
        let data = toml.parse(catalog);

        for (const [key, value] of Object.entries(data)) {
            console.log(value);
            this.catalog.set(
                key,
                plainToClass(Vendor, value, {
                    excludeExtraneousValues: true,
                })
            );
        }

        console.log(this.catalog);
    }
}

export default CatalogService;
