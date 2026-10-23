'use client';

import React, { useState, useEffect, use } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { client, urlFor } from '../../../src/sanity/lib/client';
import { Product } from '../../../components';
import { useStateContext } from '../../../context/StateContext';

const ProductDetails = ({ params }) => {
  const { slug } = use(params);
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [index, setIndex] = useState(0);
  const { decQty, incQty, qty, onAdd, setShowCart } = useStateContext();

  useEffect(() => {
    const fetchProductData = async () => {
      const query = '*[_type == "product" && slug.current == $slug][0]';
      const productsQuery = '*[_type == "product"]';

      const productData = await client.fetch(query, { slug });
      const productsData = await client.fetch(productsQuery);

      setProduct(productData);
      setProducts(productsData);
    };

    fetchProductData();
  }, [slug]);

  if (!product) {
    return <div>Loading...</div>;
  }

  const { image, name, details, price } = product;

  const handleBuyNow = () => {
    onAdd(product, qty);
    setShowCart(true); // Open the cart after adding item
  };

  const handleAddToCart = () => {
    onAdd(product, qty);
    setShowCart(true); // Open the cart after adding item
  };

  return (
    <div>
      <div className="product-detail-container">
        <div>
          <div className="image-container">
            <img src={urlFor(image && image[index]).url()} className="product-detail-image" />
          </div>
          <div className="small-images-container">
            {image?.map((item, i) => (
              <img
                key={i}
                src={urlFor(item).url()}
                className={i === index ? 'small-image selected-image' : 'small-image'}
                onMouseEnter={() => setIndex(i)}
              />
            ))}
          </div>
        </div>

        <div className="product-detail-desc">
          <h1>{name}</h1>
          <div className="reviews">
            <div>
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiOutlineStar />
            </div>
            <p>
              (20)
            </p>
          </div>
          <h4>Details: </h4>
          <p>{details}</p>
          <p className="price">${price}</p>
          <div className="quantity">
            <h3>Quantity:</h3>
            <p className="quantity-desc">
              <span className="minus" onClick={decQty}><AiOutlineMinus /></span>
              <span className="num">{qty}</span>
              <span className="plus" onClick={incQty}><AiOutlinePlus /></span>
            </p>
          </div>
          <div className="buttons">
            <button type="button" className="add-to-cart" onClick={handleAddToCart}>Add to Cart</button>
            <button type="button" className="buy-now" onClick={handleBuyNow}>Buy Now</button>
          </div>
        </div>
      </div>

      <div className="maylike-products-wrapper">
          <h2>You may also like</h2>
          <div className="marquee">
            <div className="maylike-products-container track">
              {products.map((item) => (
                <Product key={item._id} product={item} />
              ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProductDetails;