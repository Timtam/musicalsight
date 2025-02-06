import { Expose, Transform } from "class-transformer"
import { compareVersions } from "compare-versions"
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

    _categories: Category[]

    _requires: {
        product: Product
        version?: string
    }[]

    @Expose({ name: "os" })
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
    private _os: OperatingSystem[] = [OperatingSystem.UNKNOWN]

    @Expose({ name: "size" })
    @Transform(
        ({ value }) => {
            if (value !== undefined) return value * 1024 * 1024
            return value
        },
        {
            toClassOnly: true,
        },
    )
    private _size: number

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

    // this product is a bundle and contains other products
    contains: Product[]

    get size(): number {
        if (this.contains.length > 0)
            return this.contains.reduce(
                (acc: number, product: Product) => acc + product._size,
                0,
            )
        else return this._size
    }

    get categories(): Category[] {
        if (this.contains.length > 0)
            return this.contains
                .reduce(
                    (acc: Category[], p: Product) => acc.concat(p.categories),
                    [],
                )
                .filter((c, i, a) => a.indexOf(c) === i)
        else return this._categories
    }

    get requires(): {
        product: Product
        version?: string
    }[] {
        if (this.contains.length > 0)
            return this.contains
                .reduce(
                    (
                        acc: {
                            product: Product
                            version?: string
                        }[],
                        p: Product,
                    ) => acc.concat(p.requires),
                    [],
                )
                .filter((r, _, a) =>
                    a.every((re) => {
                        if (r.product.id === re.product.id) {
                            if (
                                r.version !== undefined &&
                                re.version === undefined
                            )
                                return true
                            else if (
                                r.version === undefined &&
                                re.version !== undefined
                            )
                                return false
                            else
                                return (
                                    compareVersions(
                                        r.version as string,
                                        re.version as string,
                                    ) === 1
                                )
                        } else return true
                    }),
                )
        else return this._requires
    }

    get os(): OperatingSystem[] {
        if (this.contains.length > 0)
            return this.contains
                .reduce(
                    (acc: OperatingSystem[], p: Product) => acc.concat(p.os),
                    [],
                )
                .filter((c, i, a) => a.indexOf(c) === i)
        else {
            // special cases for product types and os support
            if (
                this._os.length === 1 &&
                this._os[0] === OperatingSystem.UNKNOWN &&
                this.requires.length > 0
            )
                return this.requires
                    .map((r) => r.product.os)
                    .reduce((p, c) => p.filter((e) => c.includes(e)))
            else return this._os
        }
    }
}
