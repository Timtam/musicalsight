import { Expose } from "class-transformer"

export default class Category {
    @Expose()
    name: string

    subcategories: Category[]

    parent: Category

    id: string

    getName(): string {
        if (this.parent) return `${this.parent.getName()} / ${this.name}`
        return this.name
    }
}
