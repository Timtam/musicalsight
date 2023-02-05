import { Expose, plainToClass, Transform } from "class-transformer";
import Product from "./Product";

export default class Vendor {
    @Expose()
    name: string;

    @Expose()
    url: string;

    @Expose()
    @Transform(
        ({ value }) => {
            let m = new Map();
            for (const [k, v] of Object.entries(value)) {
                m.set(
                    k,
                    plainToClass(Product, v, {
                        excludeExtraneousValues: true,
                        exposeDefaultValues: true,
                    })
                );
            }
            return m;
        },
        {
            toClassOnly: true,
        }
    )
    products: Map<string, Product>;
}
