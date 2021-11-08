import sanityClient from "part:@sanity/base/client"

const client = sanityClient.withConfig({
  apiVersion: "2021-11-07",
})

export default client
