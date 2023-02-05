import { Expose, Transform } from "class-transformer";
import ProductType from "./ProductType";

export default class Product {
    @Expose()
    name: string;

    @Expose()
    nks: boolean = false;

    @Expose()
    @Transform(
        ({ value }) => {
            let e =
                ProductType[value.toUpperCase() as keyof typeof ProductType];

            if (e === undefined) return ProductType.UNKNOWN;
            return e;
        },
        {
            toClassOnly: true,
        }
    )
    type: ProductType;

    @Expose()
    size: Number;

    @Expose()
    url: string;
}
