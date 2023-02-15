import { Expose } from "class-transformer"

export default class Category {
    @Expose()
    name: string

    subcategories: Category[]

    parent: Category

    id: string
}
