import { Expose } from "class-transformer";

export default class Instrument {
    @Expose()
    name: string;

    @Expose()
    nks: boolean = false;
}
