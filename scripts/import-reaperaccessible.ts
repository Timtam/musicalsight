import fs from "fs/promises"
import toml from "@iarna/toml"
import * as cheerio from "cheerio"
import fetch from "node-fetch"
import slugify from "slugify"

const downloadSource = async () => {
    let res = await fetch(
        "https://reaperaccessible.fr/archives/Native%20Instruments%20Kontakt%20libraries%20catalog.html",
    )
    const buffer = await res.arrayBuffer()
    const decoder = new TextDecoder("iso-8859-1")
    return decoder.decode(buffer)
}

const nextElement = (
    $: ReturnType<cheerio.load>,
    $elem: cheerio.AnyNode,
    filter?: RegExp,
): cheerio.AnyNode => {
    while ($($elem).next().length > 0 &&  
        $($($elem).next()).text().trim() === "" ||
        (filter && filter.test($($($elem).next()).text().replaceAll("\n", " ")))
    ) {
        $elem = $($elem).next()
    }
    if($($elem).next().length === 0) return null
    return $($elem).next()
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

    const html = await downloadSource()
    const $ = cheerio.load(html)

    const $vendors = $("h1")

    for (const $v of $vendors) {
        const vId = slugify($($v).text(), {
            lower: true,
        })
        if (!oVendors[vId]) {
            oVendors[vId] = {
                name: $($v).text().replace("\n", " "),
                url: "",
            }
        }

        let $next = $($v).next()

        let product: Record<string, any>

        do {
            product = {
                vendor: vId,
            }

            if ($($next).next().get(0).tagName === "h3") {
                // some products are grouped, we don't need the group names, but the actual product names
                $next = $($next).next()
            }

            product["name"] = $($next).text().replaceAll("\n", " ")

            if (product["name"].toLowerCase().startsWith(oVendors[vId]["name"].toLowerCase() + " - ")) {
                product["name"] = product["name"].substring(
                    oVendors[vId]["name"].length + 3,
                )
            }

            if (product["name"].toLowerCase().endsWith(" - " + oVendors[vId]["name"].toLowerCase())) {
                product["name"] = product["name"].substring(0,
                    oVendors[vId]["name"].length
                )
            }

            const pId = slugify(product["name"], {
                lower: true,
            })

            $next = nextElement($, $next)

            if ($($next).text().startsWith("Size:")) {
                product["size"] = parseFloat(
                    $($next)
                        .text()
                        .replaceAll("\n", " ")
                        .match(/Size: ?(\d+,?\.?\d*) ?(mo|go)?/i)[1]
                        .replace(",", "."),
                )

                if ($($next).text().toLowerCase().endsWith("go")) {
                    product["size"] *= 1000
                }
                $next = nextElement($, $next)
            }

            if ($($next).text().startsWith("Configuration:")) {
                product["requires"] = [["native-instruments-kontakt"]]

                const version = $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .match(/Configuration: KONTAKT? ?(.*)/i)[1]

                if (version !== "") product["requires"][0].push(version)

                $next = nextElement($, $next)
            }

            const nks = $($next)
                .text()
                .replaceAll("\n", " ")
                .toLowerCase()
                .match(/nks-? ?compatible: (yes|no)/)[1]

            if (nks === "yes") {
                product["nks"] = true
                $next = nextElement($, $next, /nks-? ?compatible: (yes|no)/i)
            }

            if (nks === "no") {
                product["nks"] = false
                $next = nextElement($, $next, /nks-? ?compatible: (yes|no)/i)
            }

            if (
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .startsWith("accessible parameters") ||
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .startsWith("parameters accessible") ||
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .includes("accessibles")
            ) {
                $next = nextElement($, $next)
            }

            if (
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .startsWith("csi zone")
            ) {
                $next = nextElement($, $next)
            }

            if (
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .startsWith("download csi")
            ) {
                $next = nextElement($, $next)
            }

            if (
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .includes("demo here") ||
                $($next)
                    .text()
                    .replaceAll("\n", " ")
                    .toLowerCase()
                    .includes("partie 1 ici.")
            ) {
                product["demo"] = $($($next).children("a")[0]).attr("href")
                $next = nextElement(
                    $,
                    $next,
                    /(.*partie \d+ ici.)|(.*demo here.*)/i,
                )
            }

            if (
                $($next).text().replaceAll("\n", " ").toLowerCase() ===
                    "demo not available." ||
                $($next).text().replaceAll("\n", " ").toLowerCase().startsWith("pas de ")
            ) {
                $next = nextElement($, $next)
            }

            if (
                $($next).text().toLowerCase() === "presentation:" ||
                $($next).text().toLowerCase() === "description:"
            ) {
                product["description"] = ""
                $next = nextElement($, $next)

                while ($next !== null && $($next).get(0).tagName === "p") {
                    product["description"] =
                        product["description"] + "\n" + $($next).text()
                    $next = nextElement($, $next)
                }
            }

            if ($next !== null && 
                $($next).text().toLowerCase() === "comment:" ||
                $($next).text().toLowerCase().startsWith("commentaire")
            ) {
                $next = nextElement($, $next)
            }

            if (!oProducts[pId]) {
                oProducts[pId] = product
            }
        } while ($next !== null && ["h2", "h3"].includes($($next).get(0).tagName))

        if ($next !== null && $($next).get(0).tagName !== "h1") {
            console.log(
                "Unparsed tag " +
                    $($next).get(0).tagName +
                    " found with text " +
                    $($next).text(),
            )
            console.log(
                "Current product: " + JSON.stringify(product, undefined, 2),
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
