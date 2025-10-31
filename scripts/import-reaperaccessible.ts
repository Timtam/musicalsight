import toml from "@iarna/toml"
import { parse } from "csv-parse/sync"
import fs from "fs/promises"
import fetch from "node-fetch"
import slugify from "slugify"

const downloadSource = async () => {
    let res = await fetch(
        "https://reaperaccessible.fr/catalog/data/catalog.csv",
    )
    return await res.text()
}

const parseSize = (s: string): float | undefined => {
    if (s === "") return

    let size: number | undefined

    let match = s.match(/(\d+,?\.?\d*) ?(MB|GB)?/i)

    if (match !== null) {
        size = parseFloat(match[1].replace(",", "."))
    }

    if (size === undefined && !["No"].includes(s)) {
        throw new Error(`Unable to parse size from ${s}`)
    }

    if (s.endsWith("GB")) {
        size *= 1000
    }

    return size
}

const parseRequirement = (
    req: string,
    v: string,
): string | string[] | undefined => {
    if (req === "") return

    let requirement: string = ""
    let version: string = ""

    switch (req) {
        case "Kontakt Full":
            requirement = "native-instruments-kontakt"
            break
        case "Kontakt Player":
            requirement = "native-instruments-kontakt-player"
            break
        case "Sforzando":
            requirement = "plogue-sforzando"
            break
        default:
            throw new Error(`unknown requirement ${req}`)
    }

    if (v !== "") {
        version = v
    }

    if (version === "" && requirement !== "") return requirement
    else if (version !== "" && requirement !== "") return [requirement, version]
    throw new Error(`invalid requirements ${r} with version ${v} supplied`)
}

/*
const parseCategories = (
    type: string,
    itype: string,
    etype: string,
): string[] => {
    switch (type) {
        case "Instrument":
            switch (itype.trim().toLowerCase()) {
                case "electric piano":
                case "hybrid piano":
                case "symphonic strings":
                case "double bass ensemble":
                case "solo violin":
                case "keys":
                case "keyboard":
                case "organ":
                case "tape keyboard":
                case "piano":
                case "toy piano":
                    return ["vsti.keys"]
                case "string ensemble":
                case "strings":
                case "violin":
                case "viola":
                case "cello":
                case "double bass":
                case "harp":
                    return ["vsti.strings"]
                case "preset browser":
                case "workstation":
                case "synth":
                    return ["vsti.synthesizer"]
                case "percussion":
                case "mallets":
                case "percussion ensemble":
                case "rhythm/percussion":
                    return ["vsti.percussion"]
                case "orchestra":
                case "orchestral effects":
                    return ["vsti.brass", "vsti.strings", "vsti.woodwinds"]
                case "bassoon":
                case "clarinet":
                case "flute":
                case "oboe":
                case "woodwind ensemble":
                case "woodwinds":
                case "alto saxophone":
                case "tenor saxophone":
                case "soprano saxophone":
                case "baritone saxophone":
                case "bass clarinet":
                case "english horn":
                case "contrabassoon":
                    return ["vsti.woodwinds"]
                case "world instruments":
                case "banjo":
                case "didgeridoo":
                case "dhol ensemble":
                case "xiao flute":
                case "dobro":
                case "dulcimer":
                case "guitar dobro":
                case "guzheng":
                case "chinese lute":
                case "transverse flute":
                case "vertical bamboo flute":
                case "transverse bamboo flute":
                case "erhu":
                case "guqin":
                case "konghou (chinese harp)":
                    return ["vsti.ethnic"]
                case "chinese percussion ensemble":
                    return ["vsti.ethnic", "vsti.percussion"]
                case "producer tool":
                    return ["vsti.drums", "vsti.synthesizer"]
                case "vocal":
                case "choir":
                case "vocal phrases":
                    return ["vsti.vocal"]
                case "cinematic effects":
                case "effects/sound design":
                case "hybrid sound design":
                case "sound design":
                    return ["vsti.sound-design"]
                case "guitar ambience":
                    return ["vsti.ambient"]
                case "brass":
                case "trumpet":
                case "flugelhorn":
                case "french horn":
                case "euphonium":
                case "tuba":
                case "trombone":
                case "brass ensemble":
                    return ["vsti.brass"]
                case "drum kit":
                case "tom ensemble/percussion":
                case "steel tongue drum":
                case "drum synth":
                    return ["vsti.drums"]
                case "sampler":
                    return ["vsti.sampler"]
                case "groove workstation":
                    return [
                        "vsti.drums",
                        "vsti.percussion",
                        "vsti.synthesizer",
                        "vsti.sound-design",
                    ]
                case "12-string acoustic guitar":
                case "acoustic bass":
                case "electric bass (5-string)":
                case "electric bass (6-string)":
                case "acoustic guitar":
                case "classical guitar":
                case "electric bass":
                case "electric bass (fretless)":
                case "electric guitar":
                case "guitar":
                case "jumbo acoustic guitar":
                case "slide guitar":
                case "ukulele":
                case "upright bass":
                    return ["vsti.guitar"]
                case "instruments bundle":
                case "instrument collection":
                case "":
                    return ["vsti"]
                default:
                    throw new Error(`Unknown instrument type ${itype}`)
            }
        case "Effect":
            switch (etype) {
                case "":
                    return ["fx"]
                default:
                    throw new Error(`Unknown effect type ${etype}`)
            }
        case "":
            return
        default:
            throw new Error(`Unknown product type ${type}`)
    }
}
*/

const main = async () => {
    let vendors: string
    let products: string

    try {
        vendors = await fs.readFile("./etc/vendors.toml", {
            encoding: "utf-8",
        })
        products = await fs.readFile("./etc/products.toml", {
            encoding: "utf-8",
        })
    } catch (err) {
        return
    }

    let oProducts: Record<string, any> = toml.parse(products)
    let oVendors: Record<string, any> = toml.parse(vendors)

    const csv = await downloadSource()
    const raData = parse(csv, {
        delimiter: ",",
        columns: true,
        skip_empty_lines: true,
        bom: true,
        record_delimiter: "\r\n",
    })

    let line = 1

    for (const raProduct of raData) {
        line += 1
        try {
            const vId = slugify(raProduct["Developer"], {
                lower: true,
            })

            if (!oVendors[vId]) {
                oVendors[vId] = {
                    name: raProduct["Developer"],
                    url: "",
                }
            }

            let product: Record<string, any> = {
                vendor: vId,
            }

            product["name"] = raProduct["Name"]

            const pId = slugify(product["name"], {
                lower: true,
            })

            product["size"] = parseSize(raProduct["Size"])

            product["requires"] = [
                parseRequirement(
                    raProduct["SamplerType"],
                    raProduct["SamplerMinVersion"],
                ),
            ]

            if (raProduct["NKSCompatible"] === "Yes") {
                product["nks"] = true
            } else if (raProduct["NKSCompatible"] === "No") {
                product["nks"] = false
            } else if (raProduct["NKSCompatible"] === "ThirdParty") {
                product["nks"] =
                    "NKS is provided by third-party products (see links section)"
                if (raProduct["ThirdpartyNKSLink"])
                    product["additional_links"] = {
                        "NKS Snapshots": raProduct["ThirdpartyNKSLink"],
                    }
            }

            if (raProduct["AudioDemoURL"].startsWith("http")) {
                product["demo"] = raProduct["AudioDemoURL"]
            } else if (raProduct["AudioDemoURL"] !== "") {
                product["demo"] = encodeURI(
                    `https://reaperaccessible.fr/catalog/demos/${raProduct["AudioDemoURL"]}`,
                )
            }

            if (raProduct["DescriptionEN"])
                product["description"] = raProduct["DescriptionEN"]
            if (raProduct["ProductURL"])
                product["url"] = raProduct["ProductURL"]

            if (raProduct["Notes"])
                product["accessibility_description"] = raProduct["Notes"]

            /*
            product["categories"] = parseCategories(
                raProduct["Type"],
                raProduct["InstrumentTypeEN"],
                raProduct["EffectTypeEN"],
            )
*/

            if (
                !oProducts[pId] ||
                oProducts[pId]["price"] === undefined ||
                oProducts[pId]["categories"] === undefined
            ) {
                oProducts[pId] = product
            }
        } catch (e) {
            console.log(
                `Error for product ${raProduct["Name"]} by vendor ${raProduct["Developer"]} at record ${line}: ${e.message}`,
            )
            return
        }
    }

    products = toml.stringify(oProducts)
    vendors = toml.stringify(oVendors)

    fs.writeFile("./etc/products.toml", products, {
        encoding: "utf-8",
    })
    fs.writeFile("./etc/vendors.toml", vendors, {
        encoding: "utf-8",
    })
}

main()
