import { Expose, Transform } from "class-transformer"
import Category from "./Category"
import { OperatingSystem } from "./OperatingSystem"
import Vendor from "./Vendor"

export default class Product {
    id: string
    vendor: Vendor

    @Expose()
    name: string

    @Expose()
    nks: boolean | string = false

    categories: Category[]

    requires: {
        product: Product
        version?: string
    }[]

    @Expose()
    @Transform(
        ({ value }) => {
            if (value === undefined) return [OperatingSystem.UNKNOWN]

            return [
                ...new Set<OperatingSystem>(
                    value.map((os: string) =>
                        OperatingSystem[
                            os.toUpperCase() as keyof typeof OperatingSystem
                        ] !== undefined
                            ? OperatingSystem[
                                  os.toUpperCase() as keyof typeof OperatingSystem
                              ]
                            : OperatingSystem.UNKNOWN,
                    ),
                ),
            ]
        },
        {
            toClassOnly: true,
        },
    )
    os: OperatingSystem[] = [OperatingSystem.UNKNOWN]

    @Expose()
    @Transform(
        ({ value }) => {
            if (value !== undefined) return value * 1024 * 1024
            return value
        },
        {
            toClassOnly: true,
        },
    )
    size: number

    @Expose()
    url: string = ""

    @Expose()
    demo: string = ""

    @Expose()
    description: string = ""

    @Expose()
    accessibility_description: string = ""

    @Expose()
    price: number | undefined = undefined

    @Expose()
    additional_links: { [key: string]: string } = {}
}
