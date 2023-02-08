import { Expose, Transform } from "class-transformer"
import { ProductType } from "./ProductType"
import Vendor from "./Vendor"

export default class Product {
    id: string
    vendor: Vendor

    @Expose()
    name: string

    @Expose()
    nks: boolean | string = false

    @Expose()
    @Transform(
        ({ value }) => {
            let e = ProductType[value.toUpperCase() as keyof typeof ProductType]

            if (e === undefined) return ProductType.UNKNOWN
            return e
        },
        {
            toClassOnly: true,
        }
    )
    type: ProductType

    @Expose()
    @Transform(
        ({ value }) => {
            if (value !== undefined) return value * 1024 * 1024
            return value
        },
        {
            toClassOnly: true,
        }
    )
    size: Number

    @Expose()
    url: string = ""

    @Expose()
    demo: string = ""

    @Expose()
    description: string = ""

    @Expose()
    prize: number | undefined = undefined
}
