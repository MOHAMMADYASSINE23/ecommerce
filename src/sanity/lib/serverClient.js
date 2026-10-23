import "server-only";

import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

export const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

const imageBuilder = imageUrlBuilder(serverClient);

export const serverUrlFor = (source) => imageBuilder.image(source);
