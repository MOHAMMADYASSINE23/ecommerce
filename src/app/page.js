import React from 'react';
import { serverClient } from '../sanity/lib/serverClient';
import { Product, FooterBanner, HeroBanner } from '../../components'

export const dynamic = "force-dynamic";

const Page = async () => {
  const query = '*[_type == "product"]{_id, name, slug, price, details, image}';
  const products = await serverClient.fetch(query);

  const bannerQuery = '*[_type == "banner"]';
  const bannerData = await serverClient.fetch(bannerQuery);

  return (
    <div>
      <HeroBanner heroBanner={bannerData.length && bannerData[0]} />

      <div className="products-heading">
        <h2>Best Selling Products</h2>
        <p>Speakers of many variations</p>
      </div>
      <div className="products-container">
        {products?.map((product) => <Product key={product._id} product={product} />)}
           </div>

      <FooterBanner footerBanner={bannerData.length && bannerData[0]} />
    </div>
  )
}

export default Page