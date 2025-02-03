import { Expose } from "class-transformer"

export default class Vendor {
    id: string

    @Expose()
    name: string

    @Expose()
    url: string

    @Expose()
    aaf: boolean = false
}
