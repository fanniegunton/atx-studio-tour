const fs = require("fs/promises")
const path = require("path")
const { get } = require("axios")
const { parse } = require("node-html-parser")

/**
 * This script imports from the `transformData` output and enhances it with
 * data from the studio tour website. Once finished, the -enhanced.ndjson file
 * can be imported into Sanity like this:
 *
 *   sanity dataset import data/west-enriched.ndjson production --replace
 *
 */

const datasetPrefix = "east"

// workaround lack of top-level await in Node 16
;(async () => {
  const artistData = (
    await fs.readFile(
      path.resolve(__dirname, `../data/${datasetPrefix}-output.ndjson`),
      {
        encoding: "utf-8",
      }
    )
  )
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))

  const newData = await artistData.reduce(async (lastPromise, artist) => {
    const memo = await lastPromise

    const { stopNumber, name } = artist

    const slug = slugify(name)
    const url = `https://www.austinstudiotour.org/artists/${slug}`

    const data = await cachedFetch({ url, stopNumber })

    const doc = parse(data)

    const category = doc.querySelector(".navbar + .section h5")?.childNodes[0]
      ?.text
    const mainImage = (
      doc.querySelector(".artist-main-image-container img") ||
      doc.querySelector("img.product-image")
    )?.attributes.src
    const artistPhoto = doc.querySelector(".about-bg img").attributes.src
    const bio = doc.querySelector(
      ".about-artist-grid div:nth-child(2) .w-richtext"
    ).text
    const artistStatement = doc.querySelector(
      ".about-artist-grid div:nth-child(2) .w-richtext:nth-of-type(2)"
    ).text
    const website = doc.querySelector(".about-artist-grid div:nth-child(2) a")
      .attributes.href

    console.log(`Finished #${stopNumber} ${name} (${category}, ${mainImage})`)

    return Promise.resolve([
      ...memo,
      {
        ...artist,
        category,
        astUrl: url,
        website,
        bio,
        artistStatement,
        mainImage:
          mainImage && mainImage !== "https://global-uploads.webflow.com"
            ? {
                _type: "image",
                _sanityAsset: `image@${mainImage}`,
              }
            : undefined,
        artistPhoto:
          artistPhoto && artistPhoto !== "https://global-uploads.webflow.com"
            ? {
                _type: "image",
                _sanityAsset: `image@${artistPhoto}`,
              }
            : undefined,
      },
    ])
  }, Promise.resolve([]))

  console.debug(newData)

  return fs.writeFile(
    path.resolve(__dirname, `../data/${datasetPrefix}-enriched.ndjson`),
    newData.map((row) => JSON.stringify(row)).join("\n")
  )
})()

const slugify = (name) => {
  const slug = name
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/é/g, "e")
    .replace(/ó/g, "o")
    .replace(/č/g, "c")
    .replace(/ú/g, "u")
    .replace(" | ", "-")
    .split(",")[0]
    .replace(/[.&/+]/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .trim()

  return customSlugs[slug] || slug
}

const customSlugs = {
  artrealm: "andrewmatelanickbaxter",
  leticiamosqueda: "leticiamosqueda-twogoatspottery",
  amandazappler: "amandazapplercircleccommunitycenter",
  paigebooth: "paigeboothcircleccommunitycenter",
  verasmiley: "verasmileycircleccommunitycenter",
  lesliekell: "lesliekellcircleccommunitycenter",
  katieconley: "katieconleycircleccommunitycenter",
  supriyakharod: "supriyakharodcircleccommunitycenter",
  elizabethjenkins: "elizabethjenkinscircleccommunitycenter",
  genadestrikeffer: "genadestrikeffercircleccommunitycenter",
  "cristinawhite-jones": "cristinawhite-jonescircleccommunitycenter",
  helenmaryvanstonmarek: "helenmaryvanstonmarekcircleccommunitycenter",
  teodorapogonat: "teodorapogonatcircleccommunitycenter",
  rheapettit: "rheapettitcircleccommunitycenter",
  meenamatai: "meenamataicircleccommunitycenter",
  betelhemmakonnenchristinacolemandeborahrobertstammierubin:
    "betelhemmakonnen-christinacoleman-deborahroberts-tammierubin",
}

const cachedFetch = async ({ url, stopNumber }) => {
  const fileName = path.resolve(__dirname, `../data/stop-${stopNumber}.html`)

  return fs.readFile(fileName, { encoding: "utf-8" }).catch(async () => {
    const data = await get(url)
      .then((res) => res.data)
      .catch((error) => {
        // Avoid printing a huge stack trace for a 404
        if (error.response?.status === 404) {
          throw new Error(`404: ${url}`)
        } else {
          throw error
        }
      })

    await fs.writeFile(fileName, data)

    return data
  })
}
