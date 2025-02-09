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
    private _size?: number

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

    // this product is part of a bundle
    contained: Product[] = []

    get size(): number | undefined {
        return getSize(this._size, this.contains)
    }

    get categories(): Category[] {
        return getCategories(this._categories, this.contains)
    }

    get requires(): {
        product: Product
        version?: string
    }[] {
        return getRequires(this._requires, this.contains)
    }

    get os(): OperatingSystem[] {
        return getOperatingSystems(this._os, this.requires, this.contains)
    }
}

export const getCategories = (
    categories: Category[],
    contains: Product[],
): Category[] => {
    if (contains.length > 0)
        return contains
            .reduce(
                (acc: Category[], p: Product) => acc.concat(p.categories),
                [],
            )
            .filter((c, i, a) => a.indexOf(c) === i)
    else return categories
}

export const getRequires = (
    requires: {
        product: Product
        version?: string
    }[],
    contains: Product[],
): {
    product: Product
    version?: string
}[] => {
    if (contains.length > 0) {
        const reqs = new Map<Product, string | undefined>()

        contains
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
            .forEach((r) => {
                if (
                    !reqs.has(r.product) ||
                    (r.version !== undefined &&
                        reqs.get(r.product) === undefined) ||
                    (r.version !== undefined &&
                        reqs.get(r.product) !== undefined &&
                        compareVersions(
                            r.version as string,
                            reqs.get(r.product) as string,
                        ) === 1)
                )
                    reqs.set(r.product, r.version)
            })

        return Array.from(
            reqs.entries(),
            ([product, version]): {
                product: Product
                version?: string
            } => ({
                product: product,
                version: version,
            }),
        )
    } else return requires
}

export const getOperatingSystems = (
    os: OperatingSystem[],
    requires: {
        product: Product
        version?: string
    }[],
    contains: Product[],
): OperatingSystem[] => {
    if (contains.length > 0)
        return contains
            .reduce(
                (acc: OperatingSystem[], p: Product) => acc.concat(p.os),
                [],
            )
            .filter((c, i, a) => a.indexOf(c) === i)
    else {
        // special cases for product types and os support
        if (
            os.length === 1 &&
            os[0] === OperatingSystem.UNKNOWN &&
            requires.length > 0
        )
            return requires
                .map((r) => r.product.os)
                .reduce((p, c) => p.filter((e) => c.includes(e)))
        else return os
    }
}

export const getSize = (
    size: number | undefined,
    contains: Product[],
): number | undefined => {
    if (contains.length > 0) {
        if (contains.some((c) => c.size === undefined)) return undefined
        return contains.reduce(
            (acc: number, product: Product) => acc + (product.size as number),
            0,
        )
    } else return size
}
