export enum ProductType {
    VSTI,
    FX,
    KONTAKT4,
    KONTAKT5,
    KONTAKT6,
    KONTAKT7,
    UNKNOWN,
}

export function getProductTypeString(p: ProductType): string {
    switch (p) {
        case ProductType.VSTI:
            return "Virtual Instrument"
        case ProductType.FX:
            return "FX"
        case ProductType.KONTAKT4:
            return "Kontakt 4+ library"
        case ProductType.KONTAKT5:
            return "Kontakt 5+ library"
        case ProductType.KONTAKT6:
            return "Kontakt 6+ library"
        case ProductType.KONTAKT7:
            return "Kontakt 7+ library"
        case ProductType.UNKNOWN:
            return "unknown"
    }
}
