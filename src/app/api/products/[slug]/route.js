import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/serverClient";

const PRODUCT_QUERY = '*[_type == "product" && slug.current == $slug][0]';
const PRODUCTS_QUERY = '*[_type == "product"]';

export async function GET(_request, { params }) {
  const { slug } = await params;

  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]{0,89}$/i.test(slug)) {
    return NextResponse.json({ message: "Invalid product slug." }, { status: 400 });
  }

  try {
    const [product, products] = await Promise.all([
      serverClient.fetch(PRODUCT_QUERY, { slug }),
      serverClient.fetch(PRODUCTS_QUERY),
    ]);

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(
      { product, products: Array.isArray(products) ? products : [] },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Product lookup failed:", error);
    }
    return NextResponse.json({ message: "Unable to load product." }, { status: 500 });
  }
}
