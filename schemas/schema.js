// First, we must import the schema creator
import createSchema from "part:@sanity/base/schema-creator"

// Then import schema types from any plugins that might expose them
import schemaTypes from "all:part:@sanity/base/schema-type"
import { fields } from "sanity-pills"

// Then we give our schema to the builder and provide the result to Sanity
export default createSchema({
  // We name our schema
  name: "default",
  // Then proceed to concatenate our document type
  // to the ones provided by any plugins that are installed
  types: schemaTypes.concat([
    /* Your types here! */
    {
      name: "tourStop",
      type: "document",
      fields: fields({
        stopNumber: { required: true, readOnly: true },
        name: { required: true },
        address: { required: true },
        stopType: { required: true },
        category: {},
        astUrl: {
          title: "Austin Studio Tour Website Page",
          type: "url",
        },
        website: { type: "url" },
        bio: {
          type: "text",
        },
        artistStatement: {
          type: "text",
        },
        mainImage: {
          type: "image",
        },
        artistPhoto: { type: "image" },
      }),
      preview: {
        select: {
          title: "name",
          subtitle: "category",
          media: "mainImage",
        },
      },
    },
  ]),
})
