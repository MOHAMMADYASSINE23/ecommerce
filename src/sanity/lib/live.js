// Query with sanityFetch to keep content updated. Render SanityLive in the layout if live updates are enabled.
import { defineLive } from "next-sanity/live";
import { serverClient } from "./serverClient";

export const { sanityFetch, SanityLive } = defineLive({
  client: serverClient.withConfig({ apiVersion: "vX" }),
  serverToken: process.env.SANITY_API_READ_TOKEN,
});
