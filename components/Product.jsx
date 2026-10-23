import React from 'react';
import Link from 'next/link';

import { urlFor } from '../src/sanity/lib/client';

const Product = ({ product }) => {
  if (!product) return <div>Loading...</div>;

  const { image, name, slug, price } = product;

  return (
    <div>
        <Link href={`/${slug?.current}`}>
         <div className='product-card'>
            <img
              src={urlFor(image && image[0]).url()}
              width={250}
              height={250}
              className='product-image'
              alt={name}
              />
              <p className='product-name'>{name}</p>
              <p className='product-price'>${price}</p>
         </div>
        </Link>
    </div>
  )
}

export default Product