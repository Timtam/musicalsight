import toml from "@iarna/toml"
import { parse } from "csv-parse/sync"
import fs from "fs/promises"
import fetch from "node-fetch"
import slugify from "slugify"

// we're ignoring products that are no longer maintained or that got incorrect vendor associations here

const IGNORED_PRODUCTS: [string, string][] = [
    ["cinesamples", "90s-retro-trumpets"],
    ["cinesamples", "abbey-road-classic-upright-pianos"],
    ["cinesamples", "cineorch"],
    ["cinesamples", "cineperc-pro"],
    ["cinesamples", "continuum-guitars-2"],
    ["cinesamples", "keyboard-in-blue"],
    ["cinesamples", "piano-in-blue"],
]

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

            let pId = slugify(product["name"], {
                lower: true,
            })

            let pIdSuffix = 1

            while (oProducts[pId] && oProducts[pId]["vendor"] !== vId) {
                pIdSuffix += 1
                pId =
                    slugify(product["name"], {
                        lower: true,
                    }) + `-${pIdSuffix}`
            }

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

            if (
                !IGNORED_PRODUCTS.find(
                    (elem) => elem[0] === vId && elem[1] === pId,
                ) &&
                (!oProducts[pId] ||
                    oProducts[pId]["price"] === undefined ||
                    oProducts[pId]["categories"] === undefined)
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
