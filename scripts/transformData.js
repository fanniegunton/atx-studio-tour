const fs = require("fs")
const path = require("path")

// Update me for each run
const stopType = "east"

const data = fs.readFileSync(
  path.resolve(__dirname, `../data/${stopType}-input.txt`),
  { encoding: "utf-8" }
)

const tourStops = data
  .split("\n")
  .map((line, index, array) =>
    index % 2 === 0 && line.length
      ? {
          _id: `tourStop-${line.substr(0, 3)}`,
          _type: "tourStop",
          stopNumber: line.substr(0, 3),
          name: line.substr(4),
          address: array[index + 1],
          stopType,
        }
      : null
  )
  .filter(Boolean)

fs.writeFileSync(
  path.resolve(__dirname, `./${stopType}-output.ndjson`),
  tourStops.map((item) => JSON.stringify(item)).join("\n")
)
