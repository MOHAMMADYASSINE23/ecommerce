import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01',
  useCdn: true,
};

// This client is safe for browser use: it contains no Sanity API token.
// The storefront dataset should expose only public product content.
export const client = createClient(config);

const builder = imageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);
